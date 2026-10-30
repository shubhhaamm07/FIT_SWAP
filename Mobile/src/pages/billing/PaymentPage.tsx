import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import { useEffect, useState } from "react";
import { AppState, Linking, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import {
  Badge,
  Button,
  Card,
  Field,
  Header,
  LoadState,
  Page,
  Row,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { money } from "../../utils/format.cjs";
export default function PaymentPage({ route }: ScreenProps<"Payment">) {
  const { call, demo } = useAuth();
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const [utr, setUtr] = useState("");
  const [now, setNow] = useState(Date.now());
  const [key] = useState(() => Crypto.randomUUID());
  const platform = route.params.platform;
  const initial = route.params.payment;
  const state = useResource<any>(
    platform ? "/platform-billing/mine" : "/upi-payments/mine",
  );
  const data = state.data?.data;
  const payment =
    (platform
      ? data?.payments
      : [...(data?.outgoing || []), ...(data?.incoming || [])]
    )?.find((p: any) => p.id === initial.id) || initial;
  const remaining = Math.max(
    0,
    Math.ceil((new Date(payment.expiresAt).getTime() - now) / 1000),
  );
  const prefix = platform ? "/platform-billing" : "/upi-payments";
  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === "active") setNow(Date.now());
    }, 1000);
    const refresh = setInterval(() => {
      if (AppState.currentState === "active") state.reload();
    }, 20000);
    return () => {
      clearInterval(timer);
      clearInterval(refresh);
    };
  }, []);
  const awaiting = payment.status === "AWAITING_PAYMENT";
  let intent = "";
  try {
    const parsed = new URL(payment.upiIntent);
    if (parsed.protocol === "upi:" && parsed.hostname === "pay")
      intent = payment.upiIntent;
  } catch {}
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Secure UPI checkout"
        subtitle="Pay the exact amount and track confirmation here."
        back
      />
      <LoadState loading={false} error={state.error} retry={state.reload} />
      <Card>
        <Badge title={payment.status} green={payment.status === "COMPLETED"} />
        <Text className="mt-5 text-4xl font-bold text-white">
          {money(Number(payment.amount) / 100)}
        </Text>
        <Row
          label="Payee"
          value={payment.payeeName || payment.recipient?.firstName || "FitSwap"}
        />
        <Row
          label="UPI ID"
          value={
            payment.recipientUpiId ||
            payment.platformUpiId ||
            "See recipient details"
          }
        />
        <Row label="Payment reference" value={payment.paymentRef} />
        {awaiting && remaining > 0 && intent && (
          <>
            <View
              style={{
                backgroundColor: "#fff",
                padding: 16,
                alignSelf: "center",
                borderRadius: 20,
                marginVertical: 24,
              }}
            >
              <QRCode value={intent} size={190} />
            </View>
            <Text className="mb-5 text-center text-sm text-amber-400">
              Expires in {Math.floor(remaining / 60)}:
              {String(remaining % 60).padStart(2, "0")}
            </Text>
            <Button
              title="Open UPI app"
              busy={busy}
              onPress={() =>
                run(async () => {
                  if (demo) throw new Error("Sign in to make a payment.");
                  await Linking.openURL(intent);
                })
              }
            />
            <View className="mt-3">
              <Button
                title="Copy UPI ID"
                secondary
                onPress={() =>
                  run(() =>
                    Clipboard.setStringAsync(
                      payment.recipientUpiId || payment.platformUpiId,
                    ),
                  )
                }
              />
            </View>
            <View className="mt-5">
              <Field
                label="UPI UTR / reference number"
                value={utr}
                onChangeText={setUtr}
                autoCapitalize="characters"
              />
            </View>
            <Button
              title="I have paid — notify recipient"
              busy={busy}
              disabled={!utr.trim()}
              onPress={() =>
                run(async () => {
                  if (
                    !(await confirm(
                      "Submit payment reference?",
                      "Only submit after paying. The recipient will check their bank before confirming.",
                      "Submit reference",
                    ))
                  )
                    return;
                  await call(`${prefix}/${payment.id}/mark-paid`, {
                    method: "POST",
                    body: { utr: utr.trim() },
                    key,
                  });
                  state.reload();
                }, "Payment reference submitted for verification.")
              }
            />
            <View className="mt-3">
              <Button
                secondary
                title="Cancel payment request"
                busy={busy}
                onPress={() =>
                  run(async () => {
                    if (
                      !(await confirm(
                        "Cancel payment request?",
                        "Do not cancel after sending a payment; contact support instead.",
                        "Cancel request",
                      ))
                    )
                      return;
                    await call(`${prefix}/${payment.id}/cancel`, {
                      method: "POST",
                    });
                    state.reload();
                  })
                }
              />
            </View>
          </>
        )}
        {awaiting && remaining === 0 && (
          <Text className="mt-5 text-sm leading-6 text-red-400">
            This request has expired. Create a new request before paying.
          </Text>
        )}
        {!awaiting && (
          <Text className="mt-5 text-sm leading-6 text-muted">
            {payment.status === "BUYER_MARKED_PAID"
              ? "Your reference has been submitted. The recipient must verify the actual payment before membership activation or transfer."
              : payment.status === "AWAITING_GYM_APPROVAL"
                ? "Payment is confirmed. The gym is reviewing the membership handover."
                : payment.status === "COMPLETED"
                  ? "This workflow is complete."
                  : payment.rejectionReason ||
                    "This payment request is no longer active."}
          </Text>
        )}
      </Card>
      <Text className="text-sm leading-6 text-muted">
        FitSwap cannot see your bank balance or verify a transfer automatically.
        Membership activation follows recipient confirmation and any required
        gym approval.
      </Text>
    </Page>
  );
}
