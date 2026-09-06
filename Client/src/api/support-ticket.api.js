import axios from "./axios";

export async function getSupportTickets(filters = {}) {
  const { data } = await axios.get("/support/tickets", { params: filters });
  return data.data;
}

export async function getSupportTicket(ticketId) {
  const { data } = await axios.get(`/support/tickets/${ticketId}`);
  return data.data;
}

export async function createSupportTicket(payload) {
  const { data } = await axios.post("/support/tickets", payload);
  return data.data;
}

export async function replyToSupportTicket(ticketId, { body, attachments = [] }) {
  const form = new FormData();
  if (body?.trim()) form.append("body", body.trim());
  attachments.forEach((file) => form.append("attachments", file));

  const { data } = await axios.post(`/support/tickets/${ticketId}/messages`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function updateSupportTicket(ticketId, payload) {
  const { data } = await axios.patch(`/support/tickets/${ticketId}`, payload);
  return data.data;
}

export async function reopenSupportTicket(ticketId) {
  const { data } = await axios.post(`/support/tickets/${ticketId}/reopen`);
  return data.data;
}

export async function downloadSupportAttachment(ticketId, attachmentId, fileName) {
  const response = await axios.get(
    `/support/tickets/${ticketId}/attachments/${attachmentId}`,
    { responseType: "blob" },
  );
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "support-attachment";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
