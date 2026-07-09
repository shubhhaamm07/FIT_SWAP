import DashboardLayout from "../../layouts/DashboardLayout";

import DashboardHero from "../../components/dashboard/Hero/DashboardHero";

import DashboardStats from "../../components/dashboard/Stats/DashboardStats";

import MembershipSection from "../../components/dashboard/Memberships/MembershipSection";

import MarketplaceSection from "../../components/dashboard/Marketplace/MarketplaceSection";

import GymSection from "../../components/dashboard/Gyms/GymSection";

import QuickActions from "../../components/dashboard/RightSidebar/QuickActions";

import NotificationPanel from "../../components/dashboard/RightSidebar/NotificationPanel";

import RecentActivity from "../../components/dashboard/RightSidebar/RecentActivity";

import { useDashboard } from "../../hooks/useDashboard";

function DashboardPage() {
  const {
    memberships,
    listings,
    gyms,
    notifications,
    transferRequests,
    activities,

    loading,
    error,
  } = useDashboard();

  if (error) {
    return (
      <div
        className="
          min-h-screen
          bg-[#09090B]
          flex
          items-center
          justify-center
          text-red-500
          text-lg
        "
      >
        {error}
      </div>
    );
  }

  return (
    <DashboardLayout
      rightSidebar={
        <>
          <QuickActions />

          <NotificationPanel notifications={notifications} />

          <RecentActivity activities={activities} />
        </>
      }
    >
      <DashboardHero />

      <DashboardStats
        memberships={memberships}
        listings={listings}
        notifications={notifications}
        transferRequests={transferRequests}
        loading={loading}
      />

      <MembershipSection memberships={memberships} loading={loading} />

      {/* <MarketplaceSection listings={listings} loading={loading} /> */}

      {/* <GymSection gyms={gyms} loading={loading} /> */}
    </DashboardLayout>
  );
}

export default DashboardPage;
