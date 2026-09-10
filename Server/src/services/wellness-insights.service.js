const prisma = require('../lib/prisma');
const { getMemberPlusEntitlement } = require('./platform-billing.service');

const insightError = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const dayStart = (date) => new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);
const dateKey = (date) => new Date(date).toISOString().slice(0, 10);

const calculateStreaks = (days) => {
    let currentWorkoutStreak = 0;
    for (let index = days.length - 1; index >= 0 && days[index].workoutsCompleted > 0; index -= 1) {
        currentWorkoutStreak += 1;
    }

    let bestWorkoutStreak = 0;
    let running = 0;
    days.forEach((day) => {
        running = day.workoutsCompleted > 0 ? running + 1 : 0;
        bestWorkoutStreak = Math.max(bestWorkoutStreak, running);
    });
    return { currentWorkoutStreak, bestWorkoutStreak };
};

// This endpoint deliberately exposes only the member's own saved wellness
// actions. It is an aggregate, not health advice or a medical record.
const getWellnessInsights = async (userId, now = new Date(), database = prisma) => {
    const entitlement = await getMemberPlusEntitlement(userId, now, database);
    if (!entitlement.isFitSwapPlus) {
        throw insightError('FitSwap Plus is required for 30-day wellness insights.', 403);
    }

    const end = dayStart(now);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 29);

    const [workouts, meals] = await Promise.all([
        database.workoutCompletion.findMany({
            where: { userId, completedOn: { gte: start, lte: end } },
            select: { completedOn: true, durationMinutes: true },
        }),
        database.mealLog.findMany({
            where: { userId, mealDate: { gte: start, lte: end } },
            select: { mealDate: true, isFollowed: true, estimatedCalories: true },
        }),
    ]);

    const byDate = new Map();
    for (let index = 0; index < 30; index += 1) {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + index);
        byDate.set(dateKey(date), {
            date: dateKey(date),
            workoutsCompleted: 0,
            workoutMinutes: 0,
            mealsLogged: 0,
            mealsFollowed: 0,
        });
    }

    workouts.forEach((workout) => {
        const day = byDate.get(dateKey(workout.completedOn));
        if (!day) return;
        day.workoutsCompleted += 1;
        day.workoutMinutes += workout.durationMinutes || 0;
    });
    meals.forEach((meal) => {
        const day = byDate.get(dateKey(meal.mealDate));
        if (!day) return;
        day.mealsLogged += 1;
        day.mealsFollowed += meal.isFollowed ? 1 : 0;
    });

    const days = [...byDate.values()].map((day) => ({
        ...day,
        mealAdherencePercent: day.mealsLogged ? Math.round((day.mealsFollowed / day.mealsLogged) * 100) : 0,
    }));
    const totalWorkoutCompletions = workouts.length;
    const totalWorkoutMinutes = workouts.reduce((sum, workout) => sum + (workout.durationMinutes || 0), 0);
    const mealsFollowed = meals.filter((meal) => meal.isFollowed).length;
    const totalEstimatedCalories = meals.reduce((sum, meal) => sum + (meal.estimatedCalories || 0), 0);

    return {
        period: { from: dateKey(start), to: dateKey(end), days: 30 },
        summary: {
            totalWorkoutCompletions,
            totalWorkoutMinutes,
            mealsLogged: meals.length,
            mealsFollowed,
            mealAdherencePercent: meals.length ? Math.round((mealsFollowed / meals.length) * 100) : 0,
            totalEstimatedCalories,
            ...calculateStreaks(days),
        },
        days,
    };
};

module.exports = { getWellnessInsights };
