import api from "./axios";

export const generateDietPlan = async (profile) => {
  const { data } = await api.post("/diet-planner/generate", profile);
  return data.data;
};

export const swapDietMeal = async (details) => {
  const { data } = await api.post("/diet-planner/swap-meal", details);
  return data.data;
};
