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
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { dateLabel, money } from "../../utils/format.cjs";
export function TransfersScreen({ navigation }: ScreenProps<"Transfers">) {
  const [tab, setTab] = useState("outgoing");
  const state = useResource<any>(
    tab === "outgoing"
      ? "/transfer-requests/my"
      : "/transfer-requests/incoming",
  );
  const { call } = useAuth();
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Your transfers"
        subtitle="Every step of the handover, in one place."
        back
      />
      <View className="mb-5 flex-row flex-wrap gap-2">
        <Button
          secondary={tab !== "outgoing"}
          title="Buying"
          onPress={() => setTab("outgoing")}
        />
        <Button
          secondary={tab !== "incoming"}
          title="Selling"
          onPress={() => setTab("incoming")}
        />
        <Button
          secondary
          title="UPI payments & receipts"
          onPress={() => navigation.navigate("Payments")}
        />
      </View>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <ResponsiveGrid maxColumns={2}>
        {state.data?.data.map((t: any) => (
          <Card key={t.id}>
            <Badge title={t.status} />
            <Text className="my-4 text-xl font-bold text-white">
              {t.listing?.membership?.plan?.gym?.name || "Membership transfer"}
            </Text>
            <Text className="mb-3 text-sm text-muted">
              {t.listing?.membership?.plan?.name} ·{" "}
              {money(t.listing?.askingPrice)}
            </Text>
            <Text className="mb-5 text-xs text-muted">
              Requested {dateLabel(t.createdAt)} ·{" "}
              {tab === "incoming"
                ? `Buyer: ${t.buyer?.firstName || "FitSwap member"}`
                : "Your transfer request"}
            </Text>
            {t.status === "PENDING" && (
              <View className="flex-row flex-wrap gap-3">
                {(tab === "incoming"
                  ? [
                      { action: "approve", title: "Confirm cash received" },
                      { action: "reject", title: "Reject request" },
                    ]
                  : [{ action: "cancel", title: "Cancel request" }]
                ).map((a) => (
                  <Button
                    key={a.action}
                    secondary
                    busy={busy}
                    title={a.title}
                    onPress={() =>
                      run(async () => {
                        if (
                          !(await confirm(
                            `${a.title}?`,
                            a.action === "approve"
                              ? "Confirm only after receiving and checking the cash payment. Gym approval may still be required."
                              : "This will close the pending request.",
                            "Confirm",
                          ))
                        )
                          return;
                        await call(`/transfer-requests/${t.id}/${a.action}`, {
                          method: "PATCH",
                        });
                        state.reload();
                      })
                    }
                  />
                ))}
              </View>
            )}
          </Card>
        ))}
      </ResponsiveGrid>
      {!state.loading && !state.error && !state.data?.data.length && (
        <Empty title="No transfer requests here yet" />
      )}
    </Page>
  );
}
