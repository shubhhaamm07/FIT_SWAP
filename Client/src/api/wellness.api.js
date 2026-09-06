import api from "./axios";

export const getWorkoutPlan = async () => {
  const { data } = await api.get("/wellness/workouts");
  return data.data;
};

export const createWorkout = async (payload) => {
  const { data } = await api.post("/wellness/workouts", payload);
  return data.data;
};

export const updateWorkout = async (scheduleId, payload) => {
  const { data } = await api.patch(`/wellness/workouts/${scheduleId}`, payload);
  return data.data;
};

export const archiveWorkout = async (scheduleId) => {
  const { data } = await api.delete(`/wellness/workouts/${scheduleId}`);
  return data.data;
};

export const setWorkoutCompletion = async (scheduleId, payload) => {
  const { data } = await api.patch(`/wellness/workouts/${scheduleId}/completion`, payload);
  return data.data;
};

export const getMealLogs = async (query = {}) => {
  const { data } = await api.get("/wellness/meals", { params: query });
  return data.data;
};

export const createMealLog = async (payload) => {
  const { data } = await api.post("/wellness/meals", payload);
  return data.data;
};

export const updateMealLog = async (mealLogId, payload) => {
  const { data } = await api.patch(`/wellness/meals/${mealLogId}`, payload);
  return data.data;
};

export const removeMealLog = async (mealLogId) => {
  const { data } = await api.delete(`/wellness/meals/${mealLogId}`);
  return data.data;
};
