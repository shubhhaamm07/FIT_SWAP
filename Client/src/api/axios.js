import Axios from "axios";

const axios = Axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Some authenticated actions can receive a 401 from a third-party
        // provider (for example, Razorpay credentials on the API server).
        // Those errors must be displayed in context instead of logging the
        // member out of FitSwap.
        if (error.response?.status === 401 && !error.config?.skipAuthLogout) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default axios;
