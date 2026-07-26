import formatPrice from "../utils/formatPrice";

const PriceBreakdown = ({ listing }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-6">
      <h2 className="mb-6 text-2xl font-bold text-white">Price Breakdown</h2>

      <div className="space-y-4">
        <div className="flex justify-between">
          <span className="text-zinc-400">Membership Price</span>

          <span className="text-white">{formatPrice(listing.price)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-zinc-400">Transfer Fee</span>

          <span className="text-white">{formatPrice(listing.transferFee)}</span>
        </div>

        <div className="border-t border-white/10 pt-4">
          <div className="flex justify-between text-lg font-semibold">
            <span className="text-white">Total</span>

            <span className="text-violet-400">
              {formatPrice(listing.price + listing.transferFee)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PriceBreakdown;
