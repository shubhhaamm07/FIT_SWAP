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
        }
    });

    return gyms;
};
const getAllGyms = async () => {
    const gyms = await prisma.gym.findMany({
        where: {
            status: 'APPROVED'
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
module.exports = {
    createGym, getMyGyms, getAllGyms, updateGymStatus
};