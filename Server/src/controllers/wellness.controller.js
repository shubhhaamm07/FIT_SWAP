const workoutService = require('../services/workout.service');
const mealLogService = require('../services/meal-log.service');

const send = (res, status, data, message) => res.status(status).json({ success: true, ...(message ? { message } : {}), data });
const fail = (res, error) => res.status(400).json({ success: false, message: error.message || 'Unable to update wellness data' });

const listWorkouts = async (req, res) => {
    try { return send(res, 200, await workoutService.listWorkoutData(req.user.id)); }
    catch (error) { return fail(res, error); }
};
const createWorkout = async (req, res) => {
    try { return send(res, 201, await workoutService.createSchedule(req.user.id, req.body), 'Workout added to your weekly plan'); }
    catch (error) { return fail(res, error); }
};
const updateWorkout = async (req, res) => {
    try { return send(res, 200, await workoutService.updateSchedule(req.params.scheduleId, req.user.id, req.body), 'Workout updated'); }
    catch (error) { return fail(res, error); }
};
const archiveWorkout = async (req, res) => {
    try { await workoutService.archiveSchedule(req.params.scheduleId, req.user.id); return send(res, 200, null, 'Workout removed from your weekly plan'); }
    catch (error) { return fail(res, error); }
};
const completeWorkout = async (req, res) => {
    try { return send(res, 200, await workoutService.setCompletion(req.params.scheduleId, req.user.id, req.body), 'Workout progress updated'); }
    catch (error) { return fail(res, error); }
};

const listMeals = async (req, res) => {
    try { return send(res, 200, await mealLogService.listMeals(req.user.id, req.query)); }
    catch (error) { return fail(res, error); }
};
const createMeal = async (req, res) => {
    try { return send(res, 201, await mealLogService.createMeal(req.user.id, req.body), 'Meal saved to your log'); }
    catch (error) { return fail(res, error); }
};
const updateMeal = async (req, res) => {
    try { return send(res, 200, await mealLogService.updateMeal(req.params.mealLogId, req.user.id, req.body), 'Meal log updated'); }
    catch (error) { return fail(res, error); }
};
const removeMeal = async (req, res) => {
    try { await mealLogService.removeMeal(req.params.mealLogId, req.user.id); return send(res, 200, null, 'Meal removed from your log'); }
    catch (error) { return fail(res, error); }
};

module.exports = {
    listWorkouts, createWorkout, updateWorkout, archiveWorkout, completeWorkout,
    listMeals, createMeal, updateMeal, removeMeal
};
