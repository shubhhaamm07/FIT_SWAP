import {
    LayoutDashboard,
    CreditCard,
    Store,
    Dumbbell,
    UserRound,
    Apple,
    Users,
    Bot,
    Trophy,
    Crown,
} from "lucide-react";

export const sidebarSections = [
    {
        title: "Dashboard",

        items: [
            {
                label: "Overview",
                to: "/dashboard",
                icon: LayoutDashboard,
            },
        ],
    },

    {
        title: "Marketplace",

        items: [
            {
                label: "Memberships",
                to: "/dashboard/memberships",
                icon: CreditCard,
            },

            {
                label: "Marketplace",
                to: "/dashboard/marketplace",
                icon: Store,
            },

            {
                label: "Gyms",
                to: "/dashboard/gyms",
                icon: Dumbbell,
            },
        ],
    },

    {
        title: "Fitness",

        items: [
            {
                label: "Trainers",
                to: "/dashboard/trainers",
                icon: UserRound,
            },

            {
                label: "Nutrition",
                to: "/dashboard/nutrition",
                icon: Apple,
            },

            {
                label: "Community",
                to: "/dashboard/community",
                icon: Users,
            },

            {
                label: "AI Coach",
                to: "/dashboard/ai-coach",
                icon: Bot,
            },

            {
                label: "Challenges",
                to: "/dashboard/challenges",
                icon: Trophy,
            },

            {
                label: "Subscription",
                to: "/dashboard/subscription",
                icon: Crown,
            },
        ],
    },
];