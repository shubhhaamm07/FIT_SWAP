import { Text } from "react-native";
import { ResourcePage } from "../../components/common/ResourcePage";
import { Badge, Button, Card, Section } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { selectField, textField, useForm } from "../../contexts/FormContext";
import { useResource } from "../../hooks/useApi";
export default function AdminNotificationCentrePage() {
  const { call } = useAuth();
  const { openForm } = useForm();
  const { confirm } = useFeedback();
  const people = useResource<any>("/admin/announcement-recipients");
  return (
    <ResourcePage
      title="Reach the right people."
      subtitle="Create and review platform announcements."
      path="/admin/announcements"
    >
      {(announcements, reload) => (
        <>
          <Button
            title="Create announcement"
            disabled={people.loading || !!people.error}
            onPress={() =>
              openForm({
                title: "Create announcement",
                fields: [
                  textField("title", "Title"),
                  {
                    key: "message",
                    label: "Message",
                    type: "multiline",
                    required: true,
                  },
                  selectField("audience", "Audience", [
                    "ALL_USERS",
                    "MEMBERS",
                    "GYM_OWNERS",
                    "SELECTED_USERS",
                  ]),
                  {
                    key: "recipientIds",
                    label: "Selected recipients",
                    type: "multi",
                    options: (people.data?.data || []).map((p: any) => ({
                      value: p.id,
                      label: `${p.firstName} ${p.lastName} · ${p.email}`,
                    })),
                  },
                ],
                submitLabel: "Review and send",
                onSubmit: async (body) => {
                  if (
                    body.audience === "SELECTED_USERS" &&
                    !body.recipientIds.length
                  )
                    throw new Error("Choose at least one recipient.");
                  if (
                    !(await confirm(
                      "Send this announcement?",
                      `“${body.title}” will be sent to ${body.audience === "SELECTED_USERS" ? `${body.recipientIds.length} selected people` : body.audience.replace(/_/g, " ").toLowerCase()}.`,
                      "Send announcement",
                    ))
                  )
                    throw new Error("Announcement was not sent.");
                  await call("/admin/announcements", { method: "POST", body });
                  reload();
                },
              })
            }
          />
          <Section title="Announcement history" />
          {Array.isArray(announcements) &&
            announcements.map((a: any) => (
              <Card key={a.id}>
                <Badge title={a.audience} />
                <Text className="my-4 text-xl font-bold text-white">
                  {a.title}
                </Text>
                <Text className="text-sm leading-6 text-muted">
                  {a.message}
                </Text>
                <Text className="mt-4 text-xs text-muted">
                  {a.recipientCount} recipients ·{" "}
                  {new Date(a.createdAt).toLocaleString()}
                </Text>
              </Card>
            ))}
        </>
      )}
    </ResourcePage>
  );
}
