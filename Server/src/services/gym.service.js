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

module.exports = {
    createGym
};