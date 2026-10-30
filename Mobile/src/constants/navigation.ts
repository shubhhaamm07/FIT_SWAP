export type FeatureLink = {
  title: string;
  description: string;
  route: string;
  params?: Record<string, string>;
  roles?: string[];
};
export const featureLinks: FeatureLink[] = [
  {
    title: "Nearby gyms",
    description: "Map, distance, and directions",
    route: "Nearby",
  },
  {
    title: "Book a trial",
    description: "Find a time and meet your next gym",
    route: "Trials",
    roles: ["USER"],
  },
  {
    title: "Saved memberships",
    description: "Your next possibilities",
    route: "Saved",
    roles: ["USER"],
  },
  {
    title: "My listings",
    description: "Manage, renew, price, and boost",
    route: "MyListings",
    roles: ["USER"],
  },
  {
    title: "Transfer requests",
    description: "Buying, selling, and handovers",
    route: "Transfers",
    roles: ["USER"],
  },
  {
    title: "Payments",
    description: "Checkout, receipts, and verification",
    route: "Payments",
  },
  {
    title: "Workout & meal log",
    description: "Build a consistent routine",
    route: "Wellness",
    roles: ["USER"],
  },
  {
    title: "AI diet planner",
    description: "A weekly plan that fits your life",
    route: "Diet",
    roles: ["USER"],
  },
  {
    title: "FitSwap Plus",
    description: "More flexibility and member benefits",
    route: "Plus",
    roles: ["USER"],
  },
  {
    title: "Business subscription",
    description: "Your business plan and billing",
    route: "Plus",
    roles: ["GYM_OWNER"],
  },
  ...[
    "dashboard",
    "gyms",
    "plans",
    "members",
    "sales",
    "transfers",
    "trials",
    "audit",
    "risk",
  ].map((section) => ({
    title: (
      {
        dashboard: "Business dashboard",
        gyms: "Manage gyms",
        plans: "Plans & transfer policies",
        members: "Member directory",
        sales: "Sales & revenue",
        transfers: "Gym handover approvals",
        trials: "Trial management",
        audit: "Gym transfer audit",
        risk: "Gym risk alerts",
      } as Record<string, string>
    )[section],
    description: "FitSwap Business",
    route: "Owner",
    params: { section },
    roles: ["GYM_OWNER"],
  })),
  ...[
    "dashboard",
    "gyms",
    "users",
    "listings",
    "payments",
    "analytics",
    "announcements",
    "audit-logs",
    "transfer-audit",
    "fraud-alerts",
    "security",
  ].map((section) => ({
    title: (
      {
        dashboard: "Admin dashboard",
        gyms: "Gym verification",
        users: "Users & access",
        listings: "Listing moderation",
        payments: "Payment oversight",
        analytics: "Platform analytics",
        announcements: "Announcements",
        "audit-logs": "Admin audit logs",
        "transfer-audit": "Transfer audit",
        "fraud-alerts": "Fraud alerts",
        security: "Platform security",
      } as Record<string, string>
    )[section],
    description: "Administration",
    route: "Admin",
    params: { section },
    roles: ["ADMIN"],
  })),
  {
    title: "Notifications",
    description: "Your latest updates",
    route: "Notifications",
  },
  {
    title: "Edit profile",
    description: "Your details, photos, and privacy",
    route: "EditProfile",
  },
  {
    title: "Appearance & settings",
    description: "Theme, accessibility, UPI, and account",
    route: "Settings",
  },
  {
    title: "Security centre",
    description: "Devices, sign-ins, and protection",
    route: "Security",
  },
  {
    title: "Help & support",
    description: "Conversations and solutions",
    route: "Support",
  },
];
