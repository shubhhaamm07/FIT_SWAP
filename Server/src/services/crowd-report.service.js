const prisma = require('../lib/prisma');

const REPORT_DURATION_MS = 90 * 60 * 1000;
const HISTORY_WINDOW_DAYS = 30;
const HISTORY_RECORD_COOLDOWN_MS = 30 * 60 * 1000;
const LEVELS = new Set(['LOW', 'MEDIUM', 'HIGH']);
const LEVEL_SCORES = { LOW: 1, MEDIUM: 2, HIGH: 3 };
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_SLOTS = [
    { label: '12–6 AM', startHour: 0, endHour: 6 },
    { label: '6–9 AM', startHour: 6, endHour: 9 },
    { label: '9 AM–12 PM', startHour: 9, endHour: 12 },
    { label: '12–3 PM', startHour: 12, endHour: 15 },
    { label: '3–6 PM', startHour: 15, endHour: 18 },
    { label: '6–9 PM', startHour: 18, endHour: 21 },
    { label: '9 PM–12 AM', startHour: 21, endHour: 24 }
];

const indiaDateParts = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', hourCycle: 'h23'
});

const levelFromAverage = (average) => average < 1.67 ? 'LOW' : average < 2.34 ? 'MEDIUM' : 'HIGH';

const serialiseBucket = (bucket) => {
    const averageScore = bucket.samples ? bucket.scoreTotal / bucket.samples : null;
    return {
        label: bucket.label,
        samples: bucket.samples,
        averageLevel: averageScore ? levelFromAverage(averageScore) : null,
        // 0 = low, 50 = medium, 100 = high. The UI uses this for bars and
        // intentionally leaves buckets with no reports empty rather than zero.
        crowdPercent: averageScore === null ? null : Math.round(((averageScore - 1) / 2) * 100)
    };
};

const crowdHistory = (reports) => {
    const days = WEEKDAYS.map((label) => ({ label, scoreTotal: 0, samples: 0 }));
    const times = TIME_SLOTS.map((slot) => ({ ...slot, scoreTotal: 0, samples: 0 }));

    reports.forEach((report) => {
        const parts = indiaDateParts.formatToParts(report.reportedAt);
        const weekday = parts.find((part) => part.type === 'weekday')?.value;
        const hour = Number(parts.find((part) => part.type === 'hour')?.value);
        const score = LEVEL_SCORES[report.level];
        const day = days.find((item) => item.label === weekday);
        const time = times.find((item) => hour >= item.startHour && hour < item.endHour);
        if (day) { day.samples += 1; day.scoreTotal += score; }
        if (time) { time.samples += 1; time.scoreTotal += score; }
    });

    const serialisedDays = days.map(serialiseBucket);
    const serialisedTimes = times.map(serialiseBucket);
    const sufficientlyReported = (bucket) => bucket.samples >= 3 && bucket.crowdPercent !== null;
    const calmestDay = serialisedDays.filter(sufficientlyReported).sort((a, b) => a.crowdPercent - b.crowdPercent)[0] || null;
    const calmestTime = serialisedTimes.filter(sufficientlyReported).sort((a, b) => a.crowdPercent - b.crowdPercent)[0] || null;

    return {
        windowDays: HISTORY_WINDOW_DAYS,
        sampleCount: reports.length,
        days: serialisedDays,
        timeSlots: serialisedTimes,
        calmestDay,
        calmestTime
    };
};

const getGymCrowd = async (gymId) => {
    const now = new Date();
    const historySince = new Date(now.getTime() - HISTORY_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const [reports, history] = await Promise.all([
        prisma.gymCrowdReport.findMany({
            where: { gymId, expiresAt: { gt: now } },
            select: { level: true, reportedAt: true, expiresAt: true }
        }),
        prisma.gymCrowdReportHistory.findMany({
            where: { gymId, reportedAt: { gte: historySince } },
            orderBy: { reportedAt: 'desc' },
            take: 1500,
            select: { level: true, reportedAt: true }
        })
    ]);
    const counts = reports.reduce((result, report) => ({ ...result, [report.level]: result[report.level] + 1 }), { LOW: 0, MEDIUM: 0, HIGH: 0 });
    const weighted = counts.LOW + (counts.MEDIUM * 2) + (counts.HIGH * 3);
    const level = reports.length === 0 ? null : levelFromAverage(weighted / reports.length);
    return {
        level,
        reportCount: reports.length,
        counts: { low: counts.LOW, medium: counts.MEDIUM, high: counts.HIGH },
        freshestReportAt: reports.length ? reports.reduce((latest, report) => latest > report.reportedAt ? latest : report.reportedAt, reports[0].reportedAt) : null,
        history: crowdHistory(history)
    };
};

const reportGymCrowd = async (gymId, userId, input) => {
    const level = String(input?.level || '').toUpperCase();
    if (!LEVELS.has(level)) throw new Error('Choose low, medium, or high crowd level');
    const now = new Date();
    const [gym, membership] = await Promise.all([
        prisma.gym.findFirst({ where: { id: gymId, status: 'APPROVED' }, select: { id: true } }),
        prisma.userMembership.findFirst({
            where: { userId, status: 'ACTIVE', endDate: { gt: now }, plan: { gymId } },
            select: { id: true }
        })
    ]);
    if (!gym) throw new Error('Gym was not found');
    if (!membership) throw new Error('Only active members of this gym can report its crowd level');
    await prisma.$transaction(async (tx) => {
        const existing = await tx.gymCrowdReport.findUnique({
            where: { gymId_userId: { gymId, userId } },
            select: { level: true, reportedAt: true }
        });
        const existingHistory = await tx.gymCrowdReportHistory.findFirst({
            where: { gymId, userId },
            select: { id: true }
        });
        await tx.gymCrowdReport.upsert({
            where: { gymId_userId: { gymId, userId } },
            create: { gymId, userId, level, reportedAt: now, expiresAt: new Date(now.getTime() + REPORT_DURATION_MS) },
            update: { level, reportedAt: now, expiresAt: new Date(now.getTime() + REPORT_DURATION_MS) }
        });
        // Re-clicking the same level only refreshes the live indication. A
        // history point is recorded when the level changes or after 30 minutes,
        // preventing one member from distorting the average by repeatedly tapping.
        if (!existingHistory || !existing || existing.level !== level || now.getTime() - existing.reportedAt.getTime() >= HISTORY_RECORD_COOLDOWN_MS) {
            await tx.gymCrowdReportHistory.create({ data: { gymId, userId, level, reportedAt: now } });
        }
    });
    return getGymCrowd(gymId);
};

module.exports = { getGymCrowd, reportGymCrowd };
