import axios from "./axios";

export const getDashboard = async (config = {}) => {
    const { data } = await axios.get("/dashboard", config);
    return data.data;
};

export const getDashboardCharts = async (config = {}) => {
    const { data } = await axios.get("/dashboard/charts", config);
    return data.data;
};
