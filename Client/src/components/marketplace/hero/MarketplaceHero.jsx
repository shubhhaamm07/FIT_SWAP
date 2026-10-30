import heroImage from "../../../assets/images/optimized/dashboard-hero.webp";
import MarketplaceGuide from "./MarketplaceGuide";
import { useMarketplaceContext } from "../hooks/useMarketplaceContext";

const MarketplaceHero = () => {
  const { totalListings, loading } = useMarketplaceContext();
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
          <p className="text-sm text-zinc-300">{loading ? "Loading available passes…" : `${totalListings} matching memberships`} · Check each plan’s transfer conditions</p>
          <MarketplaceGuide />
        </div>
      </div>
    </section>
  );
};

export default MarketplaceHero;
