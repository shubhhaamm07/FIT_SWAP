import { CalendarDays, CircleCheckBig, Snowflake, Clock3 } from "lucide-react";

import { formatDate, formatCurrency } from "../utils/membershipHelpers";

function MembershipHistory({ membership }) {
  const activities = [
    {
      id: 1,
      title: "Membership Purchased",
      value: formatDate(membership.createdAt),
      icon: CalendarDays,
    },
    {
      id: 2,
      title: "Membership Started",
      value: formatDate(membership.startDate),
      icon: CircleCheckBig,
    },
    {
      id: 3,
      title: "Membership Ends",
      value: formatDate(membership.endDate),
      icon: Clock3,
    },
    {
      id: 4,
      title: "Current Status",
      value: membership.status,
      icon: Snowflake,
    },
    {
      id: 5,
      title: "Plan Price",
      value: formatCurrency(membership.plan.price),
      icon: CircleCheckBig,
    },
  ];

  return (
    <div
      className="
        rounded-2xl
        border
        border-white/10
        bg-[#10111a]
        p-5
        sm:p-6
      "
    >
      <h2 className="text-xl font-bold">Membership Information</h2>

      <div className="mt-6 space-y-5">
        {activities.map(({ id, icon: Icon, title, value }) => (
          <div
            key={id}
            className="
                flex
                items-center
                gap-4
              "
          >
            <div
              className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-500/10
                "
            >
              <Icon size={18} className="text-violet-400" />
            </div>

            <div className="flex-1">
              <p className="text-sm text-zinc-500">{title}</p>

              <h3 className="font-medium">{value}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MembershipHistory;
