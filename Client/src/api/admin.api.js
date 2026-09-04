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

export const getPlatformAnalytics = async (filters = {}) => {
  const { data } = await axios.get("/admin/analytics", { params: filters });
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

export const getAuditLogs = async (filters = {}) => {
  const { data } = await axios.get("/admin/audit-logs", { params: filters });
  return data.data;
};

export const getTransferAuditLogs = async (filters = {}) => {
  const { data } = await axios.get("/admin/transfer-audit-logs", { params: filters });
  return data.data;
};

export const getFraudAlerts = async () => {
  const { data } = await axios.get("/admin/fraud-alerts");
  return data.data;
};

export const getAdminUsers = async (filters = {}) => {
  const { data } = await axios.get("/admin/users", { params: filters });
  return data.data;
};

export const updateAdminUserRole = async (userId, role) => {
  const { data } = await axios.patch(`/admin/users/${userId}/role`, { role });
  return data.data;
};

export const updateAdminUserAccess = async (userId, isActive) => {
  const { data } = await axios.patch(`/admin/users/${userId}/access`, { isActive });
  return data.data;
};

export const getAdminPayments = async (filters = {}) => {
  const { data } = await axios.get("/admin/payments", { params: filters });
  return data.data;
};

export const getSecurityOverview = async () => {
  const { data } = await axios.get("/admin/security-overview");
  return data.data;
};
