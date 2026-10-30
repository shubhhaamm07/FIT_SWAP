import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
export type MainTabs = {
  Home: undefined;
  Marketplace: undefined;
  Gyms: undefined;
  Memberships: undefined;
  Profile: undefined;
};
export type RootStack = {
  Main: NavigatorScreenParams<MainTabs> | undefined;
  Listing: { id: string };
  Gym: { id: string };
  Membership: { id: string };
  Sell: { membershipId: string };
  Notifications: undefined;
  Saved: undefined;
  Transfers: undefined;
  MyListings: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Security: undefined;
  Trials: undefined;
  Nearby: undefined;
  Wellness: undefined;
  Diet: undefined;
  Plus: undefined;
  Support: undefined;
  SupportTicket: { id: string };
  Payment: { payment: Record<string, any>; platform?: boolean };
  Payments: undefined;
  Owner: { section: string };
  OwnerGym: { gymId: string };
  Admin: { section: string };
};
export type ScreenProps<K extends keyof RootStack> = NativeStackScreenProps<
  RootStack,
  K
>;
