import axios from "./axios";

export const getMyTransferRequests =
    async () => {
        const { data } = await axios.get(
            "/transfer-requests/my"
        );

        return data.data;
    };

export const getIncomingTransferRequests =
    async () => {
        const { data } = await axios.get(
            "/transfer-requests/incoming"
        );

        return data.data;
    };

export const createTransferRequest =
    async (listingId) => {
        const { data } = await axios.post(
            "/transfer-requests",
            {
                listingId,
            }
        );

        return data.data;
    };

export const approveTransferRequest =
    async (requestId) => {
        const { data } = await axios.patch(
            `/transfer-requests/${requestId}/approve`
        );

        return data.data;
    };

export const getGymCashApprovalRequests = async () => {
    const { data } = await axios.get("/transfer-requests/gym-approvals");
    return data.data;
};

export const approveCashTransferByGymOwner = async (requestId) => {
    const { data } = await axios.patch(`/transfer-requests/${requestId}/gym-approve`);
    return data.data;
};

export const rejectCashTransferByGymOwner = async (requestId) => {
    const { data } = await axios.patch(`/transfer-requests/${requestId}/gym-reject`);
    return data.data;
};

export const rejectTransferRequest =
    async (requestId) => {
        const { data } = await axios.patch(
            `/transfer-requests/${requestId}/reject`
        );

        return data.data;
    };

export const cancelTransferRequest =
    async (requestId) => {
        const { data } = await axios.patch(
            `/transfer-requests/${requestId}/cancel`
        );

        return data.data;
    };
