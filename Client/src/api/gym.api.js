import axios from "./axios";

export const createGym = async (gymData) => {
    const { data } = await axios.post("/gyms", gymData);
    return data.data;
};

export const submitGymVerification = async (gymId, file) => {
    const form = new FormData();
    form.append("document", file);
    const { data } = await axios.post(`/gyms/${gymId}/verification-documents`, form, {
        headers: { "Content-Type": undefined },
        timeout: 120000,
    });
    return data.data;
};

export const downloadGymVerification = async (gymId, document) => {
    let response;
    try {
        response = await axios.get(`/gyms/${gymId}/verification-documents/${document.id}`, { responseType: "blob" });
    } catch (error) {
        if (error.response?.data instanceof Blob) {
            try { error.response.data = JSON.parse(await error.response.data.text()); }
            catch { /* Keep the original transport error if the response is not JSON. */ }
        }
        throw error;
    }
    const url = URL.createObjectURL(response.data);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = document.fileName || "gym-verification.pdf";
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

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

export const getGymCrowdLevel = async (gymId) => {
    const { data } = await axios.get(`/gyms/${gymId}/crowd`);
    return data.data;
};

export const reportGymCrowdLevel = async (gymId, level) => {
    const { data } = await axios.post(`/gyms/${gymId}/crowd-reports`, { level });
    return data.data;
};
