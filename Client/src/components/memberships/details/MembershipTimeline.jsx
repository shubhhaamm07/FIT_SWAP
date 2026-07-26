import {
  ShoppingBag,
  Snowflake,
  PlayCircle,
  CalendarClock,
  CircleCheckBig,
} from "lucide-react";

import { formatDate } from "../utils/membershipHelpers";

function MembershipTimeline({ membership }) {
  const timeline = [
    {
      id: 1,
      title: "Membership Purchased",
      description: "Your membership was successfully purchased.",
      date: membership.createdAt,
      icon: ShoppingBag,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },

    {
      id: 2,
      title: "Membership Activated",
      description: "Membership became active.",
      date: membership.startDate,
      icon: CircleCheckBig,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },

    ...(membership.status === "FROZEN"
      ? [
          {
            id: 3,
            title: "Membership Frozen",
            description: "Membership is temporarily paused.",
            date: new Date(),
            icon: Snowflake,
            color: "text-sky-400",
            bg: "bg-sky-500/10",
          },
        ]
      : []),

    ...(membership.status === "ACTIVE" &&
    membership.startDate !== membership.createdAt
      ? [
          {
            id: 4,
            title: "Membership Resumed",
            description: "Membership resumed successfully.",
            date: new Date(),
            icon: PlayCircle,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
        ]
      : []),

    {
      id: 5,
      title: "Membership Expiry",
      description: "Membership validity ends.",
      date: membership.endDate,
      icon: CalendarClock,
      color: "text-red-400",
      bg: "bg-red-500/10",
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
      <h2 className="text-xl font-bold">Membership Timeline</h2>

      <div className="mt-7 space-y-7">
        {timeline.map(
          ({ id, title, description, date, icon: Icon, color, bg }, index) => (
            <div key={id} className="relative flex gap-5">
              {index !== timeline.length - 1 && (
                <div
                  className="
                    absolute
                    left-[22px]
                    top-12
                    h-full
                    w-px
                    bg-white/10
                  "
                />
              )}

              <div
                className={`
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  ${bg}
                `}
              >
                <Icon size={20} className={color} />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{title}</h3>

                <p className="mt-1 text-sm text-zinc-400">{description}</p>

                <p className="mt-2 text-xs text-zinc-500">{formatDate(date)}</p>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

export default MembershipTimeline;
