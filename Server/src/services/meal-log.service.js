const prisma = require('../lib/prisma');

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TYPES = new Set(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']);
const VALID_SOURCES = new Set(['AI_PLAN', 'MANUAL']);

const dateOnly = (value, field = 'Meal date') => {
    if (typeof value !== 'string' || !DAY_PATTERN.test(value)) throw new Error(`${field} must use the YYYY-MM-DD format`);
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error(`${field} is invalid`);
    return date;
};

const today = () => dateOnly(new Date().toISOString().slice(0, 10));
const cleanText = (value, name, maximum) => {
    if (value === undefined || value === null || value === '') return null;
    const output = String(value).trim();
    if (output.length > maximum) throw new Error(`${name} must be ${maximum} characters or fewer`);
    return output || null;
};
const calories = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 3000) throw new Error('Estimated calories must be between 0 and 3000');
    return parsed;
};

const mealInput = (input, partial = false) => {
    const data = {};
    if (!partial || Object.hasOwn(input, 'mealDate')) {
        const mealDate = dateOnly(input.mealDate);
        if (mealDate > today()) throw new Error('Meals can only be logged for today or a past date');
        data.mealDate = mealDate;
    }
    if (!partial || Object.hasOwn(input, 'mealType')) {
        const mealType = String(input.mealType || 'OTHER').toUpperCase();
        if (!VALID_TYPES.has(mealType)) throw new Error('Choose a valid meal type');
        data.mealType = mealType;
    }
    if (!partial || Object.hasOwn(input, 'label')) {
        const label = String(input.label || '').trim();
        if (label.length < 2 || label.length > 120) throw new Error('Meal name must be 2 to 120 characters');
        data.label = label;
    }
    if (!partial || Object.hasOwn(input, 'description')) data.description = cleanText(input.description, 'Meal details', 500);
    if (!partial || Object.hasOwn(input, 'estimatedCalories')) data.estimatedCalories = calories(input.estimatedCalories);
    if (!partial || Object.hasOwn(input, 'source')) {
        const source = String(input.source || 'MANUAL').toUpperCase();
        if (!VALID_SOURCES.has(source)) throw new Error('Choose a valid meal source');
        data.source = source;
    }
    if (Object.hasOwn(input, 'isFollowed')) {
        if (typeof input.isFollowed !== 'boolean') throw new Error('Meal adherence must be true or false');
        data.isFollowed = input.isFollowed;
    }
    return data;
};

const listMeals = async (userId, query = {}) => {
    const until = query.to ? dateOnly(query.to, 'End date') : today();
    const from = query.from ? dateOnly(query.from, 'Start date') : new Date(until.getTime() - 13 * 86400000);
    if (from > until) throw new Error('Start date must be before end date');
    if (until.getTime() - from.getTime() > 93 * 86400000) throw new Error('Choose a period of 90 days or fewer');
    const meals = await prisma.mealLog.findMany({
        where: { userId, mealDate: { gte: from, lte: until } },
        orderBy: [{ mealDate: 'desc' }, { createdAt: 'asc' }]
    });
    const followed = meals.filter((meal) => meal.isFollowed).length;
    return { meals, summary: { total: meals.length, followed, adherencePercent: meals.length ? Math.round((followed / meals.length) * 100) : 0 } };
};

const createMeal = (userId, input) => prisma.mealLog.create({ data: { userId, ...mealInput(input) } });

const updateMeal = async (id, userId, input) => {
    const current = await prisma.mealLog.findFirst({ where: { id, userId }, select: { id: true } });
    if (!current) throw new Error('Meal log was not found');
    const data = mealInput(input, true);
    if (!Object.keys(data).length) throw new Error('Provide at least one meal field to update');
    return prisma.mealLog.update({ where: { id }, data });
};

const removeMeal = async (id, userId) => {
    const current = await prisma.mealLog.findFirst({ where: { id, userId }, select: { id: true } });
    if (!current) throw new Error('Meal log was not found');
    await prisma.mealLog.delete({ where: { id } });
};

module.exports = { listMeals, createMeal, updateMeal, removeMeal };
