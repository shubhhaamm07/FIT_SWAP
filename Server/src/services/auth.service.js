const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const registerUser = async ({
    firstName,
    lastName,
    email,
    phone,
    password,
    role
}) => {
    const existingUser = await prisma.user.findUnique({
        where: {
            email
        }
    });
    if (phone) {
        const existingPhone = await prisma.user.findUnique({
            where: {
                phone
            }
        });

        if (existingPhone) {
            throw new Error("Phone number already exists");
        }
    }
    if (existingUser) {
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            role
        }
    });

    return user;
};
const loginUser = async ({ email, password }) => {
    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordValid) {
        throw new Error('Invalid credentials');
    }

    return user;
};
module.exports = {
    registerUser,
    loginUser
};