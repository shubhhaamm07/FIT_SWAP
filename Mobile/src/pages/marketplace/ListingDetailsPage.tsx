import * as Crypto from "expo-crypto";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import {
  Badge,
  Button,
  Card,
  GymImage,
  Header,
  LoadState,
  Page,
  Row,
  Verified,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import type { Envelope, Listing } from "../../types/domain";
import { dateLabel, daysLeft, money } from "../../utils/format.cjs";
export function ListingScreen({ route, navigation }: ScreenProps<"Listing">) {
  const { call } = useAuth();
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const [saved, setSaved] = useState(false);
  const keys = useRef<Record<string, string>>({});
  const savedState = useResource<any>("/saved-listings");
  const state = useResource<Envelope<Listing>>(`/listings/${route.params.id}`);
  const listing = state.data?.data;
  const plan = listing?.membership?.plan;
  useEffect(() => {
    if (savedState.data)
      setSaved(
        savedState.data.data.some(
          (item: any) => item.listing.id === route.params.id,
        ),
      );
  }, [savedState.data, route.params.id]);
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header title="A fresh start, for less." back />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {listing && plan && (
        <>
          <View className="mb-5 overflow-hidden rounded-3xl">
            <GymImage gym={plan.gym} height={280} />
          </View>
          <Verified />
          <Text className="mt-3 text-3xl font-bold text-white">
            {plan.gym.name}
          </Text>
          <Text className="mb-6 mt-2 text-sm text-muted">
            {plan.name} · {plan.gym.city}
          </Text>
          <ResponsiveGrid maxColumns={2}>
            <Card>
              <Badge title={listing.status} />
              <Text className="mt-5 text-xs text-muted">
                Membership resale price
              </Text>
              <Text className="mt-1 text-4xl font-bold text-white">
                {money(listing.askingPrice)}
              </Text>
              <Row
                label="Calendar days remaining"
                value={String(daysLeft(listing.membership.endDate))}
              />
              <Row
                label="Valid until"
                value={dateLabel(listing.membership.endDate)}
              />
              <Row label="Transfer fee" value={money(plan.transferFee)} />
              <Row
                label="Gym approval"
                value={
                  plan.requiresGymApproval !== false
                    ? "Required"
                    : "Not required"
                }
              />
              <Row
                label="Seller"
                value={
                  [listing.seller?.firstName, listing.seller?.lastName]
                    .filter(Boolean)
                    .join(" ") || "FitSwap seller"
                }
              />
            </Card>
            <Card>
              <Text className="mb-5 text-xl font-bold text-white">
                Make your next move.
              </Text>
              <Text className="mb-5 text-sm leading-6 text-muted">
                Eligibility and payment totals are confirmed by FitSwap before
                creating a payment request.
              </Text>
              {plan.allowOnlinePayment !== false && (
                <Button
                  title="Continue with UPI"
                  busy={busy}
                  disabled={listing.status !== "ACTIVE"}
                  onPress={() =>
                    run(async () => {
                      if (
                        !(await confirm(
                          "Create checkout request?",
                          `Membership price: ${money(listing.askingPrice)}. The next screen shows the exact amount and recipient.`,
                          "Continue",
                        ))
                      )
                        return;
                      keys.current.upi ||= Crypto.randomUUID();
                      const r = await call<any>("/upi-payments/marketplace", {
                        method: "POST",
                        body: { listingId: listing.id },
                        key: keys.current.upi,
                      });
                      navigation.navigate("Payment", { payment: r.data });
                    })
                  }
                />
              )}
              {plan.allowCashTransfer && (
                <View className="mt-3">
                  <Button
                    secondary
                    title="Request cash handover"
                    busy={busy}
                    disabled={listing.status !== "ACTIVE"}
                    onPress={() =>
                      run(async () => {
                        if (
                          !(await confirm(
                            "Request a cash handover?",
                            "The seller must confirm receipt and the gym may need to approve the transfer.",
                            "Send request",
                          ))
                        )
                          return;
                        keys.current.cash ||= Crypto.randomUUID();
                        await call("/transfer-requests", {
                          method: "POST",
                          body: { listingId: listing.id },
                          key: keys.current.cash,
                        });
                        navigation.navigate("Transfers");
                      }, "Transfer requested.")
                    }
                  />
                </View>
              )}
              <View className="mt-3">
                <Button
                  secondary
                  title={saved ? "Remove from saved" : "Save membership"}
                  busy={busy}
                  disabled={savedState.loading || !!savedState.error}
                  onPress={() =>
                    run(
                      async () => {
                        await call(
                          saved
                            ? `/saved-listings/${listing.id}`
                            : "/saved-listings",
                          {
                            method: saved ? "DELETE" : "POST",
                            ...(saved
                              ? {}
                              : { body: { listingId: listing.id } }),
                          },
                        );
                        setSaved((v) => !v);
                      },
                      saved ? "Removed from saved." : "Membership saved.",
                    )
                  }
                />
              </View>
              <View className="mt-3">
                <Button
                  secondary
                  title="View gym & transfer policy"
                  onPress={() =>
                    navigation.navigate("Gym", { id: plan.gym.id })
                  }
                />
              </View>
            </Card>
          </ResponsiveGrid>
        </>
      )}
    </Page>
  );
}
