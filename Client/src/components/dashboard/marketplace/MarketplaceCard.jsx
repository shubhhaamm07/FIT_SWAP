import { IndianRupee, CalendarDays, ArrowRightLeft } from "lucide-react";

import Button from "../../ui/Button";

function MarketplaceCard({ listing }) {
  const { membership, askingPrice } = listing;

  return (
    <div
      className="
        rounded-2xl
        overflow-hidden
        border
        border-white/10
        bg-[#12121A]
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-violet-500/30
      "
    >
      <div className="h-32 bg-gradient-to-br from-violet-700 via-purple-600 to-indigo-700" />

      <div className="p-5">
        <h3 className="text-lg font-bold">{membership.plan.name}</h3>

        <p className="text-sm text-zinc-500 mt-1">Premium Membership</p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-zinc-400">
              <IndianRupee size={15} />
              Asking
            </span>

            <span className="font-semibold text-green-400">₹{askingPrice}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-zinc-400">
              <CalendarDays size={15} />
              Duration
            </span>

            <span className="text-sm">
              {membership.plan.durationInDays} Days
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">Original Price</span>

            <span className="text-sm">₹{membership.plan.price}</span>
          </div>
        </div>

        <Button className="w-full mt-6 h-10 text-sm">
          <ArrowRightLeft size={16} />
          Request Transfer
        </Button>
      </div>
    </div>
  );
}

export default MarketplaceCard;
