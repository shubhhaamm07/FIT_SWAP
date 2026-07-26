import {
  CalendarDays,
  Clock3,
  Snowflake,
  ArrowRightLeft,
  MapPin,
} from "lucide-react";

import { formatDate, getDaysRemaining } from "../../../utils/date";
import Button from "../../ui/Button";

function MembershipCard({ membership }) {
  const { plan = {}, startDate, endDate, status } = membership;
  const daysRemaining = getDaysRemaining(endDate);
  const isExpiring = daysRemaining <= 7;

  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10111a] transition duration-300 hover:-translate-y-0.5 hover:border-violet-500/30">
      <div className="h-1.5 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-purple-500" />

      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold">{plan.name || "Membership Plan"}</h3>
            <p className="mt-1 text-sm text-zinc-500">
              {plan.gym?.name || "Gym membership"} · ₹{plan.price ?? 0}
            </p>
          </div>

          <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase text-emerald-400">
            {status}
          </span>
        </div>

        <div className="mt-6 grid gap-4 border-y border-white/[0.07] py-5 sm:grid-cols-3">
          <div className="flex gap-2">
            <CalendarDays size={16} className="mt-1 text-violet-400" />
            <div>
              <p className="text-[11px] text-zinc-500">Started</p>
              <p className="mt-1 text-sm">{formatDate(startDate)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Clock3 size={16} className="mt-1 text-violet-400" />
            <div>
              <p className="text-[11px] text-zinc-500">Expires</p>
              <p className="mt-1 text-sm">{formatDate(endDate)}</p>
              <p className={`mt-1 text-xs font-medium ${isExpiring ? "text-red-400" : "text-emerald-400"}`}>
                {daysRemaining} days remaining
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <MapPin size={16} className="mt-1 text-violet-400" />
            <div>
              <p className="text-[11px] text-zinc-500">Location</p>
              <p className="mt-1 text-sm">{plan.gym?.city || "Not available"}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" className="h-10 flex-1 text-sm">
            <Snowflake size={16} />
            Freeze
          </Button>

          <Button className="h-10 flex-1 text-sm">
            <ArrowRightLeft size={16} />
            Sell
          </Button>
        </div>
      </div>
    </article>
  );
}

export default MembershipCard;
