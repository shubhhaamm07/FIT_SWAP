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

export const createMembershipPlan = async (gymId, planData) => {
    const { data } = await axios.post(`/gyms/${gymId}/plans`, planData);
    return data.data;
};

export const updateMembershipPlan = async (planId, planData) => {
    const { data } = await axios.patch(`/plans/${planId}`, planData);
    return data.data;
};

export const updateMyGym = async (gymId, gymData) => {
    const { data } = await axios.patch(`/gyms/${gymId}`, gymData);
    return data.data;
};
