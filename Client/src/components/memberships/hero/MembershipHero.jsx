import {
  Dumbbell,
  Sparkles,
  CreditCard,
  Snowflake,
  ArrowRightLeft,
  Zap,
} from "lucide-react";

import dashboardHero from "../../../assets/images/dashboard-hero.png";

function MembershipHero({ total = 0 }) {
  return (
    <section
      className="relative isolate overflow-hidden rounded-2xl border border-violet-400/20 bg-[#16103d] px-6 py-7 sm:px-8 lg:min-h-[350px] lg:px-10 lg:py-9"
    >
      <img src={dashboardHero} alt="" className="pointer-events-none absolute inset-0 -z-20 h-full w-full object-cover object-[72%_50%] opacity-35" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#201061] via-[#171038]/90 to-[#120d2b]/35" />
      <div className="absolute inset-0 -z-10 opacity-[0.12] [background-image:linear-gradient(to_right,#a78bfa_1px,transparent_1px),linear-gradient(to_bottom,#a78bfa_1px,transparent_1px)] [background-size:22px_22px]" />

      <div className="relative max-w-[650px]">
        <div className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/15 px-3 py-2 text-xs font-semibold text-violet-100">
          <Sparkles size={14} /> Your Fitness Journey
        </div>

        <h2 className="mt-4 max-w-xl text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl">
          Track, manage and<br className="hidden sm:block" /> make the most out of<br className="hidden sm:block" /> your <span className="text-violet-400">gym memberships.</span>
        </h2>

        <p className="mt-4 max-w-lg text-sm leading-6 text-violet-100/80">
          Keep track of every membership, freeze subscriptions, transfer eligible plans, purchase new memberships and manage everything in one place.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            [Snowflake, "Freeze Plans"],
            [ArrowRightLeft, "Transfer Plans"],
            [CreditCard, "Purchase Online"],
            [Zap, "Track Progress"],
          ].map(([Icon, label]) => (
            <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-violet-200/15 bg-[#130d38]/55 px-3 py-2 text-xs text-violet-50/90 backdrop-blur">
              <Icon size={14} className="text-violet-400" /> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 hidden rounded-2xl border border-white/10 bg-[#100d29]/80 px-4 py-3 backdrop-blur-md sm:block">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-600/25 text-violet-300"><CreditCard size={18} /></span>
          <div><p className="text-xs text-zinc-400">Total Memberships</p><p className="text-3xl font-bold leading-none text-white">{total}</p></div>
        </div>
      </div>

      <Dumbbell aria-hidden size={150} strokeWidth={1.3} className="absolute -right-2 top-6 hidden rotate-[-15deg] text-violet-400/35 xl:block" />
    </section>
  );
}

export default MembershipHero;
