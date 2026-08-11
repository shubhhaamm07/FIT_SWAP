const prisma = require('../lib/prisma');

const createGym = async (gymData, ownerId) => {
    const gym = await prisma.gym.create({
        data: {
            ...gymData,
            ownerId
        }
    });

    return gym;
};
const getMyGyms = async (ownerId) => {
    const gyms = await prisma.gym.findMany({
        where: {
            ownerId
        },
        include: {
            images: {
                orderBy: [
                    { isPrimary: 'desc' },
                    { displayOrder: 'asc' }
                ]
            },
            plans: {
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return gyms;
};
const getAllGyms = async () => {
    const gyms = await prisma.gym.findMany({
        where: {
            status: 'APPROVED'
        },
        include: {
            images: {
                orderBy: [
                    { isPrimary: 'desc' },
                    { displayOrder: 'asc' }
                ]
            },
            plans: {
                orderBy: { price: 'asc' }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return gyms;
};
const updateGymStatus = async (gymId, status) => {
    const gym = await prisma.gym.update({
        where: {
            id: gymId
        },
        data: {
            status
        }
    });

    return gym;
};

const updateGymByOwner = async (gymId, ownerId, gymData) => {
    const gym = await prisma.gym.findFirst({
        where: { id: gymId, ownerId },
        select: { id: true }
    });

    if (!gym) {
        throw new Error('Gym not found or you do not have permission to edit it');
    }

    const name = String(gymData.name || '').trim();
    const address = String(gymData.address || '').trim();
    const city = String(gymData.city || '').trim();
    const state = String(gymData.state || '').trim();
    const pincode = String(gymData.pincode || '').trim();
    const phone = String(gymData.phone || '').trim();
    const email = gymData.email ? String(gymData.email).trim().toLowerCase() : null;
    const description = gymData.description ? String(gymData.description).trim() : null;

    if (!name || !address || !city || !state || !pincode || !phone) {
        throw new Error('Name, address, city, state, pincode, and phone are required');
    }

    if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error('Please provide a valid gym email address');
    }

    return prisma.gym.update({
        where: { id: gymId },
        data: { name, address, city, state, pincode, phone, email, description }
    });
};
const getGymById = async (gymId) => {
    return prisma.gym.findFirst({
        where: {
            id: gymId,
            status: 'APPROVED'
        },
        include: {
            images: {
                orderBy: [
                    { isPrimary: 'desc' },
                    { displayOrder: 'asc' }
                ]
            },
            plans: {
                orderBy: { price: 'asc' }
            }
        }
    });
};
module.exports = {
    createGym, getMyGyms, getAllGyms, updateGymStatus, updateGymByOwner, getGymById
};
