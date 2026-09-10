import Axios from "axios";

// Vite proxies this path locally and Netlify proxies it after deployment.
// Keeping every request same-origin avoids cross-site cookie failures.
export const apiBaseUrl = "/api";

const fallbackRequestId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

export const createIdempotencyConfig = (scope, key) => ({
    headers: {
        "Idempotency-Key": key || `${scope}:${globalThis.crypto?.randomUUID?.() || fallbackRequestId()}`,
    },
});

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
        // A 401 can mean a failed ownership check, a payment-provider issue,
        // or an expired session. Individual screens show their own errors;
        // AuthProvider and ProtectedRoute decide when sign-in is required.
        return Promise.reject(error);
    }
);

export default axios;
