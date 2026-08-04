import { Eye, MapPin, Play, Snowflake, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { formatCurrency, formatDate, getGymLocation } from "../utils/membershipHelpers";

function MembershipCard({
  membership,
  onFreeze,
  onUnfreeze,
}) {
  const navigate = useNavigate();
  const plan = membership.plan ?? {};
  const gym = plan.gym ?? {};
  const gymImage = gym.images?.find((image) => image.isPrimary)?.imageUrl || gym.images?.[0]?.imageUrl;
  const daysRemaining = Math.max(0, Math.ceil((new Date(membership.endDate) - new Date()) / 86400000));
  const status = membership.status?.toLowerCase() ?? "unknown";
  const statusStyles = {
    active: "bg-emerald-500/15 text-emerald-400",
    frozen: "bg-amber-500/15 text-amber-400",
    expired: "bg-red-500/15 text-red-400",
    pending: "bg-yellow-500/15 text-yellow-400",
    unknown: "bg-zinc-500/15 text-zinc-400",
  };

  return (
    <article className="group rounded-2xl border border-white/[0.1] bg-[#0D121C] p-4 transition hover:border-violet-400/30 hover:bg-[#101725] sm:p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
        <div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-violet-950 via-[#181026] to-[#06080d] sm:h-32 xl:w-40">
          {gymImage ? (
            <img src={gymImage} alt={gym.name ?? "Gym"} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center"><Crown size={30} className="text-violet-400/80" /></div>
          )}
        </div>

        <div className="min-w-0 flex-1 xl:grid xl:grid-cols-[minmax(260px,1.35fr)_130px_120px] xl:items-center xl:gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold text-white">{gym.name || "Gym Membership"}</h2>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyles[status]}`}>{membership.status}</span>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-violet-300"><Crown size={15} fill="currentColor" /> {plan.name || "Membership Plan"}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400"><MapPin size={14} /> {getGymLocation(gym) || "Location unavailable"}</p>
            <p className="mt-2 text-sm text-zinc-400">Started on {formatDate(membership.startDate)}</p>
          </div>

          <div className="mt-5 border-l border-white/[0.08] pl-4 xl:mt-0">
            <p className="text-xs text-zinc-500">Valid till</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatDate(membership.endDate)}</p>
            <p className={`mt-2 text-xs font-semibold ${membership.status === "FROZEN" ? "text-amber-400" : "text-emerald-400"}`}>
              {membership.status === "FROZEN" ? "FROZEN" : `${daysRemaining} days remaining`}
            </p>
          </div>

          <div className="mt-5 border-l border-white/[0.08] pl-4 xl:mt-0">
            <p className="text-xs text-zinc-500">Price</p>
            <p className="mt-1 text-xl font-bold text-violet-400">{formatCurrency(plan.price)}</p>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:w-[115px] sm:flex-col">
          <button type="button" onClick={() => navigate(`/memberships/${membership.id}`)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-white/[0.07]"><Eye size={16} /> View</button>
          {membership.status === "ACTIVE" && (
            <button type="button" onClick={() => onFreeze(membership)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-violet-500"><Snowflake size={16} /> Freeze</button>
          )}
          {membership.status === "FROZEN" && (
            <button type="button" onClick={() => onUnfreeze(membership)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"><Play size={16} fill="currentColor" /> Resume</button>
          )}
        </div>
      </div>
    </article>
  );
}

export default MembershipCard;
