require('dotenv').config();

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD || '1234';

// Public business information gathered from each gym's official website.
// Prices, accounts, marketplace activity, and notifications below are demo data.
const khararGyms = [
    {
        slug: 'tnt-kharar',
        name: 'TNT Gym Kharar',
        address: 'SCO 10–16, Amayra Trillium Street, Aujala, Kharar',
        pincode: '140301',
        phone: '+918054514131',
        email: 'info@tntgymskharar.com',
        description: 'Fitness studio in Kharar with trainer-led cardio, strength training, CrossFit, yoga, kickboxing, and group sessions.',
        imageUrl: 'https://tntgymskharar.com/wp-content/uploads/2026/08/fitness-fitnessmodel-bodybuilding-gymvideos-gymaddict.jpg',
        owner: ['TNT', 'Management']
    },
    {
        slug: 'fit-hit-shivjot',
        name: 'Fit Hit Gym',
        address: 'Showroom 37, opposite Katani Sweets, Shivjot Enclave, Kharar',
        pincode: '140301',
        phone: '+917719702025',
        email: 'contact@fithitgyms.com',
        description: 'Kharar fitness centre offering guided training, personal training, and a range of group fitness classes.',
        imageUrl: 'https://fithitgyms.com/wp-content/uploads/2022/08/about-img1.jpg',
        owner: ['Fit Hit', 'Management']
    },
    {
        slug: 'titan-fitness-sector-125',
        name: 'Titan Fitness',
        address: 'SCO 1–11, Second Floor, Jandpur Road, near Jal Vayu Towers Gate No. 3, Sector 125, Kharar',
        pincode: '140301',
        phone: '+918699411788',
        email: 'enquiry@titan-fitness.in',
        description: 'Modern Kharar gym focused on strength, conditioning, structured workouts, and trainer guidance.',
        imageUrl: 'https://titan-fitness.in/wp-content/uploads/2024/04/Titan-Fitness11.jpg',
        owner: ['Titan Fitness', 'Management']
    },
    {
        slug: 'mlc-kharar',
        name: 'MLC Gym Kharar',
        address: 'Third Floor, City Heart, SCO 82–83, Kharar',
        pincode: '140301',
        phone: '+918437807040',
        email: 'hello@mlcgymkharar.com',
        description: 'Kharar gym with general fitness facilities, trainer assistance, and flexible membership plans.',
        imageUrl: 'https://mlcgymkharar.com/_next/image?url=%2FBannerimage.png&w=1920&q=75',
        owner: ['MLC Gym', 'Management']
    },
    {
        slug: 'true-fitness-sector-115',
        name: 'True Fitness Kharar',
        address: 'SCO 1–3, Sector 115, Santemajra Road, Pritam Market, Kharar',
        pincode: '140307',
        phone: '+919877507810',
        email: 'truefitness@gmail.com',
        description: 'Neighbourhood fitness facility with gym equipment and guided training in the Sector 115 area.',
        imageUrl: 'https://true-fitness.in/Assets/GYM1.webp',
        owner: ['True Fitness', 'Management']
    },
    {
        slug: 'yosmo-sector-125',
        name: 'Yosmo Fitness Kharar',
        address: 'SCO 1011–1013, opposite Gopal Sweets, Sector 125, Sunny Enclave, Kharar',
        pincode: '140301',
        phone: '+919844900003',
        email: 'contact@yosmofitness.in',
        description: 'Fitness centre in Sunny Enclave with a broad gym floor and professional fitness services.',
        imageUrl: 'https://www.yosmofitness.in/assets/slides/slide-01.jpg',
        owner: ['Yosmo Fitness', 'Management']
    }
];

const members = [
    ['Aarav', 'Sharma'], ['Vivaan', 'Verma'], ['Aditya', 'Mehta'], ['Arjun', 'Kapoor'], ['Rohan', 'Gupta'],
    ['Kabir', 'Singh'], ['Ishaan', 'Nair'], ['Reyansh', 'Jain'], ['Ananya', 'Reddy'], ['Isha', 'Patel'],
    ['Meera', 'Khanna'], ['Diya', 'Joshi'], ['Priya', 'Sethi'], ['Neha', 'Arora'], ['Kavya', 'Bansal'],
    ['Rahul', 'Malhotra'], ['Karan', 'Ahuja'], ['Sanya', 'Shah'], ['Riya', 'Chopra'], ['Aman', 'Bhatia']
];

