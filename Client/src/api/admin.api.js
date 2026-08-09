import axios from "./axios";

export const getAdminDashboard = async () => {
  const { data } = await axios.get("/admin/dashboard");
  return data.data;
};

export const getPendingGyms = async () => {
  const { data } = await axios.get("/admin/pending-gyms");
  return data.data;
};

export const updateGymApproval = async (gymId, status) => {
  const { data } = await axios.patch(`/gyms/${gymId}/status`, { status });
  return data.data;
};

export const getAdminListings = async () => {
  const { data } = await axios.get("/admin/listings");
  return data.data;
};

export const updateAdminListingStatus = async (listingId, status) => {
  const { data } = await axios.patch(`/admin/listings/${listingId}/status`, { status });
  return data.data;
};

export const getPlatformAnalytics = async () => {
  const { data } = await axios.get("/admin/analytics");
  return data.data;
};

export const getAnnouncementRecipients = async () => {
  const { data } = await axios.get("/admin/announcement-recipients");
  return data.data;
};

export const createAnnouncement = async (payload) => {
  const { data } = await axios.post("/admin/announcements", payload);
  return data.data;
};

export const getAnnouncements = async () => {
  const { data } = await axios.get("/admin/announcements");
  return data.data;
};

export const getAuditLogs = async () => {
  const { data } = await axios.get("/admin/audit-logs");
  return data.data;
};
