import DashboardLayout from "../../layouts/DashboardLayout";

import DashboardHero from "../../components/dashboard/Hero/DashboardHero";
import DashboardStats from "../../components/dashboard/Stats/DashboardStats";
// import DashboardCharts from "../../components/dashboard/Charts/DashboardCharts";

import MembershipSection from "../../components/dashboard/Memberships/MembershipSection";
// import MarketplaceSection from "../../components/dashboard/Marketplace/MarketplaceSection";
// import GymSection from "../../components/dashboard/Gyms/GymSection";

import QuickActions from "../../components/dashboard/RightSidebar/QuickActions";
import NotificationPanel from "../../components/dashboard/RightSidebar/NotificationPanel";
import RecentActivity from "../../components/dashboard/RightSidebar/RecentActivity";

import { useDashboard } from "../../hooks/useDashboard";

function DashboardPage() {
  const {
    stats,

    memberships,

    listings,

    gyms,

    notifications,

    transferRequests,

    activities,

    charts,

    loading,

    error,
  } = useDashboard();

  if (error) {
    return (
      <div
        className="
          flex
          min-h-screen
          items-center
          justify-center
          bg-[#09090B]
          text-lg
          text-red-500
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
      <DashboardHero stats={stats} />

      <div className="mt-6">
        <DashboardStats stats={stats} loading={loading} />
      </div>

      {/* <DashboardCharts charts={charts} loading={loading} /> */}

      <MembershipSection memberships={memberships} loading={loading} />

      {/* <MarketplaceSection listings={listings} loading={loading} /> */}

      {/* <GymSection gyms={gyms} loading={loading} /> */}
    </DashboardLayout>
  );
}

export default DashboardPage;
