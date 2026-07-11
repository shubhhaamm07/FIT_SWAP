import { CreditCard, Store, ArrowRightLeft, Bell } from "lucide-react";

import StatCard from "./StatCard";
import SkeletonCard from "./StatCardSkeleton";

function DashboardStats({ stats = {}, loading = false }) {
  if (loading) {
    return (
      <section className="grid grid-cols-[repeat(4,220px)] gap-5">
        {[1, 2, 3, 4].map((item) => (
          <SkeletonCard key={item} />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-[repeat(4,220px)] gap-5">
      <StatCard
        title="Active Memberships"
        value={stats.memberships?.active ?? 0}
        subtitle={`${stats.memberships?.total ?? 0} Total`}
        icon={CreditCard}
        color="text-violet-400"
      />

      <StatCard
        title="Marketplace"
        value={stats.marketplace?.total ?? 0}
        subtitle="Active Listings"
        icon={Store}
        color="text-green-400"
      />

      <StatCard
        title="Transfers"
        value={stats.transfers?.pending ?? 0}
        subtitle={`${stats.transfers?.total ?? 0} Total`}
        icon={ArrowRightLeft}
        color="text-blue-400"
      />

      <StatCard
        title="Notifications"
        value={stats.notifications?.unread ?? 0}
        subtitle={`${stats.notifications?.total ?? 0} Total`}
        icon={Bell}
        color="text-yellow-400"
      />
    </section>
  );
}

export default DashboardStats;
