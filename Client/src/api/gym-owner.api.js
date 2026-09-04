import axios from "./axios";

export const getGymOwnerDashboard = async () => {
  const { data } = await axios.get("/gym-owner/dashboard");
  return data.data;
};

export const getGymOwnerMembers = async () => {
  const { data } = await axios.get("/gym-owner/members");
  return data.data;
};

export const getGymOwnerSales = async () => {
  const { data } = await axios.get("/gym-owner/sales");
  return data.data;
};

export const getGymOwnerTransfers = async () => {
  const { data } = await axios.get("/gym-owner/transfers");
  return data.data;
};

export const getGymTransferAuditLogs = async (filters = {}) => {
  const { data } = await axios.get("/gym-owner/transfer-audit-logs", { params: filters });
  return data.data;
};

export const getGymFraudAlerts = async () => {
  const { data } = await axios.get("/gym-owner/fraud-alerts");
  return data.data;
};
