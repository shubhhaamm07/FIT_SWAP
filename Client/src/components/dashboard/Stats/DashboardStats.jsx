import { CreditCard, Store, ArrowRightLeft, Bell } from "lucide-react";

import StatCard from "./StatCard";
import SkeletonCard from "./StatCardSkeleton";

function DashboardStats({
  memberships = [],
  listings = [],
  notifications = [],
  transferRequests = [],
  loading = false,
}) {
  if (loading) {
    return (
      <section
        className="

    grid

    grid-cols-1

    sm:grid-cols-2

    xl:grid-cols-4

    gap-5

  "
      >
        {[1, 2, 3, 4].map((item) => (
          <SkeletonCard key={item} />
        ))}
      </section>
    );
  }

  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  return (
    <section className="flex gap-5 mt-6">
      <div className="w-[220px]">
        <StatCard
          title="Active Memberships"
          value={memberships.length}
          subtitle="Currently Active"
          icon={CreditCard}
          color="text-violet-400"
        />
      </div>

      <div className="w-[220px]">
        <StatCard
          title="Marketplace Listings"
          value={listings.length}
          subtitle="Available Listings"
          icon={Store}
          color="text-green-400"
        />
      </div>

      <div className="w-[220px]">
        <StatCard
          title="Transfer Requests"
          value={transferRequests.length}
          subtitle="Pending Requests"
          icon={ArrowRightLeft}
          color="text-blue-400"
        />
      </div>

      <div className="w-[220px]">
        <StatCard
          title="Notifications"
          value={unreadNotifications}
          subtitle="Unread Messages"
          icon={Bell}
          color="text-yellow-400"
        />
      </div>
    </section>
  );
}

export default DashboardStats;
