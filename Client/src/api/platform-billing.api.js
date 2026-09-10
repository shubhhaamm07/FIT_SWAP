import axios, { createIdempotencyConfig } from "./axios";

const unwrap = async (request) => {
  const { data } = await request;
  return data.data;
};

export const getMyPlatformBilling = () => unwrap(axios.get("/platform-billing/mine"));

export const createOwnerSubscriptionPayment = (planCode, idempotencyKey) =>
  unwrap(axios.post("/platform-billing/owner-subscription", { planCode }, createIdempotencyConfig("owner-plan", idempotencyKey)));

export const createMemberSubscriptionPayment = (planCode, idempotencyKey) =>
  unwrap(axios.post("/platform-billing/member-subscription", { planCode }, createIdempotencyConfig("member-plan", idempotencyKey)));

export const createListingBoostPayment = (listingId, idempotencyKey) =>
  unwrap(axios.post(`/platform-billing/listings/${listingId}/boost`, undefined, createIdempotencyConfig("listing-boost", idempotencyKey)));

export const redeemMemberListingBoost = (listingId, idempotencyKey) =>
  unwrap(axios.post(`/platform-billing/listings/${listingId}/plus-boost`, undefined, createIdempotencyConfig("plus-monthly-boost", idempotencyKey)));

export const markPlatformPaymentPaid = (requestId, utr, idempotencyKey) =>
  unwrap(axios.post(`/platform-billing/${requestId}/mark-paid`, { utr }, createIdempotencyConfig("platform-paid", idempotencyKey)));

export const cancelPlatformPayment = (requestId) =>
  unwrap(axios.post(`/platform-billing/${requestId}/cancel`));

export const getAdminPlatformPayments = () =>
  unwrap(axios.get("/platform-billing/admin/payments"));

export const confirmPlatformPayment = (requestId) =>
  unwrap(axios.post(`/platform-billing/admin/payments/${requestId}/confirm`));

export const rejectPlatformPayment = (requestId, reason) =>
  unwrap(axios.post(`/platform-billing/admin/payments/${requestId}/reject`, { reason }));
