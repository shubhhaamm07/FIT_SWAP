import { useState } from "react";
import { CreditCard, Heart, ShieldCheck } from "lucide-react";
import { createTransferRequest } from "../../../api/transfer.api";
import { removeSavedListing, saveListing } from "../../../api/marketplace.api";
import formatPrice from "../utils/formatPrice";

const PurchaseCard = ({ listing }) => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);

  const handlePurchase = async () => {
    try {
      setSubmitting(true);
      const response = await createTransferRequest(listing.id);
      setMessage(response.message || "Transfer request sent to the seller.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create the transfer request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    try {
      if (saved) await removeSavedListing(listing.id);
      else await saveListing(listing.id);
      setSaved(!saved);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update saved listings.");
    }
  };

  return (
    <div className="sticky top-6 rounded-2xl border border-violet-500/20 bg-[#12101b] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 text-violet-300"><ShieldCheck size={17} /><span className="text-xs font-semibold uppercase tracking-wider">Protected transfer</span></div>
      <p className="mt-5 text-sm text-zinc-400">Total price</p>

      <h2 className="mt-2 text-4xl font-bold text-white">
        {formatPrice(listing.price + listing.transferFee)}
      </h2>

      <div className="mt-5 border-t border-white/[0.08] pt-4 text-sm"><div className="flex justify-between text-zinc-400"><span>Membership</span><span>{formatPrice(listing.price)}</span></div><div className="mt-2 flex justify-between text-zinc-400"><span>Transfer fee</span><span>{formatPrice(listing.transferFee)}</span></div></div>

      <button onClick={handlePurchase} disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
        <CreditCard size={18} />
        {submitting ? "Sending request…" : "Buy Membership"}
      </button>

      {message && <p className="mt-3 text-center text-sm text-zinc-300">{message}</p>}

      <button type="button" onClick={handleSave} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-white transition hover:bg-white/5">
        <Heart size={18} />
        {saved ? "Remove from saved" : "Save listing"}
      </button>

      <div className="mt-6 rounded-xl bg-violet-500/10 p-4">
        <h3 className="font-semibold text-violet-300">What happens next?</h3>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Your payment is held securely until the gym approves the membership
          transfer.
        </p>
      </div>
    </div>
  );
};

export default PurchaseCard;
