import axios, { createIdempotencyConfig } from "./axios";

const unwrap = async (request) => {
  const { data } = await request;
  return data.data;
};

export const createGymUpiPaymentRequest = (planId, idempotencyKey) =>
  unwrap(axios.post("/upi-payments/gym-memberships", { planId }, createIdempotencyConfig("upi-gym", idempotencyKey)));

export const createMarketplaceUpiPaymentRequest = (listingId, idempotencyKey) =>
  unwrap(axios.post("/upi-payments/marketplace", { listingId }, createIdempotencyConfig("upi-marketplace", idempotencyKey)));

export const markUpiPaymentPaid = (requestId, utr, idempotencyKey) =>
  unwrap(axios.post(`/upi-payments/${requestId}/mark-paid`, { utr }, createIdempotencyConfig("upi-paid", idempotencyKey)));

export const confirmUpiPaymentReceived = (requestId) =>
  unwrap(axios.post(`/upi-payments/${requestId}/confirm`));

export const approveUpiMarketplaceTransfer = (requestId) =>
  unwrap(axios.post(`/upi-payments/${requestId}/gym-approve`));

export const rejectUpiPayment = (requestId, reason) =>
  unwrap(axios.post(`/upi-payments/${requestId}/reject`, { reason }));

export const cancelUpiPaymentRequest = (requestId) =>
  unwrap(axios.post(`/upi-payments/${requestId}/cancel`));

export const getMyUpiPaymentRequests = (config = {}) =>
  unwrap(axios.get("/upi-payments/mine", config));

export const getGymUpiApprovalRequests = () =>
  unwrap(axios.get("/upi-payments/gym-approvals"));
