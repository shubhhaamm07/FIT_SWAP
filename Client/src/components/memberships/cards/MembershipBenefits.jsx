import { ShieldCheck, ArrowRightLeft, Snowflake, Clock3 } from "lucide-react";

function MembershipBenefits({ membership }) {
  const plan = membership.plan;

  const benefits = [
    {
      icon: ShieldCheck,
      title: "Membership",
      value: membership.status,
    },
    {
      icon: ArrowRightLeft,
      title: "Transfer",
      value: plan.transferable ? "Available" : "Unavailable",
    },
    {
      icon: Snowflake,
      title: "Freeze",
      value: plan.freezeAllowed ? "Allowed" : "Not Allowed",
    },
    {
      icon: Clock3,
      title: "Duration",
      value: `${plan.durationInDays} Days`,
    },
  ];

  return (
    <div className="mt-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit) => {
          const Icon = benefit.icon;

          return (
            <div
              key={benefit.title}
              className="
                rounded-2xl
                border
                border-white/10
                bg-[#10111a]
                p-5
              "
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/15">
                <Icon size={18} className="text-violet-400" />
              </div>

              <p className="text-xs text-zinc-500">{benefit.title}</p>

              <h4 className="mt-1 font-semibold">{benefit.value}</h4>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MembershipBenefits;
