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
    createGym, getMyGyms, getAllGyms, updateGymStatus, getGymById
};
