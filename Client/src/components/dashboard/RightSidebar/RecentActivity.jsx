import { Activity, ArrowRightLeft, Bell, CreditCard } from "lucide-react";

function RecentActivity({ activities = [] }) {
  const getIcon = (type) => {
    switch (type) {
      case "membership":
        return CreditCard;

      case "transfer":
        return ArrowRightLeft;

      case "notification":
        return Bell;

      default:
        return Activity;
    }
  };

  return (
    <section className="mt-5 rounded-3xl border border-white/10 bg-[#12121A] p-5">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Recent Activity</h2>

          <p className="mt-1 text-sm text-zinc-500">
            Latest updates on your account
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="py-8 text-center">
          <Activity size={34} className="mx-auto text-zinc-600" />

          <p className="mt-3 text-sm text-zinc-500">No recent activity.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.slice(0, 6).map((activity) => {
            const Icon = getIcon(activity.type);

            return (
              <div
                key={activity.id}
                className="
                    group
                    flex
                    items-start
                    gap-3
                    rounded-2xl
                    border
                    border-white/5
                    bg-white/[0.03]
                    p-3
                    transition-all
                    duration-300
                    hover:border-violet-500/20
                    hover:bg-white/[0.05]
                  "
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                  <Icon size={18} className="text-violet-400" />
                </div>

                <div className="flex-1">
                  <h4 className="text-sm font-medium">{activity.title}</h4>

                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {activity.description}
                  </p>

                  <p className="mt-2 text-[11px] text-zinc-600">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default RecentActivity;
