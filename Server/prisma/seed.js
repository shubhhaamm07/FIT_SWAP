require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    throw new Error('Production seeding is disabled. Set ALLOW_PRODUCTION_SEED=true only for an intentional disposable environment.');
}

const prisma = new PrismaClient();
const PASSWORD = process.env.SEED_TEST_PASSWORD || 'FitSwap-Local-Only-2026!';
const gymNames = ['Cult Fit Koramangala', "Gold's Gym HSR", 'Anytime Fitness Indiranagar', 'Fitness First Whitefield', 'Rampfit Marathahalli'];
const cities = ['Bangalore', 'Bangalore', 'Bangalore', 'Bangalore', 'Bangalore'];
const images = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200',
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1200',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200'
];
const memberNames = [
    ['Aarav', 'Sharma'], ['Vivaan', 'Verma'], ['Aditya', 'Mehta'], ['Arjun', 'Kapoor'], ['Rohan', 'Gupta'],
    ['Kabir', 'Singh'], ['Ishaan', 'Nair'], ['Reyansh', 'Jain'], ['Ananya', 'Reddy'], ['Isha', 'Patel'],
    ['Meera', 'Khanna'], ['Diya', 'Joshi'], ['Priya', 'Sethi'], ['Neha', 'Arora'], ['Kavya', 'Bansal'],
    ['Rahul', 'Malhotra'], ['Karan', 'Ahuja'], ['Sanya', 'Shah'], ['Riya', 'Chopra'], ['Aman', 'Bhatia']
];

async function upsertUser({ firstName, lastName, email, phone, role }) {
    const password = await bcrypt.hash(PASSWORD, 10);
    const demoAccount = { firstName, lastName, phone, role, password, isActive: true, emailVerifiedAt: new Date() };
    return prisma.user.upsert({
        where: { email },
        // Only accounts whose fixed @fitswap.test address is requested by the
        // seed are updated. Real owners are never reset by this script.
        update: demoAccount,
        create: { ...demoAccount, email }
    });
}

async function ensureGym(owner, index) {
    let gym = await prisma.gym.findFirst({ where: { name: gymNames[index] } });
    if (!gym) {
        gym = await prisma.gym.create({
            data: {
                name: gymNames[index],
                description: 'A verified FitSwap partner gym with modern training equipment and flexible memberships.',
                address: `${18 + index}, Fitness Avenue`,
                city: cities[index],
                state: 'Karnataka',
                pincode: `5600${10 + index}`,
                phone: `80000000${10 + index}`,
                email: `gym${index + 1}@fitswap.test`,
                status: 'APPROVED',
                ownerId: owner.id
            }
        });
    } else if (gym.status !== 'APPROVED' || gym.ownerId !== owner.id) {
        gym = await prisma.gym.update({ where: { id: gym.id }, data: { status: 'APPROVED', ownerId: owner.id } });
    }

    const existingImage = await prisma.gymImage.findFirst({ where: { gymId: gym.id, isPrimary: true } });
    if (!existingImage) {
        await prisma.gymImage.create({
            data: { gymId: gym.id, imageKey: `seed-gym-${index + 1}-primary`, imageUrl: images[index], isPrimary: true, displayOrder: 0 }
        });
    }

    const plans = [
        { name: 'Monthly Membership', durationInDays: 30, price: 4999, transferFee: 199 },
        { name: 'Quarterly Membership', durationInDays: 90, price: 10999, transferFee: 299 },
        { name: 'Annual Membership', durationInDays: 365, price: 24999, transferFee: 499 }
    ];
    const seededPlans = [];
    for (const planData of plans) {
        let plan = await prisma.membershipPlan.findFirst({ where: { gymId: gym.id, name: planData.name } });
        if (!plan) plan = await prisma.membershipPlan.create({ data: { ...planData, gymId: gym.id, transferable: true, freezeAllowed: true } });
        seededPlans.push(plan);
    }
    return { gym, plans: seededPlans };
}

