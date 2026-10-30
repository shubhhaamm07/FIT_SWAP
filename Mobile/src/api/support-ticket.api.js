import { download, upload } from "../utils/files";
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

export async function replyToSupportTicket(
  ticketId,
  { body, attachments = [] },
) {
  return (
    await upload(
      `/support/tickets/${ticketId}/messages`,
      { body },
      attachments.map((file) => ({ field: "attachments", file })),
    )
  ).data;
}

export async function updateSupportTicket(ticketId, payload) {
  const { data } = await axios.patch(`/support/tickets/${ticketId}`, payload);
  return data.data;
}

export async function reopenSupportTicket(ticketId) {
  const { data } = await axios.post(`/support/tickets/${ticketId}/reopen`);
  return data.data;
}

export async function downloadSupportAttachment(
  ticketId,
  attachmentId,
  fileName,
) {
  return download(
    `/support/tickets/${ticketId}/attachments/${attachmentId}`,
    fileName || "support-attachment.pdf",
  );
}
