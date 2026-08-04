require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PASSWORD = '1234';
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
    return prisma.user.upsert({
        where: { email },
        update: { firstName, lastName, phone, role, password },
        create: { firstName, lastName, email, phone, role, password }
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

async function main() {
    const admin = await upsertUser({ firstName: 'Shubham', lastName: 'Rana', email: 'shubham.rana@fitswap.test', phone: '9000000001', role: 'ADMIN' });
    const owners = await Promise.all(Array.from({ length: 5 }, (_, index) => upsertUser({ firstName: `GymOwner${index + 1}`, lastName: 'FitSwap', email: `owner${index + 1}@fitswap.test`, phone: `90000000${10 + index}`, role: 'GYM_OWNER' })));
    // This also resets the password of any Gym Owner created manually in the local database.
    await prisma.user.updateMany({
        where: { role: 'GYM_OWNER' },
        data: { password: await bcrypt.hash(PASSWORD, 10) }
    });
    const gymData = [];
    for (let index = 0; index < owners.length; index += 1) gymData.push(await ensureGym(owners[index], index));

    const members = [];
    for (let index = 0; index < memberNames.length; index += 1) {
        const [firstName, lastName] = memberNames[index];
        const member = await upsertUser({ firstName, lastName, email: `member${String(index + 1).padStart(2, '0')}@fitswap.test`, phone: `910000${String(index + 1).padStart(4, '0')}`, role: 'USER' });
        members.push(member);
    }

    await seedOwnerDashboardData(members, gymData);

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
            membership = await prisma.userMembership.create({ data: { userId: members[index].id, planId: plan.id, startDate, endDate, status: 'ACTIVE' } });
        }

        if (index === 0) {
            const existingListing = await prisma.marketplaceListing.findUnique({ where: { membershipId: membership.id } });
            if (existingListing) {
                await prisma.transferRequest.deleteMany({ where: { listingId: existingListing.id } });
                await prisma.marketplaceListing.delete({ where: { id: existingListing.id } });
            }
            continue;
        }

        const askingPrice = Math.round(plan.price * (0.55 + ((index % 4) * 0.1)));
        const statuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'ACTIVE', 'PAUSED', 'RESERVED', 'SOLD'];
        const status = statuses[index % statuses.length];
        const listing = await prisma.marketplaceListing.upsert({
            where: { membershipId: membership.id },
            update: { sellerId: members[index].id, askingPrice, status, deletedAt: null },
            create: { membershipId: membership.id, sellerId: members[index].id, askingPrice, status }
        });
        listings.push(listing);
    }

    const firstActive = listings.find((listing) => listing.status === 'ACTIVE');
    if (firstActive) {
        await prisma.savedListing.upsert({ where: { userId_listingId: { userId: admin.id, listingId: firstActive.id } }, update: {}, create: { userId: admin.id, listingId: firstActive.id } });
        await prisma.savedListing.upsert({ where: { userId_listingId: { userId: members[1].id, listingId: firstActive.id } }, update: {}, create: { userId: members[1].id, listingId: firstActive.id } });
    }

    const transferListing = listings.find((listing) => listing.status === 'ACTIVE' && listing.sellerId !== members[0].id);
    if (transferListing) {
        await prisma.transferRequest.upsert({
            where: {
                listingId_buyerId: {
                    listingId: transferListing.id,
                    buyerId: members[0].id
                }
            },
            update: {},
            create: {
                listingId: transferListing.id,
                buyerId: members[0].id
            }
        });
    }

    for (let index = 0; index < members.length; index += 1) {
        const existing = await prisma.notification.findFirst({ where: { userId: members[index].id, title: 'Seeded marketplace activity' } });
        if (!existing) await prisma.notification.create({ data: { userId: members[index].id, title: 'Seeded marketplace activity', message: 'Your FitSwap test listing is ready to manage.' } });
    }

    console.log(`Seeded ${members.length} members, ${owners.length} gym owners, ${gymData.length} gyms, and ${listings.length} listings.`);
    console.log('Admin login: shubham.rana@fitswap.test / 1234');
    owners.forEach((owner) => console.log(`Gym owner login: ${owner.email} / 1234`));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