async function seedOwnerDashboardData(members, gymData) {
    const now = new Date();

    for (let ownerIndex = 0; ownerIndex < gymData.length; ownerIndex += 1) {
        const { gym, plans } = gymData[ownerIndex];

        for (let memberIndex = 0; memberIndex < members.length; memberIndex += 1) {
            const plan = plans[(memberIndex + ownerIndex) % plans.length];
            const existingMembership = await prisma.userMembership.findFirst({
                where: {
                    userId: members[memberIndex].id,
                    planId: plan.id
                }
            });

            if (existingMembership) continue;

            // Spread sales across six months so the revenue trend is meaningful.
            const monthsAgo = (memberIndex + ownerIndex) % 6;
            const createdAt = new Date(
                now.getFullYear(),
                now.getMonth() - monthsAgo,
                2 + ((memberIndex * 3) % 22),
                10,
                0,
                0
            );
            if (createdAt > now) {
                createdAt.setTime(now.getTime() - ((memberIndex % 3) + 1) * 24 * 60 * 60 * 1000);
            }
            const startDate = new Date(createdAt);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plan.durationInDays);

            // Keep a healthy group of active members and a few near expiry.
            if (memberIndex % 5 === 0) {
                endDate.setDate(now.getDate() + 7 + (memberIndex % 3) * 7);
            }

            const status = endDate <= now ? 'EXPIRED' : 'ACTIVE';

            await prisma.userMembership.create({
                data: {
                    userId: members[memberIndex].id,
                    planId: plan.id,
                    startDate,
                    endDate,
                    status,
                    purchasePrice: plan.price,
                    createdAt
                }
            });
        }

        const existingOwnerNotification = await prisma.notification.findFirst({
            where: {
                userId: gym.ownerId,
                title: 'Owner dashboard ready'
            }
        });
        if (!existingOwnerNotification) {
            await prisma.notification.create({
                data: {
                    userId: gym.ownerId,
                    title: 'Owner dashboard ready',
                    message: `${gym.name} now has membership sales and member activity ready to review.`
                }
            });
        }
    }
}

async function seedMemberExperienceData(member, gymData) {
    const today = new Date();
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const schedules = [
        { weekday: 1, title: 'Upper-body strength', focus: 'Push and pull', durationMinutes: 50 },
        { weekday: 3, title: 'Conditioning', focus: 'Cardio and core', durationMinutes: 35 },
        { weekday: 5, title: 'Lower-body strength', focus: 'Legs and mobility', durationMinutes: 55 },
    ];

    const createdSchedules = [];
    for (const scheduleData of schedules) {
        let schedule = await prisma.workoutSchedule.findFirst({ where: { userId: member.id, title: scheduleData.title } });
        if (!schedule) schedule = await prisma.workoutSchedule.create({ data: { userId: member.id, ...scheduleData } });
        createdSchedules.push(schedule);
    }

    for (let daysAgo = 1; daysAgo <= 21; daysAgo += 1) {
        const completedOn = startOfDay(new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000));
        const schedule = createdSchedules[completedOn.getDay() % createdSchedules.length];
        if (daysAgo % 3 !== 0) {
            const alreadyLogged = await prisma.workoutCompletion.findFirst({ where: { scheduleId: schedule.id, completedOn } });
            if (!alreadyLogged) await prisma.workoutCompletion.create({
                data: { userId: member.id, scheduleId: schedule.id, completedOn, durationMinutes: schedule.durationMinutes }
            });
        }
        if (daysAgo <= 14) {
            const mealDate = completedOn;
            const label = daysAgo % 2 ? 'Protein bowl with seasonal fruit' : 'Balanced lentil and rice meal';
            const existingMeal = await prisma.mealLog.findFirst({ where: { userId: member.id, mealDate, mealType: 'LUNCH', label } });
            if (!existingMeal) await prisma.mealLog.create({
                data: { userId: member.id, mealDate, mealType: 'LUNCH', label, estimatedCalories: 540, source: 'AI_PLAN', isFollowed: daysAgo % 4 !== 0 }
            });
        }
    }

    // Historical reports make the crowd-insight graph useful without posing
    // as a current live report. Current crowd data remains short lived.
    const crowdGym = gymData[0]?.gym;
    if (crowdGym) {
        for (let daysAgo = 1; daysAgo <= 28; daysAgo += 1) {
            const reportedAt = new Date(today.getTime() - daysAgo * 24 * 60 * 60 * 1000);
            reportedAt.setHours(18 + (daysAgo % 3), 0, 0, 0);
            const existingReport = await prisma.gymCrowdReportHistory.findFirst({
                where: { gymId: crowdGym.id, userId: member.id, reportedAt }
            });
            if (!existingReport) await prisma.gymCrowdReportHistory.create({
                data: { gymId: crowdGym.id, userId: member.id, reportedAt, level: daysAgo % 5 === 0 ? 'HIGH' : daysAgo % 2 ? 'MEDIUM' : 'LOW' }
            });
        }
    }
}

