import axios from "./axios";

export const getGymOwnerDashboard = async (config = {}) => {
  const { data } = await axios.get("/gym-owner/dashboard", config);
  return data.data;
};

export const getGymOwnerMembers = async (config = {}) => {
  const { data } = await axios.get("/gym-owner/members", config);
  return data.data;
};

export const getGymOwnerSales = async (config = {}) => {
  const { data } = await axios.get("/gym-owner/sales", config);
  return data.data;
};

export const getGymOwnerTransfers = async (config = {}) => {
  const { data } = await axios.get("/gym-owner/transfers", config);
  return data.data;
};

export const getGymTransferAuditLogs = async (filters = {}, config = {}) => {
  const { data } = await axios.get("/gym-owner/transfer-audit-logs", { ...config, params: filters });
  return data.data;
};

export const getGymFraudAlerts = async (config = {}) => {
  const { data } = await axios.get("/gym-owner/fraud-alerts", config);
  return data.data;
};
