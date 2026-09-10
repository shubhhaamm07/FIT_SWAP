import api from "./axios";

export const getSecurityOverview = async (config = {}) => {
  const { data } = await api.get("/security/overview", config);
  return data.data;
};

export const revokeSecuritySession = async (sessionId) => {
  const { data } = await api.post(`/security/sessions/${sessionId}/revoke`);
  return data.data;
};

export const revokeOtherSecuritySessions = async () => {
  const { data } = await api.post("/security/sessions/revoke-others");
  return data.data;
};
