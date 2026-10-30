import * as Crypto from "expo-crypto";
import { useRef } from "react";
import { View } from "react-native";
import { ListingCard } from "../../components/marketplace/ListingCard";
import {
  Badge,
  Button,
  Empty,
  Header,
  LoadState,
  Page,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { numberField, useForm } from "../../contexts/FormContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
export function MyListingsScreen({ navigation }: ScreenProps<"MyListings">) {
  const state = useResource<any>("/listings/my");
  const billing = useResource<any>("/platform-billing/mine");
  const { call } = useAuth();
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  const { openForm } = useForm();
  const keys = useRef<Record<string, string>>({});
  return (
    <Page
      refreshing={state.loading}
      onRefresh={() => {
        state.reload();
        billing.reload();
      }}
    >
      <Header
        title="Your listings"
        subtitle="Unused time. New possibilities."
        back
      />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      <ResponsiveGrid maxColumns={2}>
        {state.data?.data.map((l: any) => (
          <View key={l.id} className="mb-7">
            <ListingCard
              listing={l}
              onPress={() => navigation.navigate("Listing", { id: l.id })}
            />
            <Badge title={l.status} />
            <View className="mt-4 flex-row flex-wrap gap-2">
              {["ACTIVE", "PAUSED"].includes(l.status) && (
                <>
                  <Button
                    secondary
                    title={l.status === "ACTIVE" ? "Pause" : "Activate"}
                    busy={busy}
                    onPress={() =>
                      run(async () => {
                        await call(
                          `/listings/${l.id}/${l.status === "ACTIVE" ? "pause" : "activate"}`,
                          { method: "PATCH" },
                        );
                        state.reload();
                      })
                    }
                  />
                  <Button
                    secondary
                    title="Update price"
                    onPress={() =>
                      openForm({
                        title: "Update listing price",
                        fields: [
                          numberField("askingPrice", "Asking price in rupees"),
                        ],
                        initial: l,
                        onSubmit: async (body) => {
                          await call(`/listings/${l.id}/price`, {
                            method: "PATCH",
                            body,
                          });
                          state.reload();
                        },
                      })
                    }
                  />
                  <Button
                    secondary
                    title="Cancel listing"
                    busy={busy}
                    onPress={() =>
                      run(async () => {
                        if (
                          !(await confirm(
                            "Cancel this listing?",
                            "It will no longer appear in the marketplace.",
                            "Cancel listing",
                          ))
                        )
                          return;
                        await call(`/listings/${l.id}/cancel`, {
                          method: "PATCH",
                        });
                        state.reload();
                      })
                    }
                  />
                </>
              )}
              {["EXPIRED", "CANCELLED"].includes(l.status) && (
                <Button
                  secondary
                  title="Renew listing"
                  busy={busy}
                  onPress={() =>
                    run(async () => {
                      await call(`/listings/${l.id}/renew`, {
                        method: "PATCH",
                      });
                      state.reload();
                    })
                  }
                />
              )}
              {l.status === "ACTIVE" && (
                <>
                  <Button
                    title="Boost listing"
                    busy={busy}
                    onPress={() =>
                      run(async () => {
                        if (
                          !(await confirm(
                            "Create boost checkout?",
                            "The next screen shows the price for a 7-day priority listing boost.",
                            "Continue",
                          ))
                        )
                          return;
                        keys.current[l.id] ||= Crypto.randomUUID();
                        const r = await call<any>(
                          `/platform-billing/listings/${l.id}/boost`,
                          { method: "POST", key: keys.current[l.id] },
                        );
                        navigation.navigate("Payment", {
                          payment: r.data,
                          platform: true,
                        });
                      })
                    }
                  />
                  {billing.data?.data?.entitlements
                    ?.freeMonthlyBoostAvailable && (
                    <Button
                      secondary
                      title="Redeem monthly Plus boost"
                      busy={busy}
                      onPress={() =>
                        run(async () => {
                          if (
                            !(await confirm(
                              "Use your monthly boost?",
                              "Apply this calendar month’s complimentary priority boost to this listing?",
                              "Apply boost",
                            ))
                          )
                            return;
                          keys.current[`plus:${l.id}`] ||= Crypto.randomUUID();
                          await call(
                            `/platform-billing/listings/${l.id}/plus-boost`,
                            {
                              method: "POST",
                              key: keys.current[`plus:${l.id}`],
                            },
                          );
                          state.reload();
                          billing.reload();
                        }, "Your listing boost is active.")
                      }
                    />
                  )}
                </>
              )}
            </View>
          </View>
        ))}
      </ResponsiveGrid>
      {!state.loading && !state.error && !state.data?.data.length && (
        <Empty
          title="Pass your membership forward"
          body="Open an eligible active membership and choose Sell unused membership."
        />
      )}
    </Page>
  );
}
