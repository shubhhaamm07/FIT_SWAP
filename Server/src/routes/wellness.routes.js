const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/role.middleware');
const controller = require('../controllers/wellness.controller');

const router = express.Router();
router.use(protect, authorize('USER'));

router.get('/wellness/workouts', controller.listWorkouts);
router.post('/wellness/workouts', controller.createWorkout);
router.patch('/wellness/workouts/:scheduleId', controller.updateWorkout);
router.delete('/wellness/workouts/:scheduleId', controller.archiveWorkout);
router.patch('/wellness/workouts/:scheduleId/completion', controller.completeWorkout);

router.get('/wellness/meals', controller.listMeals);
router.post('/wellness/meals', controller.createMeal);
router.patch('/wellness/meals/:mealLogId', controller.updateMeal);
router.delete('/wellness/meals/:mealLogId', controller.removeMeal);

module.exports = router;
