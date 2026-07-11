import axios from "./axios";

export const getDashboard = async () => {
    const { data } = await axios.get("/dashboard");
    return data.data;
};

export const getDashboardCharts = async () => {
    const { data } = await axios.get("/dashboard/charts");
    return data.data;
};