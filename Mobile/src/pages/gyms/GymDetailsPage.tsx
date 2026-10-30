import * as Crypto from "expo-crypto";
import { useRef } from "react";
import { Image, Text, View } from "react-native";
import BarChart from "../../components/charts/BarChart";
import {
  Badge,
  Button,
  Card,
  Empty,
  GymImage,
  Header,
  LoadState,
  Page,
  Row,
  Section,
  Verified,
} from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction, useResource } from "../../hooks/useApi";
import type { ScreenProps } from "../../routes/types";
import { money } from "../../utils/format.cjs";
import { mediaSource } from "../../utils/media";
export function GymScreen({ route, navigation }: ScreenProps<"Gym">) {
  const { call, user } = useAuth();
  const { run, busy } = useAction();
  const { confirm } = useFeedback();
  const state = useResource<any>(`/gyms/${route.params.id}`);
  const crowd = useResource<any>(`/gyms/${route.params.id}/crowd`);
  const posts = useResource<any>(`/gyms/${route.params.id}/posts`);
  const gym = state.data?.data;
  const keys = useRef<Record<string, string>>({});
  return (
    <Page
      refreshing={state.loading}
      onRefresh={() => {
        state.reload();
        crowd.reload();
        posts.reload();
      }}
    >
      <Header title="Your next gym" back />
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {gym && (
        <>
          <View className="mb-5 overflow-hidden rounded-3xl">
            <GymImage gym={gym} height={280} />
          </View>
          <Verified />
          <Text className="mt-3 text-3xl font-bold text-white">{gym.name}</Text>
          <Text className="mt-2 text-sm text-muted">
            {[gym.address, gym.city, gym.state].filter(Boolean).join(", ")}
          </Text>
          <Text className="mt-5 text-base leading-7 text-white">
            {gym.description || "Find your rhythm at this FitSwap partner gym."}
          </Text>
          <View className="mt-5 flex-row flex-wrap gap-3">
            {user?.role === "USER" && (
              <Button
                secondary
                title="Find a trial"
                onPress={() => navigation.navigate("Trials")}
              />
            )}
            <Button
              secondary
              title="Nearby map"
              onPress={() => navigation.navigate("Nearby")}
            />
          </View>
          <Section title="Gallery" />
          <ResponsiveGrid>
            {gym.images?.map((i: any) => (
              <Image
                key={i.id || i.imageUrl}
                source={{ uri: i.imageUrl }}
                style={{
                  width: "100%",
                  height: 180,
                  marginBottom: 14,
                  borderRadius: 20,
                }}
                resizeMode="cover"
              />
            ))}
          </ResponsiveGrid>
          <Section title="Membership plans" />
          <ResponsiveGrid maxColumns={2}>
            {gym.plans?.map((plan: any) => (
              <Card key={plan.id}>
                <Text className="text-xl font-bold text-white">
                  {plan.name}
                </Text>
                <Text className="my-4 text-3xl font-bold text-white">
                  {money(plan.price)}
                </Text>
                <Row label="Duration" value={`${plan.durationInDays} days`} />
                <Row
                  label="Transferable"
                  value={plan.transferable ? "Yes" : "No"}
                />
                <Row label="Transfer fee" value={money(plan.transferFee)} />
                <Row
                  label="Minimum transfer days"
                  value={String(plan.minimumTransferDays ?? 30)}
                />
                <Row
                  label="Maximum transfers"
                  value={
                    plan.maximumTransfers == null
                      ? "No limit"
                      : String(plan.maximumTransfers)
                  }
                />
                <Row
                  label="Gym approval required"
                  value={plan.requiresGymApproval !== false ? "Yes" : "No"}
                />
                <Row
                  label="Freeze allowed"
                  value={plan.freezeAllowed ? "Yes" : "No"}
                />
                <View className="mt-5">
                  <Button
                    busy={busy}
                    title="Buy membership with UPI"
                    disabled={user?.role !== "USER"}
                    onPress={() =>
                      run(async () => {
                        if (
                          !(await confirm(
                            "Create membership checkout?",
                            `${plan.name}: ${money(plan.price)}. Review the exact amount and payee on the next screen.`,
                            "Continue",
                          ))
                        )
                          return;
                        keys.current[plan.id] ||= Crypto.randomUUID();
                        const r = await call<any>(
                          "/upi-payments/gym-memberships",
                          {
                            method: "POST",
                            body: { planId: plan.id },
                            key: keys.current[plan.id],
                          },
                        );
                        navigation.navigate("Payment", { payment: r.data });
                      })
                    }
                  />
                </View>
              </Card>
            ))}
          </ResponsiveGrid>
          {!gym.plans?.length && <Empty title="Plans coming soon" />}
          <Section title="Live crowd" />
          <LoadState
            loading={crowd.loading}
            error={crowd.error}
            retry={crowd.reload}
          />
          {crowd.data && (
            <Card>
              <Badge title={crowd.data.data.level || "No recent reports"} />
              <Text className="my-4 text-sm text-muted">
                {crowd.data.data.reportCount} recent reports. Reports are
                contributed by members.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {["LOW", "MEDIUM", "HIGH"].map((level) => (
                  <Button
                    key={level}
                    secondary
                    busy={busy}
                    title={`Report ${level.toLowerCase()}`}
                    onPress={() =>
                      run(async () => {
                        await call(`/gyms/${gym.id}/crowd-reports`, {
                          method: "POST",
                          body: { level },
                        });
                        crowd.reload();
                      }, "Crowd report submitted.")
                    }
                  />
                ))}
              </View>
              {crowd.data.data.hasFullInsights ? (
                <>
                  <Section title="30-day crowd pattern" />
                  <BarChart
                    data={crowd.data.data.history?.days || []}
                    valueKey="crowdPercent"
                  />
                  <Text className="text-sm leading-6 text-muted">
                    Quietest reported time:{" "}
                    {crowd.data.data.history?.calmestTime?.label ||
                      "Not enough reports yet"}
                  </Text>
                </>
              ) : (
                <View className="mt-4">
                  <Button
                    secondary
                    title="Explore Plus crowd insights"
                    onPress={() => navigation.navigate("Plus")}
                  />
                </View>
              )}
            </Card>
          )}
          <Section title="Gym updates & offers" />
          <LoadState
            loading={posts.loading}
            error={posts.error}
            retry={posts.reload}
          />
          <ResponsiveGrid maxColumns={2}>
            {posts.data?.data?.map((p: any) => (
              <Card key={p.id}>
                <Badge title={p.kind} />
                {p.posterUrl && (
                  <Image
                    source={mediaSource(p.posterUrl)}
                    style={{ height: 200, marginTop: 16, borderRadius: 16 }}
                  />
                )}
                <Text className="my-4 text-xl font-bold text-white">
                  {p.title}
                </Text>
                <Text className="text-sm leading-6 text-white">{p.body}</Text>
                {p.offerPrice != null && (
                  <Text className="mt-3 text-lg font-bold text-violet-400">
                    {money(p.offerPrice)}
                  </Text>
                )}
                {p.winnerName && (
                  <Text className="mt-3 text-sm text-white">
                    Winner: {p.winnerName}
                  </Text>
                )}
              </Card>
            ))}
          </ResponsiveGrid>
        </>
      )}
    </Page>
  );
}
