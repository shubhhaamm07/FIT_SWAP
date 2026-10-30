import axios from "./axios";

export const createRazorpayOrder = async (listingId) => {
  const { data } = await axios.post(
    "/create-order",
    { listingId },
    { skipAuthLogout: true },
  );
  return data.data;
};

export const verifyRazorpayPayment = async (paymentDetails) => {
  const { data } = await axios.post("/verify-payment", paymentDetails, {
    skipAuthLogout: true,
  });
  return data;
};

export const createGymMembershipRazorpayOrder = async (planId) => {
  const { data } = await axios.post(
    "/gym-memberships/create-order",
    { planId },
    { skipAuthLogout: true },
  );
  return data.data;
};

export const verifyGymMembershipRazorpayPayment = async (paymentDetails) => {
  const { data } = await axios.post(
    "/gym-memberships/verify-payment",
    paymentDetails,
    { skipAuthLogout: true },
  );
  return data;
};
