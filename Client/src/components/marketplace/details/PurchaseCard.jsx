import { useState } from "react";
import { CreditCard, Heart } from "lucide-react";
import { createTransferRequest } from "../../../api/transfer.api";
import formatPrice from "../utils/formatPrice";

const PurchaseCard = ({ listing }) => {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

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

  return (
    <div className="sticky top-6 rounded-3xl border border-white/10 bg-[#11131A] p-6">
      <p className="text-sm text-zinc-400">Total Price</p>

      <h2 className="mt-2 text-4xl font-bold text-white">
        {formatPrice(listing.price + listing.transferFee)}
      </h2>

      <button onClick={handlePurchase} disabled={submitting} className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
        <CreditCard size={18} />
        {submitting ? "Sending request…" : "Buy Membership"}
      </button>

      {message && <p className="mt-3 text-center text-sm text-zinc-300">{message}</p>}

      <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-white transition hover:bg-white/5">
        <Heart size={18} />
        Add to Wishlist
      </button>

      <div className="mt-8 rounded-2xl bg-violet-500/10 p-4">
        <h3 className="font-semibold text-violet-300">Secure Purchase</h3>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Your payment is held securely until the gym approves the membership
          transfer.
        </p>
      </div>
    </div>
  );
};

export default PurchaseCard;