async function main() {
    const admin = await upsertUser({ firstName: 'Shubham', lastName: 'Rana', email: 'shubham.rana@fitswap.test', phone: '9000000001', role: 'ADMIN' });
    const owners = await Promise.all(Array.from({ length: 5 }, (_, index) => upsertUser({ firstName: `GymOwner${index + 1}`, lastName: 'FitSwap', email: `owner${index + 1}@fitswap.test`, phone: `90000000${10 + index}`, role: 'GYM_OWNER' })));
    const gymData = [];
    for (let index = 0; index < owners.length; index += 1) gymData.push(await ensureGym(owners[index], index));

    const members = [];
    for (let index = 0; index < memberNames.length; index += 1) {
        const [firstName, lastName] = memberNames[index];
        const member = await upsertUser({ firstName, lastName, email: `member${String(index + 1).padStart(2, '0')}@fitswap.test`, phone: `910000${String(index + 1).padStart(4, '0')}`, role: 'USER' });
        members.push(member);
    }

    await seedOwnerDashboardData(members, gymData);
    await seedMemberExperienceData(members[0], gymData);

    const listings = [];
    for (let index = 0; index < members.length; index += 1) {
        const partner = gymData[index % gymData.length];
        const plan = partner.plans[index % partner.plans.length];
        let membership = await prisma.userMembership.findFirst({ where: { userId: members[index].id, planId: plan.id } });
        if (!membership) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 25);
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 60 + (index * 7));
            membership = await prisma.userMembership.create({ data: { userId: members[index].id, planId: plan.id, startDate, endDate, status: 'ACTIVE', purchasePrice: plan.price } });
        }

        if (index === 0) {
            const existingListings = await prisma.marketplaceListing.findMany({ where: { membershipId: membership.id } });
            if (existingListings.length) {
                await prisma.transferRequest.deleteMany({ where: { listingId: { in: existingListings.map(({ id }) => id) } } });
                await prisma.marketplaceListing.deleteMany({ where: { id: { in: existingListings.map(({ id }) => id) } } });
            }
            continue;
        }

        const askingPrice = Math.round(Number(plan.price) * (0.55 + ((index % 4) * 0.1)));
        const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'PAUSED', 'RESERVED', 'SOLD'];
        const status = statuses[index % statuses.length];
        const listing = await prisma.marketplaceListing.findFirst({
            where: { membershipId: membership.id, status: { in: ['ACTIVE', 'PAUSED', 'RESERVED'] }, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        const savedListing = listing
            ? await prisma.marketplaceListing.update({ where: { id: listing.id }, data: { sellerId: members[index].id, askingPrice, status, deletedAt: null } })
            : await prisma.marketplaceListing.create({ data: { membershipId: membership.id, sellerId: members[index].id, askingPrice, status } });
        listings.push(savedListing);
    }

    const firstActive = listings.find((listing) => listing.status === 'ACTIVE');
    if (firstActive) {
        await prisma.savedListing.upsert({ where: { userId_listingId: { userId: admin.id, listingId: firstActive.id } }, update: {}, create: { userId: admin.id, listingId: firstActive.id } });
        await prisma.savedListing.upsert({ where: { userId_listingId: { userId: members[1].id, listingId: firstActive.id } }, update: {}, create: { userId: members[1].id, listingId: firstActive.id } });
    }

    const transferListing = listings.find((listing) => listing.status === 'ACTIVE' && listing.sellerId !== members[0].id);
    if (transferListing) {
        const existingRequest = await prisma.transferRequest.findFirst({
            where: { listingId: transferListing.id, buyerId: members[0].id, status: 'PENDING' },
        });
        if (!existingRequest) await prisma.transferRequest.create({
            data: {
                listingId: transferListing.id,
                buyerId: members[0].id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
    }

    for (let index = 0; index < members.length; index += 1) {
        const existing = await prisma.notification.findFirst({ where: { userId: members[index].id, title: 'Seeded marketplace activity' } });
        if (!existing) await prisma.notification.create({ data: { userId: members[index].id, title: 'Seeded marketplace activity', message: 'Your FitSwap test listing is ready to manage.' } });
    }

    console.log(`Seeded ${members.length} verified members, ${owners.length} verified gym owners, ${gymData.length} gyms, and ${listings.length} listings.`);
    console.log('Demo login password is the local SEED_TEST_PASSWORD value. Demo accounts use the @fitswap.test addresses declared in this seed file.');
    console.log(`Created ${owners.length} gym-owner demo accounts without printing their credentials.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
