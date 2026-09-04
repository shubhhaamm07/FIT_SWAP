import api from "./axios";

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await api.post("/auth/login", credentials, { skipAuthLogout: true });
    return response.data;
};

export const loginWithGoogle = async (credential) => {
    const response = await api.post("/auth/google", { credential }, { skipAuthLogout: true });
    return response.data;
};

export const logoutUser = async () => {
    await api.post("/auth/logout", null, { skipAuthLogout: true });
};

export const getCurrentUser = async (config = {}) => {
    const response = await api.get("/auth/me", config);
    return response.data;
};

export const updateCurrentUser = async (profile) => {
    const response = await api.patch("/auth/me", profile);
    return response.data;
};

export const uploadProfileImage = async (type, file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(`/profile/${type}`, formData);

    return response.data;
};

export const getProfileImage = async (type) => {
    const response = await api.get(`/profile/${type}`, {
        responseType: "blob",
    });

    return response.data;
};

export const updateUserSettings = async (settings) => {
    const response = await api.patch("/auth/me/settings", settings);
    return response.data;
};

export const changeUserPassword = async (passwords) => {
    const response = await api.patch("/auth/me/password", passwords);
    return response.data;
};

export const deleteCurrentUser = async (confirmation) => {
    const response = await api.delete("/auth/me", { data: confirmation });
    return response.data;
};

export const requestPasswordReset = async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
};

export const resetPasswordWithToken = async ({ token, newPassword }) => {
    const response = await api.post("/auth/reset-password", { token, newPassword });
    return response.data;
};

export const verifyEmailAddress = async (token) => {
    const response = await api.post("/auth/verify-email", { token });
    return response.data;
};

export const resendVerificationEmail = async () => {
    const response = await api.post("/auth/send-verification");
    return response.data;
};

export const requestVerificationEmail = async (email) => {
    const response = await api.post("/auth/resend-verification", { email });
    return response.data;
};
