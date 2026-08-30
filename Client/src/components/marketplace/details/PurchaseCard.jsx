import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleAlert, Heart, ShieldCheck } from "lucide-react";
import { removeSavedListing, saveListing } from "../../../api/marketplace.api";
import {
  cancelUpiPaymentRequest,
  createMarketplaceUpiPaymentRequest,
  getMyUpiPaymentRequests,
  markUpiPaymentPaid,
} from "../../../api/upi-payment.api";
import UpiPaymentCheckout from "../../payments/UpiPaymentCheckout";
import formatPrice from "../utils/formatPrice";

const terminalStatuses = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"];

const PurchaseCard = ({ listing, onPurchased, isPurchased = false }) => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [upiRequest, setUpiRequest] = useState(null);
  const upiRequestId = upiRequest?.id;
  const upiRequestStatus = upiRequest?.status;

  useEffect(() => {
    if (!upiRequestId || terminalStatuses.includes(upiRequestStatus)) return undefined;

    const timer = window.setInterval(async () => {
      try {
        const requests = await getMyUpiPaymentRequests();
        const updated = requests.outgoing?.find((request) => request.id === upiRequestId);
        if (!updated) return;

        setUpiRequest(updated);
        if (updated.status === "COMPLETED") {
          setPurchased(true);
          setMessage("The gym approved the transfer. This membership is now in your account.");
          onPurchased?.();
        }
      } catch {
        // Keep the checkout usable if a short polling request fails.
      }
    }, 15000);

    return () => window.clearInterval(timer);
  }, [upiRequestId, upiRequestStatus, onPurchased]);

  const handleCreateUpiRequest = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      setMessage("");
      setUpiRequest(await createMarketplaceUpiPaymentRequest(listing.id));
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create the UPI payment request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (utr) => {
    if (!upiRequest) return;
    try {
      setSubmitting(true);
      setUpiRequest(await markUpiPaymentPaid(upiRequest.id, utr));
      setMessage("Your UTR was recorded. The seller must confirm it in their real UPI or bank app.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to record your UPI reference.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelUpiRequest = async () => {
    if (!upiRequest) return;
    try {
      setSubmitting(true);
      await cancelUpiPaymentRequest(upiRequest.id);
      setUpiRequest(null);
      setMessage("UPI payment request cancelled. No membership transfer was made.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to cancel this UPI payment request.");
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

  if (purchased || isPurchased) {
    return (
      <div className="sticky top-6 overflow-hidden rounded-2xl border border-emerald-400/25 bg-[#101a17] p-5 shadow-xl shadow-emerald-950/20">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-300"><CheckCircle2 size={27} /></div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Transfer complete</p>
        <h2 className="mt-2 text-xl font-bold text-white">Membership added to your account</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-400">The seller confirmed your UPI payment and the gym approved the membership handover.</p>
        <div className="mt-5 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.06] p-3 text-sm text-emerald-100">{message || "The transfer was completed successfully."}</div>
        <button type="button" onClick={() => navigate("/memberships")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white transition hover:bg-emerald-400">View my memberships <ArrowRight size={17} /></button>
      </div>
    );
  }

  if (listing.status !== "ACTIVE") {
    const statusMessage = listing.status === "SOLD" ? "This membership has already been sold." : "This listing is no longer available for purchase.";
    return <div className="sticky top-6 rounded-2xl border border-amber-400/20 bg-[#18150f] p-5 shadow-xl shadow-black/20"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300"><CircleAlert size={25} /></div><p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Listing unavailable</p><h2 className="mt-2 text-xl font-bold text-white">This listing cannot be purchased</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{statusMessage}</p><button type="button" onClick={() => navigate("/marketplace")} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-3 font-semibold text-white transition hover:bg-white/[0.08]"><ArrowLeft size={17} />Back to marketplace</button></div>;
  }

  const isFailure = /unable|not configured|invalid|another payment|cancelled|rejected|expired/i.test(message);

  return (
    <div className="sticky top-6 rounded-2xl border border-violet-500/20 bg-[#12101b] p-5 shadow-xl shadow-black/20">
      <div className="flex items-center gap-2 text-violet-300"><ShieldCheck size={17} /><span className="text-xs font-semibold uppercase tracking-wider">Protected UPI transfer</span></div>
      <p className="mt-5 text-sm text-zinc-400">Payable to seller</p>
      <h2 className="mt-2 text-4xl font-bold text-white">{formatPrice(listing.price)}</h2>
      <div className="mt-5 border-t border-white/[0.08] pt-4 text-sm"><div className="flex justify-between text-zinc-400"><span>Membership value</span><span>{formatPrice(listing.price)}</span></div><p className="mt-3 text-xs leading-5 text-zinc-500">FitSwap does not collect a platform or gym fee in the manual UPI pilot. You pay only the seller&apos;s listed amount.</p></div>

      {upiRequest ? <div className="mt-5"><UpiPaymentCheckout request={upiRequest} busy={submitting} onMarkPaid={handleMarkPaid} onCancel={upiRequest.status === "AWAITING_PAYMENT" ? handleCancelUpiRequest : undefined} compact /></div> : <button type="button" onClick={handleCreateUpiRequest} disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"><ShieldCheck size={18} />{submitting ? "Generating UPI QR…" : "Generate secure UPI QR"}</button>}

      {message && <p className={`mt-3 text-center text-sm ${isFailure ? "text-red-300" : "text-emerald-300"}`}>{message}</p>}
      <button type="button" onClick={handleSave} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3 text-white transition hover:bg-white/5"><Heart size={18} />{saved ? "Remove from saved" : "Save listing"}</button>
      <div className="mt-6 rounded-xl bg-violet-500/10 p-4"><h3 className="font-semibold text-violet-300">What happens next?</h3><p className="mt-2 text-sm leading-6 text-zinc-400">Pay the exact QR amount, submit the UTR shown in your UPI app, then wait for the seller and gym to confirm. The membership moves only after both checks are complete.</p></div>
    </div>
  );
};

export default PurchaseCard;
