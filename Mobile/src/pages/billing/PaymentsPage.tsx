import { Text, View } from "react-native";
import { ResourcePage } from "../../components/common/ResourcePage";
import { Badge, Button, Card, Empty, Section } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { textField, useForm } from "../../contexts/FormContext";
import { useAction } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { money } from "../../utils/format.cjs";
export default function PaymentsPage({ navigation }: ScreenProps<"Payments">) {
  const { call } = useAuth();
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  const { openForm } = useForm();
  return (
    <ResourcePage title="Your payments" path="/upi-payments/mine">
      {(data, reload) => (
        <>
          {["outgoing", "incoming"].map((group) => (
            <View key={group}>
              <Section
                title={
                  group === "outgoing"
                    ? "Payments you sent"
                    : "Payments to receive"
                }
              />
              {data[group]?.map((payment: any) => (
                <Card key={payment.id}>
                  <Badge title={payment.status} />
                  <Text className="my-4 text-xl font-bold text-white">
                    {payment.gym?.name ||
                      payment.listing?.membership?.plan?.gym?.name ||
                      payment.paymentRef}
                  </Text>
                  <Text className="mb-4 text-xl font-bold text-white">
                    {money(payment.amount / 100)}
                  </Text>
                  {group === "outgoing" ? (
                    <Button
                      secondary
                      title="View payment"
                      onPress={() =>
                        navigation.navigate("Payment", { payment })
                      }
                    />
                  ) : (
                    ["BUYER_MARKED_PAID"].includes(payment.status) && (
                      <>
                        <Text className="mb-4 text-sm leading-6 text-muted">
                          Reference: {payment.utr || payment.paymentRef}. Check
                          your actual bank or UPI app before confirming receipt.
                        </Text>
                        <Button
                          busy={busy}
                          title="Confirm received payment"
                          onPress={() =>
                            run(async () => {
                              if (
                                !(await confirm(
                                  "Have you received this payment?",
                                  `Verify ${money(payment.amount / 100)} in your bank app. Confirmation may activate or transfer a membership.`,
                                  "Confirm receipt",
                                ))
                              )
                                return;
                              await call(
                                `/upi-payments/${payment.id}/confirm`,
                                { method: "POST" },
                              );
                              reload();
                            })
                          }
                        />
                        <View className="mt-3">
                          <Button
                            secondary
                            title="Reject payment"
                            onPress={() =>
                              openForm({
                                title: "Reject payment",
                                fields: [textField("reason", "Reason")],
                                onSubmit: async (body) => {
                                  await call(
                                    `/upi-payments/${payment.id}/reject`,
                                    { method: "POST", body },
                                  );
                                  reload();
                                },
                              })
                            }
                          />
                        </View>
                      </>
                    )
                  )}
                </Card>
              ))}
              {!data[group]?.length && <Empty title="No payments here yet" />}
            </View>
          ))}
        </>
      )}
    </ResourcePage>
  );
}
