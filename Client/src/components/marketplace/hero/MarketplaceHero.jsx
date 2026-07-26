import { CalendarRange, CirclePlay, Dumbbell, HeartHandshake } from "lucide-react";
import heroImage from "../../../assets/images/dashboard-hero.png";

const MarketplaceHero = () => {
  return (
    <section className="relative min-h-[198px] overflow-hidden rounded-xl border border-white/[0.08] bg-[#0e0d15]">
      <img src={heroImage} alt="Athlete training in a gym" className="absolute inset-0 h-full w-full object-cover object-center opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0d0d12] via-[#0d0d12]/88 to-[#0d0d12]/25" />
      <div className="relative flex h-full min-h-[198px] flex-col justify-between p-5 sm:p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-[34px]">Marketplace</h1>
          <p className="mt-1 text-sm text-zinc-300 sm:text-base">Buy and sell gym memberships <span className="text-violet-400">near you</span></p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="flex flex-wrap gap-x-7 gap-y-3">
            <HeroStat icon={CalendarRange} value="342" label="Active Listings" />
            <HeroStat icon={Dumbbell} value="28" label="Gyms Available" />
            <HeroStat icon={HeartHandshake} value="1.2K+" label="Happy Members" />
          </div>
          <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/25 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:border-violet-400 hover:bg-violet-500/15">
            <CirclePlay size={17} /> How it works
          </button>
        </div>
      </div>
    </section>
  );
};

function HeroStat({ icon: Icon, value, label }) {
  return <div className="flex items-center gap-2.5"><Icon size={25} className="text-violet-500" /><div><p className="text-base font-semibold leading-none text-white">{value}</p><p className="mt-1 text-[11px] text-zinc-400">{label}</p></div></div>;
}

export default MarketplaceHero;
