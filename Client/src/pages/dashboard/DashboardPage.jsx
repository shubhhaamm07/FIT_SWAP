import DashboardLayout from "../../layouts/DashboardLayout";

import DashboardHero from "../../components/dashboard/hero/DashboardHero";
import DashboardStats from "../../components/dashboard/stats/DashboardStats";
// import DashboardCharts from "../../components/dashboard/charts/DashboardCharts";

// import MembershipSection from "../../components/dashboard/memberships/MembershipSection";
// import MarketplaceSection from "../../components/dashboard/marketplace/MarketplaceSection";
// import GymSection from "../../components/dashboard/gyms/GymSection";

import NotificationPanel from "../../components/dashboard/right-sidebar/NotificationPanel";
import RecentActivity from "../../components/dashboard/right-sidebar/RecentActivity";
import QuickActions from "../../components/dashboard/right-sidebar/QuickActions";
import MemberMomentum from "../../components/dashboard/insights/MemberMomentum";

import { useDashboard } from "../../hooks/useDashboard";

function DashboardPage() {
  const {
    stats,

    notifications,

    activities,

    memberships,

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
      <DashboardHero />

      <div className="mt-6">
        <DashboardStats stats={stats} loading={loading} />
      </div>

      <MemberMomentum memberships={memberships} />

      {/* <DashboardCharts charts={charts} loading={loading} /> */}

      {/* <MembershipSection memberships={memberships} loading={loading} /> */}

      {/* <MarketplaceSection listings={listings} loading={loading} /> */}

      {/* <GymSection gyms={gyms} loading={loading} /> */}
    </DashboardLayout>
  );
}

export default DashboardPage;
