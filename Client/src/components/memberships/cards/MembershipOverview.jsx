import { CalendarDays, Clock3, IndianRupee, MapPin } from "lucide-react";

function MembershipOverview({ membership }) {
  const plan = membership.plan;

  const gym = plan?.gym;

  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(membership.endDate) - new Date()) / (1000 * 60 * 60 * 24),
    ),
  );

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-4
        sm:grid-cols-2
        xl:grid-cols-4
      "
    >
      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10111a] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30">
        <div className="flex items-center gap-2 text-zinc-400">
          <IndianRupee size={16} />
          Price
        </div>

        <h3 className="mt-2 text-xl font-semibold">₹{plan?.price}</h3>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10111a] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30">
        <div className="flex items-center gap-2 text-zinc-400">
          <Clock3 size={16} />
          Duration
        </div>

        <h3 className="mt-2 text-xl font-semibold">
          {plan?.durationInDays} Days
        </h3>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10111a] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30">
        <div className="flex items-center gap-2 text-zinc-400">
          <CalendarDays size={16} />
          Remaining
        </div>

        <h3 className="mt-2 text-xl font-semibold text-emerald-400">
          {daysRemaining} Days
        </h3>
      </div>

      <div className="group relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#10111a] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/30">
        <div className="flex items-center gap-2 text-zinc-400">
          <MapPin size={16} />
          City
        </div>

        <h3 className="mt-2 text-xl font-semibold">{gym?.city || "-"}</h3>
      </div>
    </div>
  );
}

export default MembershipOverview;
