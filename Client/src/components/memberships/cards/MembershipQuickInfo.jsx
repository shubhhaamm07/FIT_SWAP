import { CheckCircle2, ArrowRightLeft, Snowflake } from "lucide-react";

function MembershipQuickInfo({ membership }) {
  const plan = membership.plan;

  return (
    <div className="mt-5 grid grid-cols-3 gap-3">
      <div
        className="
          rounded-2xl
          border
          border-white/10
          bg-[#18181F]
          p-4
          text-center
        "
      >
        <CheckCircle2 size={20} className="mx-auto mb-2 text-emerald-400" />

        <p className="text-xs text-zinc-500">Transfer</p>

        <p className="mt-1 text-sm font-semibold">
          {plan?.transferable ? "Allowed" : "Not Allowed"}
        </p>
      </div>

      <div
        className="
          rounded-2xl
          border
          border-white/10
          bg-[#18181F]
          p-4
          text-center
        "
      >
        <Snowflake size={20} className="mx-auto mb-2 text-sky-400" />

        <p className="text-xs text-zinc-500">Freeze</p>

        <p className="mt-1 text-sm font-semibold">
          {plan?.freezeAllowed ? "Allowed" : "Not Allowed"}
        </p>
      </div>

      <div
        className="
          rounded-2xl
          border
          border-white/10
          bg-[#18181F]
          p-4
          text-center
        "
      >
        <ArrowRightLeft size={20} className="mx-auto mb-2 text-violet-400" />

        <p className="text-xs text-zinc-500">Duration</p>

        <p className="mt-1 text-sm font-semibold">
          {plan?.durationInDays} Days
        </p>
      </div>
    </div>
  );
}

export default MembershipQuickInfo;
