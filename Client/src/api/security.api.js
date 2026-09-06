import api from "./axios";

export const getSecurityOverview = async () => {
  const { data } = await api.get("/security/overview");
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
