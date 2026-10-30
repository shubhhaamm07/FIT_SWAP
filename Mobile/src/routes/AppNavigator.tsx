import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  useNavigation,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Building2, Home, Store, Ticket, UserRound } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { Empty, Page } from "../components/ui";
import FloatingTabBar from "../components/navigation/FloatingTabBar";
import { typeface } from "../constants/design";
import { useAppearance } from "../contexts/AppearanceContext";
import { useAuth } from "../contexts/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import AdminPortalPage from "../pages/admin/AdminPortalPage";
import AdminMfaPage from "../pages/auth/AdminMfaPage";
import AuthPage from "../pages/auth/AuthPage";
import FitSwapPlusPage from "../pages/billing/FitSwapPlusPage";
import PaymentPage from "../pages/billing/PaymentPage";
import PaymentsPage from "../pages/billing/PaymentsPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import DietPlannerPage from "../pages/diet/DietPlannerPage";
import GymOwnerOperationsPage from "../pages/gym-owner/GymOwnerOperationsPage";
import OwnerGymPage from "../pages/gym-owner/OwnerGymPage";
import { GymScreen } from "../pages/gyms/GymDetailsPage";
import { GymsScreen } from "../pages/gyms/GymsPage";
import NearbyGymsPage from "../pages/gyms/NearbyGymsPage";
import { ListingScreen } from "../pages/marketplace/ListingDetailsPage";
import { MarketplaceScreen } from "../pages/marketplace/MarketplacePage";
import { MyListingsScreen } from "../pages/marketplace/MyListingsPage";
import { SellScreen } from "../pages/marketplace/SellMembershipPage";
import { SavedScreen } from "../pages/marketplace/WishlistPage";
import { MembershipScreen } from "../pages/memberships/MembershipDetailsPage";
import { MembershipsScreen } from "../pages/memberships/MembershipsPage";
import { NotificationsScreen } from "../pages/notifications/NotificationsPage";
import { EditProfileScreen } from "../pages/profile/EditProfilePage";
import { ProfileScreen } from "../pages/profile/ProfilePage";
import SecurityCentrePage from "../pages/security/SecurityCentrePage";
import SettingsPage from "../pages/settings/SettingsPage";
import SupportTicketPage from "../pages/support/SupportTicketPage";
import SupportTicketsPage from "../pages/support/SupportTicketsPage";
import { TransfersScreen } from "../pages/transfers/TransferRequestsPage";
import TrialBookingPage from "../pages/trials/TrialBookingPage";
import WellnessPage from "../pages/wellness/WellnessPage";
import { canAccess } from "./role-policy.cjs";
import type { RootStack } from "./types";
const Stack = createNativeStackNavigator<RootStack>();
const Tabs = createBottomTabNavigator();
function OperationsTab({
  section,
  admin = false,
}: {
  section: string;
  admin?: boolean;
}) {
  const navigation = useNavigation();
  return admin ? (
    <AdminPortalPage
      route={{ params: { section } } as any}
      navigation={navigation as any}
    />
  ) : (
    <GymOwnerOperationsPage
      route={{ params: { section } } as any}
      navigation={navigation as any}
    />
  );
}
function MainTabs() {
  const { user } = useAuth();
  const { tablet } = useResponsive();
  const { dark } = useAppearance();
  const owner = user?.role === "GYM_OWNER";
  const admin = user?.role === "ADMIN";
  const screens = React.useMemo(
    () => [
      {
        name: "Home",
        title: "Home",
        icon: Home,
        component: admin
          ? () => <OperationsTab section="dashboard" admin />
          : owner
            ? () => <OperationsTab section="dashboard" />
            : DashboardPage,
      },
      {
        name: "Marketplace",
        title: admin ? "Listings" : owner ? "Plans" : "Marketplace",
        icon: Store,
        component: admin
          ? () => <OperationsTab section="listings" admin />
          : owner
            ? () => <OperationsTab section="plans" />
            : MarketplaceScreen,
      },
      {
        name: "Gyms",
        title: "Gyms",
        icon: Building2,
        component: admin
          ? () => <OperationsTab section="gyms" admin />
          : owner
            ? () => <OperationsTab section="gyms" />
            : GymsScreen,
      },
      {
        name: "Memberships",
        title: admin ? "People" : owner ? "Approvals" : "Memberships",
        icon: Ticket,
        component: admin
          ? () => <OperationsTab section="users" admin />
          : owner
            ? () => <OperationsTab section="transfers" />
            : MembershipsScreen,
      },
      {
        name: "Profile",
        title: "Your space",
        icon: UserRound,
        component: ProfileScreen,
      },
    ],
    [admin, owner],
  );
  return (
    <Tabs.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: tablet ? "left" : "bottom",
        tabBarActiveTintColor: dark ? "#C4B5FD" : "#6D28D9",
        tabBarInactiveTintColor: "#71717A",
        tabBarStyle: {
          backgroundColor: dark ? "#111116" : "#fff",
          borderTopColor: dark ? "#292932" : "#D6D9E5",
          paddingTop: 8,
          ...(tablet ? { width: 180 } : {}),
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: typeface.bold },
      }}
    >
      {screens.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <tab.icon color={color} size={size - 2} />
            ),
          }}
        />
      ))}
    </Tabs.Navigator>
  );
}
const pages = {
  Listing: ListingScreen,
  Gym: GymScreen,
  Membership: MembershipScreen,
  Sell: SellScreen,
  Notifications: NotificationsScreen,
  Saved: SavedScreen,
  Transfers: TransfersScreen,
  MyListings: MyListingsScreen,
  EditProfile: EditProfileScreen,
  Nearby: NearbyGymsPage,
  Trials: TrialBookingPage,
  Wellness: WellnessPage,
  Diet: DietPlannerPage,
  Settings: SettingsPage,
  Security: SecurityCentrePage,
  Plus: FitSwapPlusPage,
  Payment: PaymentPage,
  Payments: PaymentsPage,
  Support: SupportTicketsPage,
  SupportTicket: SupportTicketPage,
  Owner: GymOwnerOperationsPage,
  OwnerGym: OwnerGymPage,
  Admin: AdminPortalPage,
};
function Root() {
  const { user, loading, challenge } = useAuth();
  const { reducedMotion } = useAppearance();
  if (loading)
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  if (challenge) return <AdminMfaPage />;
  if (!user) return <AuthPage />;
  return (
    <Stack.Navigator
      key={`${user.id}:${user.role}`}
      screenOptions={{
        headerShown: false,
        animation: reducedMotion ? "none" : "default",
        contentStyle: { backgroundColor: "transparent" },
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      {Object.entries(pages).map(([name, Component]) => (
        <Stack.Screen key={name} name={name as keyof RootStack}>
          {(props) =>
            canAccess(user.role, name) ? (
              React.createElement(Component as React.ComponentType<any>, props)
            ) : (
              <Page>
                <Empty title="This page is not available for your role" />
              </Page>
            )
          }
        </Stack.Screen>
      ))}
    </Stack.Navigator>
  );
}
export default function AppNavigator() {
  const { dark } = useAppearance();
  const theme = dark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer
      documentTitle={{
        formatter: (options, route) =>
          `${options?.title || route?.name || "FitSwap"} · FitSwap`,
      }}
      theme={{
        ...theme,
        colors: {
          ...theme.colors,
          primary: "#8B5CF6",
          background: dark ? "#0A0B10" : "#F5F6FB",
          card: dark ? "#14161F" : "#fff",
        },
      }}
    >
      <Root />
    </NavigationContainer>
  );
}
