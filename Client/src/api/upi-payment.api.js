import axios from "./axios";

const unwrap = async (request) => {
  const { data } = await request;
  return data.data;
};

export const createGymUpiPaymentRequest = (planId) =>
  unwrap(axios.post("/upi-payments/gym-memberships", { planId }));

export const createMarketplaceUpiPaymentRequest = (listingId) =>
  unwrap(axios.post("/upi-payments/marketplace", { listingId }));

export const markUpiPaymentPaid = (requestId, utr) =>
  unwrap(axios.post(`/upi-payments/${requestId}/mark-paid`, { utr }));

export const confirmUpiPaymentReceived = (requestId) =>
  unwrap(axios.post(`/upi-payments/${requestId}/confirm`));

export const approveUpiMarketplaceTransfer = (requestId) =>
  unwrap(axios.post(`/upi-payments/${requestId}/gym-approve`));

export const rejectUpiPayment = (requestId, reason) =>
  unwrap(axios.post(`/upi-payments/${requestId}/reject`, { reason }));

export const cancelUpiPaymentRequest = (requestId) =>
  unwrap(axios.post(`/upi-payments/${requestId}/cancel`));

export const getMyUpiPaymentRequests = () =>
  unwrap(axios.get("/upi-payments/mine"));

export const getGymUpiApprovalRequests = () =>
  unwrap(axios.get("/upi-payments/gym-approvals"));
