import { useState } from "react";
import { Text, View } from "react-native";
import {
  Badge,
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { selectField, textField, useForm } from "../../contexts/FormContext";
import { useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
export default function SupportTicketsPage({
  navigation,
}: ScreenProps<"Support">) {
  const [filter, setFilter] = useState("");
  const { call } = useAuth();
  const { openForm } = useForm();
  const state = useResource<any>(`/support/tickets?status=${filter}`);
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="We’re here to help."
        subtitle="Conversations, updates, and solutions in one place."
        back
      />
      <Button
        title="Create support ticket"
        onPress={() =>
          openForm({
            title: "How can we help?",
            fields: [
              textField("subject", "Subject"),
              {
                key: "description",
                label: "Describe the issue",
                type: "multiline",
                required: true,
              },
              selectField("category", "Category", [
                "TRANSFER",
                "PAYMENT",
                "MEMBERSHIP",
                "GYM",
                "LISTING",
                "ACCOUNT",
                "TECHNICAL",
                "OTHER",
              ]),
              selectField(
                "priority",
                "Priority",
                ["LOW", "NORMAL", "HIGH", "URGENT"],
                "NORMAL",
              ),
              selectField("relatedType", "Related to", [
                "NONE",
                "MEMBERSHIP",
                "TRANSFER",
                "PAYMENT",
                "LISTING",
                "GYM",
                "TRIAL",
              ]),
              textField(
                "relatedEntityId",
                "Related record reference (optional)",
                false,
              ),
            ],
            onSubmit: async (body) => {
              const result = await call<any>("/support/tickets", {
                method: "POST",
                body,
              });
              state.reload();
              navigation.navigate("SupportTicket", { id: result.data.id });
            },
          })
        }
      />
      <View className="my-4 flex-row flex-wrap gap-2">
        {[
          "",
          "OPEN",
          "IN_PROGRESS",
          "WAITING_FOR_USER",
          "RESOLVED",
          "CLOSED",
        ].map((status) => (
          <Button
            key={status}
            secondary={filter !== status}
            title={status.replace(/_/g, " ") || "All"}
            onPress={() => setFilter(status)}
          />
        ))}
      </View>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <ResponsiveGrid maxColumns={2}>
        {state.data?.data.map((ticket: any) => (
          <Card key={ticket.id}>
            <Badge title={ticket.status} />
            <Text className="my-4 text-lg font-bold text-white">
              {ticket.subject}
            </Text>
            <Text className="mb-4 text-sm text-muted">
              {ticket.ticketNumber || ticket.reference} · {ticket.priority}{" "}
              priority
            </Text>
            <Button
              secondary
              title="Open conversation"
              onPress={() =>
                navigation.navigate("SupportTicket", { id: ticket.id })
              }
            />
          </Card>
        ))}
      </ResponsiveGrid>
      {!state.loading && !state.error && !state.data?.data.length && (
        <Empty
          title="No tickets found"
          body="Start a conversation when you need help."
        />
      )}
    </Page>
  );
}
