import { Bell, CreditCard, ArrowRightLeft } from "lucide-react";

const icons = {
  membership: CreditCard,
  transfer: ArrowRightLeft,
  notification: Bell,
};

function RecentActivity({ activities = [] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12121A] p-5">
      <h2 className="text-lg font-semibold mb-5">Recent Activity</h2>

      {activities.length === 0 ? (
        <div className="py-10 text-center text-sm text-zinc-500">
          No recent activity.
        </div>
      ) : (
        <div className="space-y-4 max-h-[320px] overflow-y-auto">
          {activities.slice(0, 8).map((activity) => {
            const Icon = icons[activity.type];

            return (
              <div
                key={`${activity.type}-${activity.id}`}
                className="flex gap-3"
              >
                <div
                  className="
                      w-9
                      h-9
                      rounded-xl
                      bg-violet-500/10
                      flex
                      items-center
                      justify-center
                    "
                >
                  <Icon size={17} className="text-violet-400" />
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>

                  <p className="text-xs text-zinc-500 mt-1">
                    {activity.description}
                  </p>

                  <p className="text-[11px] text-zinc-600 mt-1">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default RecentActivity;
