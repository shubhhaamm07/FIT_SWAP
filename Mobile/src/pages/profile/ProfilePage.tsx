import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  CalendarDays,
  Heart,
  Repeat2,
  CreditCard,
  Dumbbell,
  Sparkles,
  Bell,
  UserRound,
  Settings2,
  ShieldCheck,
  LifeBuoy,
  Store,
  Building2,
  LayoutDashboard,
  Users,
  BarChart3,
  Megaphone,
  FileCheck2,
  ShieldAlert,
  LogOut,
} from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Button, Header, Page, Section } from "../../components/ui";
import { ResponsiveGrid } from "../../components/ui/ResponsiveGrid";
import { featureLinks, type FeatureLink } from "../../constants/navigation";
import { typeface, lime } from "../../constants/design";
import { useAuth } from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useAction } from "../../hooks/useApi";
import type { RootStack } from "../../routes/types";
const icons: Record<string, typeof MapPin> = {
  Nearby: MapPin,
  Trials: CalendarDays,
  Saved: Heart,
  MyListings: Store,
  Transfers: Repeat2,
  Payments: CreditCard,
  Wellness: Dumbbell,
  Diet: Sparkles,
  Plus: Sparkles,
  Notifications: Bell,
  EditProfile: UserRound,
  Settings: Settings2,
  Security: ShieldCheck,
  Support: LifeBuoy,
  dashboard: LayoutDashboard,
  gyms: Building2,
  plans: Store,
  members: Users,
  sales: BarChart3,
  transfers: Repeat2,
  trials: CalendarDays,
  audit: FileCheck2,
  risk: ShieldAlert,
  users: Users,
  listings: Store,
  payments: CreditCard,
  analytics: BarChart3,
  announcements: Megaphone,
  "audit-logs": FileCheck2,
  "transfer-audit": FileCheck2,
  "fraud-alerts": ShieldAlert,
  security: ShieldCheck,
};
export function ProfileScreen() {
  const { user, demo, signOut } = useAuth();
  const { confirm } = useFeedback();
  const { busy, run } = useAction();
  const navigation = useNavigation<NavigationProp<RootStack>>();
  const links = featureLinks.filter(
    (l) => !l.roles || l.roles.includes(user?.role || ""),
  );
  const groups = [
    {
      title: "Your fitness life",
      routes: [
        "Nearby",
        "Trials",
        "Saved",
        "MyListings",
        "Transfers",
        "Payments",
        "Wellness",
        "Diet",
      ],
    },
    {
      title: user?.role === "ADMIN" ? "Platform management" : "Your business",
      routes: ["Owner", "Admin"],
    },
    {
      title: "Account & support",
      routes: [
        "Notifications",
        "EditProfile",
        "Settings",
        "Security",
        "Support",
      ],
    },
  ];
  const open = (link: FeatureLink) =>
    (navigation as any).navigate(link.route, link.params);
  return (
    <Page>
      <Header
        title="Your space"
        subtitle="A little more you. A lot more possibility."
      />
      <LinearGradient
        colors={["#34234F", "#1D1E2C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 28,
          borderWidth: 1,
          borderColor: "#624A7C",
          padding: 24,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 23,
              backgroundColor: "#CFB6FF",
              alignItems: "center",
              justifyContent: "center",
              transform: [{ rotate: "-5deg" }],
            }}
          >
            <Text
              style={{
                fontFamily: typeface.display,
                fontSize: 23,
                color: "#352447",
              }}
            >
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: typeface.display,
                fontSize: 22,
                letterSpacing: -0.6,
                color: "#fff",
              }}
            >
              {user?.firstName} {user?.lastName}
            </Text>
            <Text
              style={{
                fontFamily: typeface.medium,
                fontSize: 11,
                color: "#BDB3CD",
                marginTop: 5,
              }}
            >
              {user?.email}
            </Text>
            <Text
              style={{
                fontFamily: typeface.bold,
                color: lime,
                fontSize: 9,
                letterSpacing: 1.5,
                marginTop: 9,
              }}
            >
              {demo ? "PREVIEW · " : ""}
              {user?.role === "GYM_OWNER"
                ? "FITSWAP BUSINESS"
                : user?.role === "ADMIN"
                  ? "ADMINISTRATOR"
                  : "FITSWAP MEMBER"}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => navigation.navigate("EditProfile")}
          style={{
            borderTopWidth: 1,
            borderTopColor: "#FFFFFF18",
            marginTop: 22,
            paddingTop: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#DFD5F0",
              fontFamily: typeface.bold,
              fontSize: 12,
            }}
          >
            Make this space yours
          </Text>
          <ArrowUpRight size={18} color="#DFD5F0" />
        </Pressable>
      </LinearGradient>
      {links
        .filter((l) => l.route === "Plus")
        .map((l) => (
          <Pressable
            key={l.title}
            accessibilityRole="button"
            onPress={() => open(l)}
            className="mt-4 flex-row items-center gap-3 rounded-2xl border border-lime/20 bg-lime/10 p-4"
          >
            <Sparkles size={22} color={lime} />
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">{l.title}</Text>
              <Text className="mt-1 text-[11px] font-medium text-muted">
                {l.description}
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA185" />
          </Pressable>
        ))}
      {groups.map((group) => {
        const entries = links.filter((l) => group.routes.includes(l.route));
        if (!entries.length) return null;
        return (
          <View key={group.title}>
            <Section title={group.title} />
            <ResponsiveGrid maxColumns={2}>
              {entries.map((link) => {
                const Icon =
                  icons[link.params?.section || link.route] || LayoutDashboard;
                return (
                  <Pressable
                    key={link.title}
                    accessibilityRole="button"
                    onPress={() => open(link)}
                    className="mb-2 flex-row items-center gap-3 rounded-2xl border border-line bg-panel px-4 py-4"
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-400/10">
                      <Icon size={19} color="#BCA5ED" strokeWidth={1.7} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-white">
                        {link.title}
                      </Text>
                      <Text className="mt-1 text-[10px] font-medium leading-4 text-muted">
                        {link.description}
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#77768B" />
                  </Pressable>
                );
              })}
            </ResponsiveGrid>
          </View>
        );
      })}
      <View className="mt-6">
        <Button
          title={demo ? "Exit preview & sign in" : "Sign out"}
          secondary
          busy={busy}
          onPress={() =>
            run(async () => {
              if (
                demo ||
                (await confirm(
                  "Sign out?",
                  "Your memberships and settings will be here when you return.",
                  "Sign out",
                ))
              )
                await signOut();
            })
          }
        />
      </View>
      <View className="mt-7 flex-row items-center justify-center gap-2">
        <LogOut size={12} color="#77768B" />
        <Text className="text-center text-[10px] font-medium text-muted">
          FITSWAP · BUILT TO MOVE WITH YOU
        </Text>
      </View>
    </Page>
  );
}
