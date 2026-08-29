import axios from "./axios";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
let razorpayScriptPromise;

export const createRazorpayOrder = async (listingId) => {
  const { data } = await axios.post(
    "/create-order",
    { listingId },
    { skipAuthLogout: true }
  );
  return data.data;
};

export const verifyRazorpayPayment = async (paymentDetails) => {
  const { data } = await axios.post(
    "/verify-payment",
    paymentDetails,
    { skipAuthLogout: true }
  );
  return data;
};

export const createGymMembershipRazorpayOrder = async (planId) => {
  const { data } = await axios.post(
    "/gym-memberships/create-order",
    { planId },
    { skipAuthLogout: true }
  );
  return data.data;
};

export const verifyGymMembershipRazorpayPayment = async (paymentDetails) => {
  const { data } = await axios.post(
    "/gym-memberships/verify-payment",
    paymentDetails,
    { skipAuthLogout: true }
  );
  return data;
};

export const loadRazorpayCheckout = () => {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => window.Razorpay
      ? resolve(window.Razorpay)
      : reject(new Error("Razorpay Checkout could not be loaded."));
    script.onerror = () => {
      razorpayScriptPromise = undefined;
      reject(new Error("Unable to load Razorpay Checkout. Check your internet connection and try again."));
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
};
