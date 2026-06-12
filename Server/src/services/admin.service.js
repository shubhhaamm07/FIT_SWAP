const prisma = require('../lib/prisma');

const getPendingGyms = async () => {
    return prisma.gym.findMany({
        where: {
            status: 'PENDING'
        },
        include: {
            owner: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

module.exports = {
    getPendingGyms
};