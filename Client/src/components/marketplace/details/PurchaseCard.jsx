import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, CreditCard, Heart, Landmark, ShieldCheck } from "lucide-react";
import { createTransferRequest } from "../../../api/transfer.api";
import { removeSavedListing, saveListing } from "../../../api/marketplace.api";
import { createRazorpayOrder, loadRazorpayCheckout, verifyRazorpayPayment } from "../../../api/payment.api";
import formatPrice from "../utils/formatPrice";

const PurchaseCard = ({ listing, onPurchased, isPurchased = false }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const handleCashRequest = async () => {
    try {
      setSubmitting(true);
      const response = await createTransferRequest(listing.id);
      setMessage(response.message || "Cash transfer request sent to the seller for approval.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create the transfer request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOnlinePayment = async () => {
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;

    if (!key) {
      setMessage("Online payments are not configured. Please use the cash transfer option.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const [order, Razorpay] = await Promise.all([
        createRazorpayOrder(listing.id),
        loadRazorpayCheckout(),
      ]);

      let checkoutCompleted = false;

      const checkout = new Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: "FitSwap",
        description: `${listing.membership} — ${listing.gym}`,
        order_id: order.order_id,
        theme: { color: "#7c3aed" },
        handler: async (response) => {
          checkoutCompleted = true;

          try {
            const verification = await verifyRazorpayPayment(response);
            setMessage(verification.message || "Payment verified. Your membership was transferred successfully.");
            setPurchased(true);
            onPurchased?.();
          } catch (error) {
            setMessage(error.response?.data?.message || "Payment was received but could not be verified. Please contact support.");
          } finally {
            setSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => {
            if (checkoutCompleted) return;
            setSubmitting(false);
            setMessage("Payment was cancelled. No membership transfer was made.");
          },
        },
      });

      checkout.on("payment.failed", (response) => {
        setSubmitting(false);
        setMessage(response.error?.description || "Payment failed. No membership transfer was made.");
      });

      checkout.open();
    } catch (error) {
      setSubmitting(false);
      setMessage(error.response?.data?.message || error.message || "Unable to start Razorpay Checkout.");
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

  if (purchased || isPurchased) {
    return (
      <div className="sticky top-6 overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#101a17] p-5 shadow-xl shadow-emerald-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300">
          <CheckCircle2 size={27} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Purchase complete</p>
        <h2 className="mt-2 text-xl font-bold text-white">Membership added to your account</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Your Razorpay payment was verified and the {listing.membership.toLowerCase()} is now yours.
        </p>

        <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06] p-3 text-sm text-emerald-100">
          {message || "The transfer was completed successfully."}
        </div>

        <button
          type="button"
          onClick={() => navigate("/memberships")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-400"
        >
          View my memberships
          <ArrowRight size={17} />
        </button>
      </div>
    );
  }

  if (listing.status !== "ACTIVE") {
    const statusMessage = listing.status === "SOLD"
      ? "This membership has already been sold."
      : "This listing is no longer available for purchase.";

    return (
      <div className="sticky top-6 rounded-2xl border border-amber-400/20 bg-[#18150f] p-5 shadow-xl shadow-black/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300">
          <CircleAlert size={25} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Listing unavailable</p>
        <h2 className="mt-2 text-xl font-bold text-white">This listing cannot be purchased</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{statusMessage}</p>
        <button
          type="button"
          onClick={() => navigate("/marketplace")}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold text-white transition hover:bg-white/[0.08]"
        >
          <ArrowLeft size={17} />
          Back to marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-6 rounded-2xl border border-violet-500/20 bg-[#12101b] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 text-violet-300"><ShieldCheck size={17} /><span className="text-xs font-semibold uppercase tracking-wider">Protected transfer</span></div>
      <p className="mt-5 text-sm text-zinc-400">Total price</p>

      <h2 className="mt-2 text-4xl font-bold text-white">
        {formatPrice(listing.price + listing.transferFee)}
      </h2>

      <div className="mt-5 border-t border-white/[0.08] pt-4 text-sm"><div className="flex justify-between text-zinc-400"><span>Membership</span><span>{formatPrice(listing.price)}</span></div><div className="mt-2 flex justify-between text-zinc-400"><span>Transfer fee</span><span>{formatPrice(listing.transferFee)}</span></div></div>

      <button type="button" onClick={handleOnlinePayment} disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60">
        <CreditCard size={18} />
        {submitting ? "Processing payment…" : "Pay online with Razorpay"}
      </button>

      {message && <p className="mt-3 text-center text-sm text-zinc-300">{message}</p>}

      <button type="button" onClick={handleSave} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-white transition hover:bg-white/5">
        <Heart size={18} />
        {saved ? "Remove from saved" : "Save listing"}
      </button>

      <button type="button" onClick={handleCashRequest} disabled={submitting} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/[0.06] py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/[0.12] disabled:cursor-not-allowed disabled:opacity-60">
        <Landmark size={17} />
        Request cash transfer
      </button>

      <div className="mt-6 rounded-xl bg-violet-500/10 p-4">
        <h3 className="font-semibold text-violet-300">What happens next?</h3>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Online Razorpay payments are verified by FitSwap before the membership
          transfers automatically. Cash requests still need seller approval.
        </p>
      </div>
    </div>
  );
};

export default PurchaseCard;
