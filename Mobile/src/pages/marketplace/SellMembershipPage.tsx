import * as Crypto from "expo-crypto";
import { useState } from "react";
import { Text } from "react-native";
import {
  Button,
  Card,
  Field,
  Header,
  LoadState,
  Page,
  Row,
} from "../../components/ui/index";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import type { Envelope, Membership } from "../../types/domain";
import { daysLeft, money } from "../../utils/format.cjs";

export function SellScreen({ route, navigation }: ScreenProps<"Sell">) {
  const state = useResource<Envelope<Membership>>(
    `/memberships/${route.params.membershipId}`,
  );
  const eligibility = useResource<any>(
    `/memberships/${route.params.membershipId}/transfer-eligibility`,
  );
  const m = state.data?.data;
  const [suggestion, setSuggestion] = useState<any>(null);
  const [price, setPrice] = useState("");
  const [key] = useState(() => Crypto.randomUUID());
  const { call } = useAuth();
  const { confirm } = useFeedback();
  const { run, busy } = useAction();
  if (!m)
    return (
      <Page>
        <Header title="Pass it forward." back />
        <LoadState
          loading={state.loading}
          error={state.error}
          retry={state.reload}
        />
      </Page>
    );
  return (
    <Page>
      <Header
        title="Pass it forward."
        subtitle="Give your unused membership a new beginning."
        back
      />
      <Card>
        <Text className="text-xl font-bold text-white">{m.plan.gym.name}</Text>
        <Text className="mt-2 text-sm text-muted">
          {m.plan.name} · {daysLeft(m.endDate)} days until expiry
        </Text>
        <Row label="Original plan price" value={money(m.plan.price)} />
        <Row label="Transfer fee" value={money(m.plan.transferFee)} />
      </Card>
      <Card>
        <Text className="mb-3 text-lg font-bold text-white">
          Transfer eligibility
        </Text>
        <Text className="mb-4 text-sm text-muted">
          {eligibility.data?.data?.eligible
            ? "This membership is eligible for transfer."
            : eligibility.data?.data?.reasons?.join(" ") ||
              "Checking eligibility…"}
        </Text>
        <Button
          secondary
          title="Get a fair-price suggestion"
          busy={busy}
          onPress={() =>
            run(async () => {
              const r = await call<any>(`/listings/price-suggestion/${m.id}`);
              setSuggestion(r.data);
              const estimate =
                r.data.suggestedPrice ?? r.data.suggestion?.suggestedPrice;
              if (estimate != null) setPrice(String(estimate));
              else
                throw new Error(
                  r.data.message ||
                    "No price estimate is available for this membership.",
                );
            }, "Fair-price suggestion loaded.")
          }
        />
      </Card>
      {suggestion && (
        <Card>
          <Text className="mb-3 text-lg font-bold text-white">
            Fair-price guidance
          </Text>
          <Row
            label="Suggested price"
            value={money(suggestion.suggestedPrice)}
          />
          <Row
            label="Confidence"
            value={suggestion.confidence || "Unavailable"}
          />
          {suggestion.suggestedRange && (
            <Row
              label="Suggested range"
              value={`${money(suggestion.suggestedRange.minimum)} – ${money(suggestion.suggestedRange.maximum)}`}
            />
          )}
          {suggestion.reasons?.map((reason: string) => (
            <Text key={reason} className="mt-3 text-sm leading-6 text-muted">
              {reason}
            </Text>
          ))}
        </Card>
      )}
      <Field
        label="Your asking price (₹)"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="e.g. 4500"
      />
      <Text className="mb-6 text-sm leading-6 text-muted">
        FitSwap checks remaining time, transfer limits, and any existing listing
        before publishing.
      </Text>
      <Button
        title="Publish listing"
        disabled={!eligibility.data?.data?.eligible}
        busy={busy}
        onPress={() =>
          run(async () => {
            const amount = Number(price);
            if (
              !Number.isFinite(amount) ||
              amount <= 0 ||
              !/^\d+(\.\d{1,2})?$/.test(price)
            )
              throw new Error(
                "Enter a valid asking price with no more than two decimal places.",
              );
            if (
              !(await confirm(
                "Publish this membership?",
                `List ${m.plan.gym.name} for ${money(amount)} on the FitSwap marketplace?`,
                "Publish listing",
              ))
            )
              return;
            await call("/listings", {
              method: "POST",
              body: { membershipId: m.id, askingPrice: amount },
              key,
            });
            navigation.replace("MyListings");
          }, "Your listing is now published.")
        }
      />
    </Page>
  );
}
