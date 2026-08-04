import axios from "./axios";

export const getAllGyms = async () => {
    const { data } = await axios.get("/gyms");

    return data.data;
};

export const getMyGyms = async () => {
    const { data } = await axios.get(
        "/gyms/my-gyms"
    );

    return data.data;
};

export const getGymById = async (gymId) => {
    const { data } = await axios.get(`/gyms/${gymId}`);
    return data.data;
};
