import axios from "./axios";

const unwrap = async (request) => {
  const { data } = await request;
  return data.data;
};

export const getMyPlatformBilling = () => unwrap(axios.get("/platform-billing/mine"));

export const createOwnerSubscriptionPayment = (planCode) =>
  unwrap(axios.post("/platform-billing/owner-subscription", { planCode }));

export const createListingBoostPayment = (listingId) =>
  unwrap(axios.post(`/platform-billing/listings/${listingId}/boost`));

export const markPlatformPaymentPaid = (requestId, utr) =>
  unwrap(axios.post(`/platform-billing/${requestId}/mark-paid`, { utr }));

export const cancelPlatformPayment = (requestId) =>
  unwrap(axios.post(`/platform-billing/${requestId}/cancel`));

export const getAdminPlatformPayments = () =>
  unwrap(axios.get("/platform-billing/admin/payments"));

export const confirmPlatformPayment = (requestId) =>
  unwrap(axios.post(`/platform-billing/admin/payments/${requestId}/confirm`));

export const rejectPlatformPayment = (requestId, reason) =>
  unwrap(axios.post(`/platform-billing/admin/payments/${requestId}/reject`, { reason }));
