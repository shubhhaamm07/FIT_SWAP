import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { MembershipCard } from "../../components/memberships/MembershipCard";
import { Empty, Header, LoadState, Page } from "../../components/ui/index";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useResource } from "../../hooks/useApi";
import type { RootStack } from "../../routes/types";
import type { Envelope, Membership } from "../../types/domain";

export function MembershipsScreen() {
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const [filter, setFilter] = useState("ALL");
  const state = useResource<Envelope<Membership[]>>("/memberships/my");
  const items =
    state.data?.data.filter((m) => filter === "ALL" || m.status === filter) ||
    [];
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <Header
        title="Your membership wallet"
        subtitle="All your passes. More possibilities."
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {["ALL", "ACTIVE", "FROZEN", "EXPIRED"].map((f) => (
          <Pressable
            key={
              f === "ALL"
                ? "All passes"
                : f.charAt(0) + f.slice(1).toLowerCase()
            }
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f }}
            onPress={() => setFilter(f)}
            className={`min-h-11 items-center justify-center rounded-full border px-5 ${filter === f ? "border-violet-400 bg-violet-400/10" : "border-line bg-panel"}`}
          >
            <Text
              className={`text-[10px] font-semibold ${filter === f ? "text-violet-200" : "text-muted"}`}
            >
              {f === "ALL"
                ? "All passes"
                : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <LoadState
        loading={state.loading}
        error={state.error}
        retry={state.reload}
      />
      {!state.loading &&
        !state.error &&
        (items.length ? (
          <ResponsiveGrid maxColumns={2}>
            {items.map((m) => (
              <MembershipCard
                key={m.id}
                membership={m}
                onPress={() => navigation.navigate("Membership", { id: m.id })}
              />
            ))}
          </ResponsiveGrid>
        ) : (
          <Empty
            title="No memberships here yet"
            body="Explore partner gyms or find a resale membership in the marketplace."
          />
        ))}
    </Page>
  );
}
