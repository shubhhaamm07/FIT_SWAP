import { Text, View } from "react-native";
import { ResourcePage } from "../../components/common/ResourcePage";
import { Badge, Button, Card, Section } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { selectField, useForm } from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { download, upload } from "../../utils/files";
export default function SupportTicketPage({
  route,
}: ScreenProps<"SupportTicket">) {
  const { call, user } = useAuth();
  const { openForm } = useForm();
  const { run, busy } = useAction();
  const base = `/support/tickets/${route.params.id}`;
  const staff = useResource<any>(
    user?.role === "ADMIN" ? "/admin/users?role=ADMIN" : "/auth/me",
  );
  return (
    <ResourcePage title="Support conversation" path={base}>
      {(ticket, reload) => (
        <>
          <Badge title={ticket.status} />
          <Text className="my-5 text-2xl font-bold text-white">
            {ticket.subject}
          </Text>
          <Text className="mb-5 text-sm leading-6 text-muted">
            {ticket.description}
          </Text>
          <View className="flex-row flex-wrap gap-3">
            <Button
              title="Reply"
              onPress={() =>
                openForm({
                  title: "Reply to support",
                  fields: [
                    { key: "body", label: "Message", type: "multiline" },
                    {
                      key: "attachment",
                      label: "Attach image or PDF (1 of 3)",
                      type: "file",
                    },
                    {
                      key: "attachment2",
                      label: "Second attachment (optional)",
                      type: "file",
                    },
                    {
                      key: "attachment3",
                      label: "Third attachment (optional)",
                      type: "file",
                    },
                  ],
                  onSubmit: async (values) => {
                    if (
                      !values.body.trim() &&
                      !values.attachment &&
                      !values.attachment2 &&
                      !values.attachment3
                    )
                      throw new Error("Add a message or attachment.");
                    await upload(
                      `${base}/messages`,
                      { body: values.body },
                      [
                        values.attachment,
                        values.attachment2,
                        values.attachment3,
                      ]
                        .filter(Boolean)
                        .map((file) => ({ field: "attachments", file })),
                    );
                    reload();
                  },
                })
              }
            />
            {["RESOLVED", "CLOSED"].includes(ticket.status) && (
              <Button
                secondary
                title="Reopen ticket"
                busy={busy}
                onPress={() =>
                  run(async () => {
                    await call(`${base}/reopen`, { method: "POST" });
                    reload();
                  })
                }
              />
            )}
            {user?.role === "ADMIN" && (
              <Button
                secondary
                title="Manage ticket"
                onPress={() =>
                  openForm({
                    title: "Update support ticket",
                    initial: ticket,
                    fields: [
                      selectField("status", "Status", [
                        "OPEN",
                        "IN_PROGRESS",
                        "WAITING_FOR_USER",
                        "RESOLVED",
                        "CLOSED",
                      ]),
                      selectField("priority", "Priority", [
                        "LOW",
                        "NORMAL",
                        "HIGH",
                        "URGENT",
                      ]),
                      {
                        key: "assignedToId",
                        label: "Assigned support administrator",
                        type: "select",
                        options: [
                          { value: "", label: "Unassigned" },
                          ...(Array.isArray(staff.data?.data)
                            ? staff.data.data
                                .filter((p: any) => p.role === "ADMIN")
                                .map((p: any) => ({
                                  value: p.id,
                                  label: `${p.firstName} ${p.lastName}`,
                                }))
                            : []),
                        ],
                      },
                    ],
                    onSubmit: async (body) => {
                      await call(base, {
                        method: "PATCH",
                        body: {
                          ...body,
                          assignedToId: body.assignedToId || null,
                        },
                      });
                      reload();
                    },
                  })
                }
              />
            )}
          </View>
          <Section title="Messages" />
          {ticket.messages?.map((message: any) => (
            <Card key={message.id}>
              <Text className="mb-2 text-xs font-semibold text-violet-400">
                {[message.sender?.firstName, message.sender?.lastName]
                  .filter(Boolean)
                  .join(" ") || "FitSwap support"}{" "}
                · {new Date(message.createdAt).toLocaleString()}
              </Text>
              <Text selectable className="text-base leading-7 text-white">
                {message.body}
              </Text>
              {message.attachments?.map((attachment: any) => (
                <View key={attachment.id} className="mt-3">
                  <Button
                    secondary
                    title={`Download ${attachment.fileName}`}
                    busy={busy}
                    onPress={() =>
                      run(() =>
                        download(
                          `${base}/attachments/${attachment.id}`,
                          attachment.fileName,
                        ),
                      )
                    }
                  />
                </View>
              ))}
            </Card>
          ))}
          <Section title="Ticket history" />
          {ticket.auditLogs?.map((event: any) => (
            <Card key={event.id}>
              <Text className="text-sm text-white">
                {event.summary || event.action}
              </Text>
              <Text className="mt-2 text-xs text-muted">
                {new Date(event.createdAt).toLocaleString()}
              </Text>
            </Card>
          ))}
        </>
      )}
    </ResourcePage>
  );
}
