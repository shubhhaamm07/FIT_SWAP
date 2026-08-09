import { BadgeCheck } from "lucide-react";

const SellerInfo = ({ listing }) => {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#11131A] p-6">
      <h2 className="mb-5 text-2xl font-bold text-white">Seller</h2>

      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 text-2xl font-bold text-white">
          {listing.seller[0]}
        </div>

        <div>
          <h3 className="font-semibold text-white">{listing.seller}</h3>

          <div className="mt-1 flex items-center gap-2 text-green-400">
            <BadgeCheck size={16} />
            Verified Seller
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerInfo;
