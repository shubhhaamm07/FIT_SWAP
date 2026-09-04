import Axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const apiBaseUrl = configuredApiUrl || (import.meta.env.DEV ? "http://localhost:8000/api" : "/api");

if (import.meta.env.PROD && !configuredApiUrl) {
    console.error("VITE_API_URL is missing. Add the Render API URL in the Netlify environment settings.");
}

const axios = Axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // Some authenticated actions can receive a 401 from a third-party
        // provider (for example, Razorpay credentials on the API server).
        // Those errors must be displayed in context instead of logging the
        // member out of FitSwap.
        if (error.response?.status === 401 && !error.config?.skipAuthLogout) {
            window.location.href = "/login";
        }

        return Promise.reject(error);
    }
);

export default axios;
