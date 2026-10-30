import { useNavigation, type NavigationProp } from "@react-navigation/native";
import {
  ArrowUpRight,
  Bell,
  MapPin,
  Repeat2,
  CalendarDays,
  Dumbbell,
  Sparkles,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import SculptureHero from "../../components/common/SculptureHero";
import { ListingCard } from "../../components/marketplace/ListingCard";
import { GymCard } from "../../components/gyms/GymCard";
import { MembershipCard } from "../../components/memberships/MembershipCard";
import { Empty, LoadState, Page, Section } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { useAuth } from "../../contexts/AuthContext";
import { useResource } from "../../hooks/useApi";
import type { MainTabs, RootStack } from "../../routes/types";
import type { Dashboard, Envelope } from "../../types/domain";
import { typeface, lime } from "../../constants/design";
export default function DashboardPage() {
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const state = useResource<Envelope<Dashboard>>("/dashboard");
  const data = state.data?.data;
  const tab = (screen: keyof MainTabs) =>
    navigation.navigate("Main", { screen });
  const quick = [
    {
      title: "Sell a pass",
      icon: Repeat2,
      color: "#C2A8FF",
      press: () => tab("Memberships"),
    },
    {
      title: "Nearby gyms",
      icon: MapPin,
      color: lime,
      press: () => navigation.navigate("Nearby"),
    },
    {
      title: "Book a trial",
      icon: CalendarDays,
      color: "#FFBA92",
      press: () => navigation.navigate("Trials"),
    },
    {
      title: "My routine",
      icon: Dumbbell,
      color: "#95C9FF",
      press: () => navigation.navigate("Wellness"),
    },
  ];
  return (
    <Page refreshing={state.loading} onRefresh={state.reload}>
      <View className="mb-6 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-xs font-medium text-muted">
            A little stronger, every day.
          </Text>
          <Text
            style={{ fontFamily: typeface.display, letterSpacing: -0.9 }}
            className="mt-1 text-2xl text-white"
          >
            Hey, {user?.firstName || "athlete"}{" "}
            <Text style={{ color: lime }}>✦</Text>
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => navigation.navigate("Notifications")}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-line bg-panel"
        >
          <Bell size={19} color="#BFA9F1" />
          {!!data?.stats.notifications.unread && (
            <View
              style={{ backgroundColor: lime }}
              className="absolute right-2.5 top-2 h-1.5 w-1.5 rounded-full"
            />
          )}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          onPress={() => tab("Profile")}
          className="h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-400/10"
        >
          <Text className="text-base font-extrabold text-violet-300">
            {user?.firstName?.[0]}
            {user?.lastName?.[0]}
          </Text>
        </Pressable>
      </View>
      <SculptureHero onPress={() => tab("Marketplace")} />
      <View className="mb-6 mt-4 flex-row rounded-3xl border border-line bg-panel py-4">
        {[
          {
            label: "Active passes",
            value: data?.stats.memberships.active,
            press: () => tab("Memberships"),
          },
          {
            label: "In transfer",
            value: data?.stats.transfers.pending,
            press: () => navigation.navigate("Transfers"),
          },
          {
            label: "New updates",
            value: data?.stats.notifications.unread,
            press: () => navigation.navigate("Notifications"),
          },
        ].map((s, i) => (
          <Pressable
            accessibilityRole="button"
            key={s.label}
            onPress={s.press}
            className={`flex-1 items-center px-1 ${i ? "border-l border-line" : ""}`}
          >
            <Text className="text-2xl font-extrabold tracking-tight text-white">
              {s.value ?? "—"}
            </Text>
            <Text className="mt-1 text-[10px] font-medium text-muted">
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View className="flex-row gap-2">
        {quick.map((a) => (
          <Pressable
            key={a.title}
            accessibilityRole="button"
            onPress={a.press}
            className="flex-1 items-center gap-2"
          >
            <View
              style={{
                backgroundColor: `${a.color}12`,
                borderColor: `${a.color}25`,
              }}
              className="h-14 w-14 items-center justify-center rounded-2xl border"
            >
              <a.icon size={22} color={a.color} strokeWidth={1.8} />
            </View>
            <Text className="text-center text-[10px] font-semibold text-zinc-300">
              {a.title}
            </Text>
          </Pressable>
        ))}
      </View>
      <LoadState
        loading={state.loading && !data}
        error={state.error}
        retry={state.reload}
      />
      <Section
        title="Your membership wallet"
        action="View all"
        onPress={() => tab("Memberships")}
      />
      <ResponsiveGrid maxColumns={2}>
        {data?.memberships.slice(0, 2).map((m) => (
          <MembershipCard
            key={m.id}
            membership={m}
            onPress={() => navigation.navigate("Membership", { id: m.id })}
          />
        ))}
      </ResponsiveGrid>
      {data && !data.memberships.length && (
        <Empty
          title="Your next chapter starts here"
          body="Find a membership that fits your routine."
        />
      )}
      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate("Diet")}
        className="mb-1 mt-2 flex-row items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-4"
      >
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
          <Sparkles size={20} color="#BCA0FA" />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-bold text-white">
            Fuel your next personal best
          </Text>
          <Text className="mt-1 text-[11px] font-medium text-muted">
            Build your weekly meal plan with AI
          </Text>
        </View>
        <ArrowUpRight size={18} color="#BCA0FA" />
      </Pressable>
      <Section
        title="Fresh starts. Better prices."
        action="Explore"
        onPress={() => tab("Marketplace")}
      />
      <ResponsiveGrid>
        {data?.listings.slice(0, 3).map((l) => (
          <ListingCard
            key={l.id}
            listing={l}
            onPress={() => navigation.navigate("Listing", { id: l.id })}
          />
        ))}
      </ResponsiveGrid>
      {!!data?.gyms?.length && (
        <>
          <Section
            title="Find your training space"
            action="All gyms"
            onPress={() => tab("Gyms")}
          />
          <ResponsiveGrid>
            {data.gyms.slice(0, 3).map((g) => (
              <GymCard
                key={g.id}
                gym={g}
                onPress={() => navigation.navigate("Gym", { id: g.id })}
              />
            ))}
          </ResponsiveGrid>
        </>
      )}
    </Page>
  );
}
