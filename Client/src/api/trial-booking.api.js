import axios from "./axios";

export const getAvailableTrialSlots = async (filters = {}) => {
  const params = { ...filters };
  if (params.date) {
    const dayStart = new Date(`${params.date}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    if (!Number.isNaN(dayStart.getTime())) {
      params.from = dayStart.toISOString();
      params.to = dayEnd.toISOString();
    }
    delete params.date;
  }

  const { data } = await axios.get("/trial-slots", { params });
  return data.data;
};

export const bookTrialSlot = async (slotId) => {
  const { data } = await axios.post("/trial-bookings", { slotId });
  return data.data;
};

export const getMyTrialBookings = async () => {
  const { data } = await axios.get("/trial-bookings/my");
  return data.data;
};

export const cancelMyTrialBooking = async (bookingId, reason) => {
  const { data } = await axios.patch(`/trial-bookings/${bookingId}/cancel`, { reason });
  return data.data;
};

export const createOwnerTrialSlot = async (slot) => {
  const { data } = await axios.post("/gym-owner/trial-slots", slot);
  return data.data;
};

export const getOwnerTrialSlots = async (filters = {}) => {
  const { data } = await axios.get("/gym-owner/trial-slots", { params: filters });
  return data.data;
};

export const updateOwnerTrialSlot = async (slotId, updates) => {
  const { data } = await axios.patch(`/gym-owner/trial-slots/${slotId}`, updates);
  return data.data;
};

export const deactivateOwnerTrialSlot = async (slotId, reason) => {
  const { data } = await axios.patch(`/gym-owner/trial-slots/${slotId}/deactivate`, { reason });
  return data.data;
};

export const getOwnerTrialBookings = async (filters = {}) => {
  const { data } = await axios.get("/gym-owner/trial-bookings", { params: filters });
  return data.data;
};

export const updateOwnerTrialBookingStatus = async (bookingId, status, reason) => {
  const { data } = await axios.patch(`/gym-owner/trial-bookings/${bookingId}/status`, {
    status,
    reason,
  });
  return data.data;
};
