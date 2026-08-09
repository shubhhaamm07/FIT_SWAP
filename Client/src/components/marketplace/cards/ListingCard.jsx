import {
  Heart,
  MapPin,
  Star,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { removeSavedListing, saveListing } from "../../../api/marketplace.api";

import calculateDiscount from "../utils/calculateDiscount";
import formatPrice from "../utils/formatPrice";
const ListingCard = ({ listing, isSaved = false, onSavedChange }) => {
  const discount = calculateDiscount(listing.originalPrice, listing.price);
  const [saved, setSaved] = useState(isSaved);
  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    try {
      setSaveError("");
      if (saved) await removeSavedListing(listing.id);
      else await saveListing(listing.id);
      setSaved(!saved);
      onSavedChange?.(listing.id, !saved);
    } catch (error) {
      setSaveError(error.response?.data?.message || "Unable to update saved listings.");
    }
  };

  return (
    <article
      className="
        overflow-hidden
        portal-card
        rounded-xl
        border
        border-white/10
        bg-[#11121a]
        transition
        hover:-translate-y-1
        hover:border-violet-500/40
      "
    >
      <div className="relative h-32 overflow-hidden sm:h-36">
        <img
          src={listing.image}
          alt={listing.gym}
          className="h-full w-full object-cover"
        />

        <button type="button" onClick={handleSave}
          className="
            absolute
            right-2.5
            top-2.5
            rounded-full
            bg-black/40
            p-1.5
            backdrop-blur
          "
        >
          <Heart size={18} className={saved ? "fill-violet-500 text-violet-400" : "text-white"} />
        </button>

        <div className="absolute left-2.5 top-2.5 flex gap-2">
          {listing.featured && (
            <span className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-semibold text-white">
              Premium
            </span>
          )}

        </div>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <div className="flex items-center justify-between gap-2"><h3 className="truncate text-xs font-semibold text-white">{listing.gym}</h3><span className="flex shrink-0 items-center gap-0.5 text-[10px] text-amber-300"><Star size={11} fill="currentColor" /> 4.7</span></div>
          <p className="mt-1 flex items-center gap-1 text-[10px] text-zinc-500"><MapPin size={10} />{listing.location}</p>
        </div>
        <div><p className="text-[10px] font-medium text-zinc-200">{listing.membership}</p><p className="mt-1 text-[10px] text-zinc-500">Valid till {listing.validTill || "15 Dec 2026"}<span className="float-right text-violet-400">{Math.max(1, Math.round(listing.remainingDays / 30))} months left</span></p></div>

        <div className="flex items-end justify-between">
          <div>
            <span className="text-lg font-bold text-white">{formatPrice(listing.price)}</span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-[10px] text-zinc-500 line-through">
                {formatPrice(listing.originalPrice)}
              </span>

              <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                {discount}% OFF
              </span>
            </div>
          </div>

          <Link to={`/marketplace/${listing.id}`} className="rounded-md border border-violet-500/70 px-2.5 py-1.5 text-[10px] font-medium text-violet-300 transition hover:bg-violet-600 hover:text-white">View Details</Link>
        </div>

        {saveError && <p className="text-[10px] text-red-400">{saveError}</p>}

      </div>
    </article>
  );
};

export default ListingCard;