const planTemplates = [
    { name: 'Monthly Flex Plan', durationInDays: 30, price: 1999, transferFee: 149 },
    { name: 'Quarterly Flex Plan', durationInDays: 90, price: 4999, transferFee: 249 },
    { name: 'Annual Flex Plan', durationInDays: 365, price: 14999, transferFee: 399 }
];

const dateOffset = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
};

async function resetApplicationData() {
    if (process.env.CONFIRM_FITSWAP_RESET !== 'YES') {
        throw new Error('Reset stopped. Run with CONFIRM_FITSWAP_RESET=YES to clear only FitSwap application records.');
    }

    await prisma.$transaction([
        prisma.payment.deleteMany(),
        prisma.transferRequest.deleteMany(),
        prisma.savedListing.deleteMany(),
        prisma.marketplaceListing.deleteMany(),
        prisma.userMembership.deleteMany(),
        prisma.gymImage.deleteMany(),
        prisma.membershipPlan.deleteMany(),
        prisma.notification.deleteMany(),
        prisma.announcement.deleteMany(),
        prisma.adminAuditLog.deleteMany(),
        prisma.authToken.deleteMany(),
        prisma.gym.deleteMany(),
        prisma.user.deleteMany()
    ]);
}

async function main() {
    await resetApplicationData();
    const password = await bcrypt.hash(TEST_PASSWORD, 10);

    const admin = await prisma.user.create({
        data: {
            firstName: 'Shubham',
            lastName: 'Rana',
            email: 'shubham.rana@fitswap.test',
            username: 'shubhamrana',
            phone: '+919000000001',
            password,
            role: 'ADMIN',
            city: 'Kharar',
            emailVerifiedAt: new Date()
        }
    });

    const ownerRecords = [];
    const gymRecords = [];
    for (let index = 0; index < khararGyms.length; index += 1) {
        const seed = khararGyms[index];
        const [firstName, lastName] = seed.owner;
        const owner = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: `${seed.slug}.owner@fitswap.local`,
                username: `${seed.slug}-owner`,
                phone: `+91910000${String(index + 1).padStart(4, '0')}`,
                password,
                role: 'GYM_OWNER',
                city: 'Kharar',
                bio: 'Demo management account created for the FitSwap Kharar directory.',
                emailVerifiedAt: new Date()
            }
        });

        const gym = await prisma.gym.create({
            data: {
                name: seed.name,
                description: seed.description,
                address: seed.address,
                city: 'Kharar',
                state: 'Punjab',
                pincode: seed.pincode,
                phone: seed.phone,
                email: seed.email,
                status: 'APPROVED',
                ownerId: owner.id,
                images: {
                    create: {
                        imageKey: `official-${seed.slug}-cover`,
                        imageUrl: seed.imageUrl,
                        isPrimary: true,
                        displayOrder: 0
                    }
                }
            }
        });

        const plans = [];
        for (const template of planTemplates) {
            plans.push(await prisma.membershipPlan.create({
                data: {
                    ...template,
                    description: `${template.name} shown for product demonstration. Please confirm live price and terms with ${seed.name}.`,
                    transferable: true,
                    freezeAllowed: true,
                    gymId: gym.id
                }
            }));
        }
        ownerRecords.push(owner);
        gymRecords.push({ gym, plans, owner });
    }

    const memberRecords = [];
    for (let index = 0; index < members.length; index += 1) {
        const [firstName, lastName] = members[index];
        memberRecords.push(await prisma.user.create({
            data: {
                firstName,
                lastName,
                email: `member${String(index + 1).padStart(2, '0')}@fitswap.test`,
                username: `member${String(index + 1).padStart(2, '0')}`,
                phone: `+91920000${String(index + 1).padStart(4, '0')}`,
                password,
                role: 'USER',
                city: 'Kharar',
                bio: 'FitSwap demo member account.',
                emailVerifiedAt: new Date()
            }
        }));
    }

    const memberships = [];
    for (let index = 0; index < memberRecords.length; index += 1) {
        const gymRecord = gymRecords[index % gymRecords.length];
        const plan = gymRecord.plans[index % gymRecord.plans.length];
        const expired = index % 7 === 0;
        const startDate = expired ? dateOffset(-(plan.durationInDays + 20)) : dateOffset(-((index % 35) + 10));
        const endDate = expired ? dateOffset(-5) : dateOffset(35 + ((index % 6) * 20));
        memberships.push(await prisma.userMembership.create({
            data: {
                userId: memberRecords[index].id,
                planId: plan.id,
                startDate,
                endDate,
                purchasePrice: plan.price,
                status: expired ? 'EXPIRED' : 'ACTIVE',
                createdAt: dateOffset(-((index % 150) + 5))
            }
        }));
    }

    const listingStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'PAUSED', 'RESERVED'];
    const listings = [];
    for (let index = 0; index < 14; index += 1) {
        const membership = memberships[index];
        if (membership.status !== 'ACTIVE') continue;
        const plan = gymRecords[index % gymRecords.length].plans[index % planTemplates.length];
        listings.push(await prisma.marketplaceListing.create({
            data: {
                membershipId: membership.id,
                sellerId: memberRecords[index].id,
                askingPrice: Math.round(plan.price * (0.55 + ((index % 3) * 0.1))),
                status: listingStatuses[index % listingStatuses.length],
                createdAt: dateOffset(-((index % 21) + 1))
            }
        }));
    }

    const activeListings = listings.filter((listing) => listing.status === 'ACTIVE');
    if (activeListings.length >= 2) {
        await prisma.savedListing.createMany({
            data: [
                { userId: memberRecords[15].id, listingId: activeListings[0].id },
                { userId: memberRecords[16].id, listingId: activeListings[0].id },
                { userId: memberRecords[17].id, listingId: activeListings[1].id }
            ]
        });
        await prisma.transferRequest.create({
            data: { listingId: activeListings[0].id, buyerId: memberRecords[5].id, status: 'PENDING' }
        });
        await prisma.transferRequest.create({
            data: { listingId: activeListings[1].id, buyerId: memberRecords[6].id, status: 'APPROVED' }
        });
    }

    await prisma.notification.createMany({
        data: [
            { userId: memberRecords[0].id, title: 'Welcome to the Kharar marketplace', message: 'Browse transferable demo memberships from gyms around Kharar.' },
            { userId: memberRecords[5].id, title: 'Transfer request pending', message: 'Your request is waiting for the seller’s review.' },
            { userId: memberRecords[6].id, title: 'Transfer request approved', message: 'Your demo request has been approved and is ready for the next step.' },
            { userId: ownerRecords[0].id, title: 'Gym profile is live', message: 'Your Kharar directory profile and demo membership plans are available.' }
        ]
    });

    await prisma.announcement.create({
        data: {
            adminId: admin.id,
            title: 'Kharar directory is ready',
            message: 'FitSwap has been refreshed with local gym discovery data and demo marketplace activity.',
            audience: 'ALL_USERS',
            recipientCount: memberRecords.length + ownerRecords.length
        }
    });

    await prisma.adminAuditLog.createMany({
        data: gymRecords.map(({ gym }) => ({
            adminId: admin.id,
            action: 'GYM_STATUS_UPDATED',
            targetType: 'Gym',
            targetId: gym.id,
            summary: `Approved ${gym.name} in the Kharar directory.`,
            metadata: { source: 'official-gym-website', city: 'Kharar' }
        }))
    });

    console.log('\nFitSwap has been reset and seeded with Kharar demo data.');
    console.log(`Admin: shubham.rana@fitswap.test / ${TEST_PASSWORD}`);
    console.log(`Members: member01@fitswap.test through member20@fitswap.test / ${TEST_PASSWORD}`);
    ownerRecords.forEach((owner) => console.log(`Gym management: ${owner.email} / ${TEST_PASSWORD}`));
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
