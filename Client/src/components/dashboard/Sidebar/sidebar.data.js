import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Store,
    ArrowRightLeft,
    Bell,
    UserRound,
    Settings,
    Sparkles,
} from "lucide-react";

export const sidebarSections = [
    {
        title: "Dashboard",
        items: [
            {
                label: "Dashboard",
                to: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "Gyms",
        items: [{ label: "Gyms", to: "/gyms", icon: Building2 }],
    },

    {
        title: "Memberships",
        items: [
            {
                label: "Memberships",
                to: "/memberships",
                icon: CreditCard,
            },
        ],
    },

    {
        title: "Marketplace",
        items: [
            {
                label: "Marketplace",
                to: "/marketplace",
                icon: Store,
            },
        ],
    },

    {
        title: "Transfers",
        items: [
            {
                label: "Transfer Requests",
                to: "/transfers",
                icon: ArrowRightLeft,
            },
        ],
    },

    {
        title: "Wellness",
        items: [
            {
                label: "AI Diet Planner",
                to: "/diet-planner",
                icon: Sparkles,
            },
        ],
    },

    {
        title: "Account",
        items: [
            {
                label: "Notifications",
                to: "/notifications",
                icon: Bell,
            },
            {
                label: "Profile",
                to: "/profile",
                icon: UserRound,
            },
            {
                label: "Settings",
                to: "/settings",
                icon: Settings,
            },
        ],
    },
];
