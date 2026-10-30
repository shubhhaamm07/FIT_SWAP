import { Text, View } from "react-native";
import { Details } from "../../components/common/ResourcePage";
import {
  Badge,
  Button,
  Card,
  Empty,
  Header,
  LoadState,
  Page,
  Section,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { textField, useForm } from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
export default function OwnerTransfersPage() {
  const { call } = useAuth();
  const { confirm } = useFeedback();
  const { openForm } = useForm();
  const { run, busy } = useAction();
  const upi = useResource<any>("/upi-payments/gym-approvals");
  const cash = useResource<any>("/transfer-requests/gym-approvals");
  const transfers = useResource<any>("/gym-owner/transfers");
  const reload = () => {
    upi.reload();
    cash.reload();
    transfers.reload();
  };
  return (
    <Page
      refreshing={upi.loading || cash.loading || transfers.loading}
      onRefresh={reload}
    >
      <Header
        title="Membership handovers"
        subtitle="Review transfers after payment verification."
        back
      />
      <LoadState
        loading={upi.loading || cash.loading}
        error={upi.error || cash.error || transfers.error}
        retry={reload}
      />
      {[
        {
          title: "UPI transfers awaiting gym approval",
          items: upi.data?.data || [],
          prefix: "/upi-payments",
          approve: "gym-approve",
          reject: "reject",
        },
        {
          title: "Cash transfers awaiting gym approval",
          items: cash.data?.data || [],
          prefix: "/transfer-requests",
          approve: "gym-approve",
          reject: "gym-reject",
        },
      ].map((group) => (
        <View key={group.prefix}>
          <Section title={group.title} />
          {group.items.map((item: any) => (
            <Card key={item.id}>
              <Badge title={item.status} />
              <Text className="my-3 text-xl font-bold text-white">
                {item.listing?.membership?.plan?.gym?.name}
              </Text>
              <Details data={item} paise={group.prefix === "/upi-payments"} />
              <View className="mt-4 flex-row flex-wrap gap-3">
                <Button
                  title="Approve handover"
                  busy={busy}
                  onPress={() =>
                    run(async () => {
                      if (
                        !(await confirm(
                          "Approve this handover?",
                          "Confirm the required payment checks and gym policy. Approval transfers ownership of the membership.",
                          "Approve handover",
                        ))
                      )
                        return;
                      await call(
                        `${group.prefix}/${item.id}/${group.approve}`,
                        {
                          method:
                            group.prefix === "/upi-payments" ? "POST" : "PATCH",
                        },
                      );
                      reload();
                    })
                  }
                />
                <Button
                  secondary
                  title="Reject"
                  onPress={() =>
                    openForm({
                      title: "Reject handover",
                      fields: [textField("reason", "Reason")],
                      onSubmit: async (body) => {
                        await call(
                          `${group.prefix}/${item.id}/${group.reject}`,
                          {
                            method:
                              group.prefix === "/upi-payments"
                                ? "POST"
                                : "PATCH",
                            body,
                          },
                        );
                        reload();
                      },
                    })
                  }
                />
              </View>
            </Card>
          ))}
          {!group.items.length && <Empty title="No approvals waiting" />}
        </View>
      ))}
      <Section title="Transfer history" />
      {transfers.data?.data?.map((item: any) => (
        <Card key={item.id}>
          <Badge title={item.status} />
          <Text className="my-3 text-lg font-bold text-white">
            {item.listing?.membership?.plan?.gym?.name}
          </Text>
          <Details data={item} />
        </Card>
      ))}
    </Page>
  );
}
