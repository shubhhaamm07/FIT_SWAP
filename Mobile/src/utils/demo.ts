import type {
  Dashboard,
  Listing,
  Membership,
  Notice,
  User,
} from "../types/domain";
const future = (days: number) =>
  new Date(Date.now() + days * 86400000).toISOString();
export const demoUser: User = {
  id: "preview",
  firstName: "Alex",
  lastName: "Morgan",
  email: "preview@fitswap.test",
  city: "Chandigarh",
  role: "USER",
};
export const gyms: any[] = [
  {
    id: "gym-1",
    name: "The Iron House",
    city: "Chandigarh",
    state: "Punjab",
    address: "Sector 17",
    latitude: 30.741,
    longitude: 76.782,
    status: "APPROVED",
    updatedAt: future(-1),
    description:
      "Find your rhythm with strength training, open gym sessions, and a community that shows up.",
    images: [],
    verificationDocuments: [
      {
        id: "document-1",
        status: "SUBMITTED",
        fileName: "gym-photo-verification.pdf",
        createdAt: future(-1),
        pageCount: 8,
        byteSize: 1048576,
      },
    ],
  },
  {
    id: "gym-2",
    name: "Cult Fitness Studio",
    city: "Mohali",
    state: "Punjab",
    address: "Phase 7",
    latitude: 30.704,
    longitude: 76.718,
    status: "APPROVED",
    description:
      "Space to move. Energy to grow. Discover functional training and guided workouts.",
    images: [],
  },
];
const plans = gyms.map((gym, i) => ({
  id: `plan-${i}`,
  name: i ? "All-access membership" : "Strength + cardio",
  price: i ? 9000 : 12000,
  durationInDays: 180,
  gym: { ...gym },
  transferable: true,
  freezeAllowed: true,
  transferFee: 250,
  allowCashTransfer: true,
  allowOnlinePayment: true,
  requiresGymApproval: true,
  minimumTransferDays: 30,
  maximumTransfers: 2,
}));
gyms.forEach((gym, i) => {
  gym.plans = [plans[i]];
});
export const memberships: Membership[] = [
  {
    id: "member-1",
    status: "ACTIVE",
    startDate: future(-30),
    endDate: future(92),
    plan: plans[0],
  },
];
export const listings: Listing[] = plans.map((plan, i) => ({
  id: `listing-${i}`,
  status: "ACTIVE",
  askingPrice: i ? 4200 : 6500,
  membership: {
    id: `sale-${i}`,
    status: "ACTIVE",
    startDate: future(-30),
    endDate: future(i ? 60 : 120),
    plan,
  },
  seller: { firstName: "FitSwap", lastName: "Seller" },
}));
export const notices: Notice[] = [
  {
    id: "notice-1",
    title: "Welcome to FitSwap",
    message:
      "Your fitness journey, on your terms. Explore gyms and membership deals in one place.",
    isRead: false,
    createdAt: future(0),
  },
];
export const transfers: any[] = [
  {
    id: "transfer-1",
    status: "PENDING",
    listing: listings[0],
    createdAt: future(-1),
    buyer: { firstName: "Morgan", lastName: "Lee" },
  },
];
export const dashboard: Dashboard = {
  stats: {
    memberships: { active: 1 },
    transfers: { pending: 1 },
    notifications: { unread: 1 },
  },
  memberships,
  listings,
  gyms,
};
const workout = {
  id: "workout-1",
  weekday: 1,
  title: "Strength foundations",
  focus: "Full body",
  durationMinutes: 45,
  notes: "Consistency over intensity.",
  completions: [],
};
const meal = {
  id: "meal-1",
  mealType: "LUNCH",
  label: "Lunch at home",
  description: "An entry in your personal meal log.",
  estimatedCalories: 550,
  mealDate: future(0).slice(0, 10),
  isFollowed: false,
};
const slot = {
  id: "slot-1",
  gymId: gyms[0].id,
  gym: gyms[0],
  startAt: future(1),
  endAt: new Date(Date.now() + 90000000).toISOString(),
  capacity: 10,
  bookedCount: 3,
  requiresApproval: true,
  isActive: true,
};
const booking = {
  id: "booking-1",
  status: "CONFIRMED",
  bookingReference: "PREVIEW-TRIAL",
  slot,
  member: demoUser,
};
const payment = {
  id: "payment-1",
  status: "BUYER_MARKED_PAID",
  amount: 420000,
  kind: "MARKETPLACE_TRANSFER",
  paymentRef: "PREVIEW-REFERENCE",
  expiresAt: future(1),
  payeeName: "Preview recipient",
  recipientUpiId: "preview@invalid",
  upiIntent: "",
  utr: "SAMPLE-REFERENCE",
  gym: gyms[0],
  listing: listings[0],
};
const offers = [
  {
    code: "PLUS_MONTHLY",
    kind: "MEMBER_SUBSCRIPTION",
    label: "FitSwap Plus Monthly",
    amount: 19900,
    benefitDays: 30,
  },
  {
    code: "PLUS_YEARLY",
    kind: "MEMBER_SUBSCRIPTION",
    label: "FitSwap Plus Yearly",
    amount: 199900,
    benefitDays: 365,
  },
  {
    code: "OWNER_MONTHLY",
    kind: "OWNER_SUBSCRIPTION",
    label: "FitSwap Business Monthly",
    amount: 49900,
    benefitDays: 30,
  },
];
const ticket = {
  id: "ticket-1",
  subject: "Membership handover question",
  description: "How can I follow the status of my membership handover?",
  category: "TRANSFER",
  priority: "NORMAL",
  status: "OPEN",
  ticketNumber: "PREVIEW-001",
  createdAt: future(-1),
  messages: [
    {
      id: "message-1",
      body: "You can track every stage from Your transfers. We’re here if you need help.",
      sender: { firstName: "FitSwap", lastName: "Support" },
      createdAt: future(0),
      attachments: [],
    },
  ],
  auditLogs: [],
};
const audit = {
  id: "audit-1",
  action: "MEMBERSHIP_TRANSFER_REQUESTED",
  summary: "A new membership handover is awaiting confirmation.",
  createdAt: future(-1),
  metadata: { paymentMethod: "UPI", status: "PENDING" },
};
const revenueTrend = [
  { month: "Aug", label: "Aug", revenue: 24000 },
  { month: "Sep", label: "Sep", revenue: 31000 },
  { month: "Oct", label: "Oct", revenue: 36000 },
];
export function demoData(path: string, role = "USER"): any {
  const [route, query] = path.split("?");
  const params = new URLSearchParams(query || "");
  const wrap = (data: any) => ({ success: true, data });
  if (route === "/auth/me")
    return {
      user: {
        ...demoUser,
        role,
        firstName:
          role === "ADMIN" ? "Admin" : role === "GYM_OWNER" ? "Jordan" : "Alex",
        emailNotifications: true,
        marketplaceNotifications: true,
        membershipExpiryNotifications: true,
        isProfilePublic: false,
        emailVerifiedAt: future(-10),
      },
    };
  if (route === "/dashboard") return wrap(dashboard);
  if (route === "/memberships/my") return wrap(memberships);
  if (route.endsWith("/transfer-eligibility"))
    return wrap({
      eligible: true,
      reasons: [],
      daysRemaining: 92,
      checks: {},
      policy: plans[0],
    });
  if (route.startsWith("/memberships/"))
    return wrap(memberships.find((m) => route.includes(m.id)));
  if (route === "/notifications")
    return { ...wrap(notices), pagination: { total: 1, hasNextPage: false } };
  if (route.startsWith("/transfer-requests/")) return wrap(transfers);
  if (route === "/listings/my") return wrap(listings.slice(0, 1));
  if (route.startsWith("/listings/price-suggestion/"))
    return wrap({
      suggestedPrice: 6200,
      minimumPrice: 5500,
      maximumPrice: 7200,
      confidence: "MEDIUM",
      explanation: "Preview estimate based on remaining membership time.",
    });
  if (route === "/saved-listings") return wrap([{ listing: listings[1] }]);
  if (route.startsWith("/listings/"))
    return wrap(listings.find((l) => route.includes(l.id)));
  if (route === "/listings") {
    const term = (params.get("search") || "").toLowerCase();
    let items = listings.filter((l) =>
      `${l.membership.plan.name} ${l.membership.plan.gym.name} ${l.membership.plan.gym.city}`
        .toLowerCase()
        .includes(term),
    );
    if (params.get("city"))
      items = items.filter((l) =>
        l.membership.plan.gym.city
          .toLowerCase()
          .includes(params.get("city")!.toLowerCase()),
      );
    if (params.get("minPrice"))
      items = items.filter(
        (l) => Number(l.askingPrice) >= Number(params.get("minPrice")),
      );
    if (params.get("maxPrice"))
      items = items.filter(
        (l) => Number(l.askingPrice) <= Number(params.get("maxPrice")),
      );
    if (params.get("sortBy") === "price-low")
      items.sort((a, b) => Number(a.askingPrice) - Number(b.askingPrice));
    return {
      ...wrap(items),
      pagination: { total: items.length, hasNextPage: false },
    };
  }
  if (route === "/gyms/my-gyms") return wrap(gyms);
  if (route.endsWith("/crowd"))
    return wrap({
      level: "LOW",
      reportCount: 8,
      hasFullInsights: true,
      history: {
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
          (label, i) => ({ label, crowdPercent: 20 + i * 8 }),
        ),
        calmestTime: { label: "9 AM–12 PM" },
      },
    });
  if (/\/gyms\/[^/]+\/(my-posts|posts)$/.test(route))
    return wrap([
      {
        id: "post-1",
        kind: "UPDATE",
        title: "A stronger community starts here.",
        body: "Join us for our new weekend training sessions.",
        isPublished: true,
        createdAt: future(-1),
      },
    ]);
  if (route.startsWith("/gyms/"))
    return wrap(gyms.find((g) => route.includes(g.id)));
  if (route === "/gyms") {
    const term = (params.get("search") || "").toLowerCase();
    return {
      ...wrap(
        gyms.filter((g) =>
          `${g.name} ${g.city} ${g.state}`.toLowerCase().includes(term),
        ),
      ),
      pagination: { hasNextPage: false, total: 2 },
    };
  }
  if (route === "/trial-slots" || route === "/gym-owner/trial-slots")
    return wrap([slot]);
  if (route === "/trial-bookings/my" || route === "/gym-owner/trial-bookings")
    return wrap([booking]);
  if (route === "/wellness/workouts")
    return wrap({
      schedules: [workout],
      summary: { plannedWorkouts: 1, completedThisWeek: 0 },
    });
  if (route === "/wellness/meals")
    return wrap({
      meals: [meal],
      summary: { mealsLogged: 1, mealsFollowed: 0 },
    });
  if (route === "/wellness/insights")
    return wrap({
      summary: {
        totalWorkoutCompletions: 12,
        totalWorkoutMinutes: 540,
        mealsLogged: 18,
        mealsFollowed: 15,
        mealAdherencePercent: 83,
        currentWorkoutStreak: 3,
      },
      days: [],
    });
  if (route === "/security/overview")
    return wrap({
      sessions: [
        {
          id: "session-1",
          deviceName: "Preview device",
          isCurrent: true,
          authMethod: "PASSWORD",
          lastSeenAt: future(0),
        },
        {
          id: "session-2",
          deviceName: "Other preview device",
          isCurrent: false,
          authMethod: "PASSWORD",
          lastSeenAt: future(-1),
        },
      ],
      loginHistory: [
        {
          id: "login-1",
          status: "SUCCESS",
          riskLevel: "NONE",
          detail: "Signed in",
          deviceName: "Preview device",
          createdAt: future(0),
        },
      ],
      passwordChanges: [],
    });
  if (route === "/platform-billing/mine")
    return wrap({
      offers,
      payments: [],
      entitlements: { isFitSwapPlus: true, freeMonthlyBoostAvailable: true },
    });
  if (route === "/upi-payments/mine")
    return wrap({ outgoing: [payment], incoming: [payment] });
  if (route === "/upi-payments/gym-approvals")
    return wrap([{ ...payment, status: "AWAITING_GYM_APPROVAL" }]);
  if (route === "/support/tickets") return wrap([ticket]);
  if (route.startsWith("/support/tickets/")) return wrap(ticket);
  if (route === "/gym-owner/dashboard")
    return wrap({
      overview: {
        totalRevenue: 91000,
        activeMembers: 42,
        membershipSales: 56,
        monthlyGrowth: 16.1,
        pendingTransferCount: 1,
      },
      revenueTrend,
      recentSales: [
        {
          id: "sale-1",
          plan: plans[0],
          user: demoUser,
          price: 12000,
          status: "ACTIVE",
        },
      ],
    });
  if (route === "/gym-owner/members")
    return wrap([{ ...memberships[0], user: demoUser }]);
  if (route === "/gym-owner/sales")
    return wrap({
      overview: { revenue: 91000, sales: 56 },
      revenueTrend,
      sales: [{ id: "sale-1", user: demoUser, plan: plans[0], price: 12000 }],
    });
  if (route === "/gym-owner/transfers") return wrap(transfers);
  if (route.endsWith("transfer-audit-logs") || route.endsWith("audit-logs"))
    return wrap([audit]);
  if (route.endsWith("fraud-alerts")) return wrap([]);
  if (route === "/admin/dashboard")
    return wrap({
      overview: {
        totalUsers: 1284,
        totalGymOwners: 42,
        approvedGyms: 38,
        pendingGyms: 2,
        activeListings: 86,
        platformRevenue: 58000,
      },
      recentGyms: gyms,
      recentListings: listings,
    });
  if (route === "/admin/analytics")
    return wrap({
      overview: {
        registeredUsers: 1284,
        activeUsers: 618,
        newRegistrations: 96,
        platformRevenue: 91000,
        membershipSales: 56,
        listingConversion: 68,
      },
      revenueTrend,
      topGyms: gyms.map((g, i) => ({
        id: g.id,
        name: g.name,
        revenue: 36000 - i * 8000,
        sales: 12 - i * 3,
      })),
      topPlans: [],
    });
  if (route === "/admin/pending-gyms")
    return wrap([
      {
        ...gyms[0],
        status: "PENDING",
        owner: {
          firstName: "Jordan",
          lastName: "Lee",
          email: "owner@fitswap.test",
        },
      },
    ]);
  if (route === "/admin/users" || route === "/admin/announcement-recipients")
    return wrap([
      { ...demoUser, isActive: true },
      {
        id: "owner-preview",
        firstName: "Jordan",
        lastName: "Lee",
        email: "owner@fitswap.test",
        role: "GYM_OWNER",
        isActive: true,
      },
    ]);
  if (route === "/admin/listings") return wrap(listings);
  if (route === "/admin/payments")
    return wrap([
      {
        ...payment,
        id: "platform-payment-1",
        sourcePaymentId: "payment-1",
        provider: "PLATFORM_UPI",
        type: "MEMBER_SUBSCRIPTION",
      },
    ]);
  if (route === "/admin/announcements")
    return wrap([
      {
        id: "announcement-1",
        title: "Welcome to a more flexible fitness journey",
        message: "Explore gyms, find memberships, and keep moving.",
        audience: "ALL_USERS",
        recipientCount: 1284,
        createdAt: future(-1),
      },
    ]);
  if (route === "/admin/security-overview")
    return wrap({
      suspendedAccounts: [],
      failedPayments: [],
      pendingTransfers: transfers,
      recentAdminActions: [audit],
    });
  return wrap([]);
}
