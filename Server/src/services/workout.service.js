const prisma = require('../lib/prisma');

const dayStart = (value, field = 'date') => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new Error(`${field} must use the YYYY-MM-DD format`);
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        throw new Error(`${field} is invalid`);
    }
    return date;
};

const todayStart = () => dayStart(new Date().toISOString().slice(0, 10));

const optionalText = (value, name, maxLength) => {
    if (value === undefined || value === null || value === '') return null;
    const text = String(value).trim();
    if (text.length > maxLength) throw new Error(`${name} must be ${maxLength} characters or fewer`);
    return text || null;
};

const optionalInteger = (value, name, minimum, maximum) => {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    if (!Number.isInteger(number) || number < minimum || number > maximum) {
        throw new Error(`${name} must be a whole number between ${minimum} and ${maximum}`);
    }
    return number;
};

const scheduleInput = (input, partial = false) => {
    const data = {};
    if (!partial || Object.hasOwn(input, 'weekday')) {
        const weekday = Number(input.weekday);
        if (!Number.isInteger(weekday) || weekday < 1 || weekday > 7) {
            throw new Error('Choose a valid weekday');
        }
        data.weekday = weekday;
    }
    if (!partial || Object.hasOwn(input, 'title')) {
        const title = String(input.title || '').trim();
        if (title.length < 2 || title.length > 80) throw new Error('Workout title must be 2 to 80 characters');
        data.title = title;
    }
    if (!partial || Object.hasOwn(input, 'focus')) data.focus = optionalText(input.focus, 'Focus', 80);
    if (!partial || Object.hasOwn(input, 'durationMinutes')) {
        data.durationMinutes = optionalInteger(input.durationMinutes, 'Duration', 5, 300);
    }
    if (!partial || Object.hasOwn(input, 'notes')) data.notes = optionalText(input.notes, 'Notes', 500);
    return data;
};

const ownedSchedule = (id, userId) => prisma.workoutSchedule.findFirst({
    where: { id, userId },
    select: { id: true, userId: true, isActive: true }
});

const listWorkoutData = async (userId) => {
    const fourteenDaysAgo = new Date(todayStart());
    fourteenDaysAgo.setUTCDate(fourteenDaysAgo.getUTCDate() - 13);

    const schedules = await prisma.workoutSchedule.findMany({
        where: { userId, isActive: true },
        include: {
            completions: {
                where: { completedOn: { gte: fourteenDaysAgo } },
                orderBy: { completedOn: 'desc' }
            }
        },
        orderBy: [{ weekday: 'asc' }, { createdAt: 'asc' }]
    });

    const weekStart = new Date(todayStart());
    const offset = (weekStart.getUTCDay() + 6) % 7;
    weekStart.setUTCDate(weekStart.getUTCDate() - offset);
    const completedThisWeek = schedules.reduce(
        (total, schedule) => total + schedule.completions.filter((entry) => entry.completedOn >= weekStart).length,
        0
    );

    return {
        schedules,
        summary: {
            activeSchedules: schedules.length,
            completedThisWeek,
            weekStart
        }
    };
};

const createSchedule = (userId, input) => prisma.workoutSchedule.create({
    data: { userId, ...scheduleInput(input) }
});

const updateSchedule = async (id, userId, input) => {
    const schedule = await ownedSchedule(id, userId);
    if (!schedule || !schedule.isActive) throw new Error('Workout was not found');
    const data = scheduleInput(input, true);
    if (!Object.keys(data).length) throw new Error('Provide at least one workout field to update');
    return prisma.workoutSchedule.update({ where: { id }, data });
};

const archiveSchedule = async (id, userId) => {
    const schedule = await ownedSchedule(id, userId);
    if (!schedule || !schedule.isActive) throw new Error('Workout was not found');
    return prisma.workoutSchedule.update({ where: { id }, data: { isActive: false } });
};

const setCompletion = async (scheduleId, userId, input) => {
    const schedule = await ownedSchedule(scheduleId, userId);
    if (!schedule || !schedule.isActive) throw new Error('Workout was not found');
    const completedOn = dayStart(input.completedOn, 'Completion date');
    const today = todayStart();
    const oldestAllowed = new Date(today);
    oldestAllowed.setUTCDate(oldestAllowed.getUTCDate() - 90);
    if (completedOn > today) throw new Error('A future workout cannot be completed yet');
    if (completedOn < oldestAllowed) throw new Error('Completion date can be no more than 90 days ago');

    if (input.completed === false) {
        await prisma.workoutCompletion.deleteMany({ where: { scheduleId, completedOn, userId } });
        return { completed: false, completedOn };
    }

    const durationMinutes = optionalInteger(input.durationMinutes, 'Completed duration', 1, 600);
    const notes = optionalText(input.notes, 'Completion notes', 500);
    const completion = await prisma.workoutCompletion.upsert({
        where: { scheduleId_completedOn: { scheduleId, completedOn } },
        create: { scheduleId, userId, completedOn, durationMinutes, notes },
        update: { durationMinutes, notes }
    });
    return { completed: true, completion };
};

module.exports = { listWorkoutData, createSchedule, updateSchedule, archiveSchedule, setCompletion };
