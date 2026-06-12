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

module.exports = {
    createGym, getMyGyms
};