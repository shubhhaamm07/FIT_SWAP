import { useNavigation, type NavigationProp } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import { useRef } from "react";
import { Text } from "react-native";
import { ResourcePage } from "../../components/common/ResourcePage";
import SculptureHero from "../../components/common/SculptureHero";
import { Badge, Button, Card, Section } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction } from "../../hooks/useApi";
import type { RootStack } from "../../routes/types";
import { dateLabel, money } from "../../utils/format.cjs";
export default function FitSwapPlusPage() {
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const { user, call } = useAuth();
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  const keys = useRef<Record<string, string>>({});
  const owner = user?.role === "GYM_OWNER";
  return (
    <ResourcePage
      title={owner ? "FitSwap Business" : "FitSwap Plus"}
      path="/platform-billing/mine"
    >
      {(data) => (
        <>
          <SculptureHero
            title={
              owner
                ? "More room\nto grow."
                : "More freedom.\nMore possibilities."
            }
            description={
              owner
                ? "Grow your gym with FitSwap’s business tools."
                : "Multiple listings, fair-price guidance, quiet-time insights, priority support, and a monthly listing boost."
            }
          />
          <Section title="Your benefits" />
          <Card>
            {(owner
              ? [
                  "Gym operations and memberships",
                  "Business subscription history",
                ]
              : [
                  "Multiple active membership listings",
                  "Fair-price suggestions",
                  "30-day crowd and wellness insights",
                  "Unlimited saved listings and price-drop alerts",
                  "One 7-day complimentary boost each calendar month",
                  "Priority support",
                ]
            ).map((f) => (
              <Text key={f} className="py-2 text-sm text-white">
                ✦ {f}
              </Text>
            ))}
            {(data.activeMemberSubscription ||
              data.activeOwnerSubscription) && (
              <Text className="mt-4 text-sm font-bold text-emerald-400">
                Active until{" "}
                {dateLabel(
                  (
                    data.activeMemberSubscription ||
                    data.activeOwnerSubscription
                  ).benefitExpiresAt,
                )}
              </Text>
            )}
          </Card>
          <Section title="Choose your plan" />
          <ResponsiveGrid maxColumns={2}>
            {data.offers
              ?.filter(
                (o: any) =>
                  o.kind ===
                  (owner ? "OWNER_SUBSCRIPTION" : "MEMBER_SUBSCRIPTION"),
              )
              .map((offer: any) => (
                <Card key={offer.code}>
                  <Badge title={`${offer.benefitDays} days`} />
                  <Text className="mt-4 text-xl font-bold text-white">
                    {offer.label}
                  </Text>
                  <Text className="my-5 text-3xl font-bold text-white">
                    {money(offer.amount / 100)}
                  </Text>
                  <Button
                    title="Continue to checkout"
                    busy={busy}
                    onPress={() =>
                      run(async () => {
                        if (
                          !(await confirm(
                            "Create subscription payment?",
                            `${offer.label} costs ${money(offer.amount / 100)}. Benefits start after the payment is verified.`,
                            "Continue",
                          ))
                        )
                          return;
                        keys.current[offer.code] ||= Crypto.randomUUID();
                        const r = await call<any>(
                          `/platform-billing/${owner ? "owner" : "member"}-subscription`,
                          {
                            method: "POST",
                            body: { planCode: offer.code },
                            key: keys.current[offer.code],
                          },
                        );
                        navigation.navigate("Payment", {
                          payment: r.data,
                          platform: true,
                        });
                      })
                    }
                  />
                </Card>
              ))}
          </ResponsiveGrid>
          <Section title="Billing history" />
          {data.payments?.map((p: any) => (
            <Card key={p.id}>
              <Badge title={p.status} />
              <Text className="my-3 text-lg font-bold text-white">
                {p.label || p.planCode} · {money(p.amount / 100)}
              </Text>
              <Button
                secondary
                title="View payment"
                onPress={() =>
                  navigation.navigate("Payment", { payment: p, platform: true })
                }
              />
            </Card>
          ))}
        </>
      )}
    </ResourcePage>
  );
}
