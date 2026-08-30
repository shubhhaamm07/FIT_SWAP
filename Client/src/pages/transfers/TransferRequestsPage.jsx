import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, CircleAlert, ClipboardCheck, Clock3, Dumbbell, LoaderCircle, MapPin, ShieldCheck, X } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { approveTransferRequest, cancelTransferRequest, getIncomingTransferRequests, getMyTransferRequests, rejectTransferRequest } from "../../api/transfer.api";
import { cancelUpiPaymentRequest, confirmUpiPaymentReceived, getMyUpiPaymentRequests, markUpiPaymentPaid, rejectUpiPayment } from "../../api/upi-payment.api";
import UpiPaymentCheckout from "../../components/payments/UpiPaymentCheckout";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const paymentTerminalStatuses = ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"];

const TransferRequestsPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [upiPayments, setUpiPayments] = useState({ incoming: [], outgoing: [] });
  const [activeTab, setActiveTab] = useState("upi");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const [legacyIncoming, legacyOutgoing, upi] = await Promise.all([getIncomingTransferRequests(), getMyTransferRequests(), getMyUpiPaymentRequests()]);
      setIncoming(Array.isArray(legacyIncoming) ? legacyIncoming : []);
      setOutgoing(Array.isArray(legacyOutgoing) ? legacyOutgoing : []);
      setUpiPayments({ incoming: Array.isArray(upi?.incoming) ? upi.incoming : [], outgoing: Array.isArray(upi?.outgoing) ? upi.outgoing : [] });
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load transfer requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadRequests(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadRequests]);
  useEffect(() => {
    const hasLiveRequest = [...upiPayments.incoming, ...upiPayments.outgoing].some((request) => !paymentTerminalStatuses.includes(request.status));
    if (!hasLiveRequest) return undefined;
    const timer = window.setInterval(() => { void loadRequests(); }, 20000);
    return () => window.clearInterval(timer);
  }, [upiPayments, loadRequests]);

  const handleLegacyAction = async (requestId, action) => {
    try {
      setUpdatingId(requestId);
      if (action === "approve") await approveTransferRequest(requestId);
      else if (action === "reject") await rejectTransferRequest(requestId);
      else await cancelTransferRequest(requestId);
      await loadRequests();
      setMessage(`Legacy transfer request ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "cancelled"}.`);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update this transfer request.");
    } finally { setUpdatingId(""); }
  };

  const handleMarkPaid = async (requestId, utr) => {
    try {
      setUpdatingId(requestId);
      await markUpiPaymentPaid(requestId, utr);
      await loadRequests();
      setMessage("Your UTR was recorded. The recipient has been asked to check their bank or UPI app.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to record your UPI reference.");
    } finally { setUpdatingId(""); }
  };

  const handleCancelPayment = async (requestId) => {
    try {
      setUpdatingId(requestId);
      await cancelUpiPaymentRequest(requestId);
      await loadRequests();
      setMessage("UPI payment request cancelled.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to cancel this UPI payment request.");
    } finally { setUpdatingId(""); }
  };

  const handleConfirmPayment = async (requestId) => {
    if (!window.confirm("Confirm only after checking the exact amount and UTR in your real UPI or bank app. Continue?")) return;
    try {
      setUpdatingId(requestId);
      await confirmUpiPaymentReceived(requestId);
      await loadRequests();
      setMessage("Payment confirmed. FitSwap has sent the transfer for the next approval step.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to confirm this payment.");
    } finally { setUpdatingId(""); }
  };

  const handleRejectPayment = async (requestId) => {
    const reason = window.prompt("Why are you rejecting this payment request?", "Payment was not found in my UPI or bank app.");
    if (reason === null) return;
    try {
      setUpdatingId(requestId);
      await rejectUpiPayment(requestId, reason);
      await loadRequests();
      setMessage("UPI payment request rejected and the buyer was notified.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to reject this payment request.");
    } finally { setUpdatingId(""); }
  };

  const legacyRequests = activeTab === "incoming" ? incoming : outgoing;
  const sellerReviewCount = useMemo(() => upiPayments.incoming.filter((request) => request.status === "BUYER_MARKED_PAID").length, [upiPayments.incoming]);
  const buyerPendingCount = useMemo(() => upiPayments.outgoing.filter((request) => !paymentTerminalStatuses.includes(request.status)).length, [upiPayments.outgoing]);
  const legacyIncomingPendingCount = useMemo(() => incoming.filter((request) => request.status === "PENDING").length, [incoming]);

  const isError = /unable|not found|cannot|reject|cancel/i.test(message);

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-violet-400">Marketplace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Payment & transfer centre</h1><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">Track secure UPI handovers, confirm payments you received, and keep a record of older transfer requests.</p></div><div className="flex flex-wrap gap-3"><Stat label="Seller checks" value={sellerReviewCount} icon={ClipboardCheck} /><Stat label="Your UPI payments" value={buyerPendingCount} icon={Clock3} /><Stat label="Legacy reviews" value={legacyIncomingPendingCount} icon={ArrowDownLeft} /></div></div>
        </section>

        <div className="flex w-full max-w-full flex-wrap gap-2 rounded-xl border border-white/[0.08] bg-[#11121a] p-1">
          <Tab active={activeTab === "upi"} onClick={() => setActiveTab("upi")} icon={ShieldCheck} label="UPI payments" count={upiPayments.incoming.length + upiPayments.outgoing.length} />
          <Tab active={activeTab === "incoming"} onClick={() => setActiveTab("incoming")} icon={ArrowDownLeft} label="Legacy incoming" count={incoming.length} />
          <Tab active={activeTab === "outgoing"} onClick={() => setActiveTab("outgoing")} icon={ArrowUpRight} label="Legacy outgoing" count={outgoing.length} />
        </div>

        {message && <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}><CircleAlert size={16} /> {message}</div>}

        {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin" size={19} /> Loading payment records…</div> : activeTab === "upi" ? <UpiPaymentsPanel incoming={upiPayments.incoming} outgoing={upiPayments.outgoing} updatingId={updatingId} onMarkPaid={handleMarkPaid} onCancel={handleCancelPayment} onConfirm={handleConfirmPayment} onReject={handleRejectPayment} /> : legacyRequests.length ? <div className="grid gap-4"><div className="rounded-xl border border-amber-400/15 bg-amber-500/[0.04] px-4 py-3 text-xs leading-5 text-amber-100/75">These are older requests created before the secure UPI workflow. New marketplace payments use the UPI tab above.</div>{legacyRequests.map((request) => <TransferCard key={request.id} request={request} direction={activeTab} updating={updatingId === request.id} onAction={handleLegacyAction} />)}</div> : <EmptyTransfers direction={activeTab} />}
      </main>
    </DashboardLayout>
  );
};

function UpiPaymentsPanel({ incoming, outgoing, updatingId, onMarkPaid, onCancel, onConfirm, onReject }) {
  const awaitingConfirmation = incoming.filter((request) => request.status === "BUYER_MARKED_PAID");
  const otherIncoming = incoming.filter((request) => request.status !== "BUYER_MARKED_PAID");

  return <div className="space-y-6">
    <section><div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="font-semibold text-white">Payments to confirm</h2><p className="mt-1 text-sm text-zinc-500">Check your own UPI or bank app. A UTR alone is not proof of payment.</p></div><span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-bold text-amber-200">{awaitingConfirmation.length} to review</span></div>{awaitingConfirmation.length ? <div className="grid gap-4">{awaitingConfirmation.map((request) => <ReceivedPaymentCard key={request.id} request={request} updating={updatingId === request.id} onConfirm={onConfirm} onReject={onReject} />)}</div> : <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-6 text-sm text-zinc-500">No UPI payments need your confirmation.</div>}</section>
    <section><div className="mb-3"><h2 className="font-semibold text-white">Your UPI payments</h2><p className="mt-1 text-sm text-zinc-500">Use the exact QR amount and follow every approval step here.</p></div>{outgoing.length ? <div className="grid gap-4">{outgoing.map((request) => <OutgoingPaymentCard key={request.id} request={request} updating={updatingId === request.id} onMarkPaid={onMarkPaid} onCancel={onCancel} />)}</div> : <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-6 text-sm text-zinc-500">UPI payment requests you create will appear here.</div>}</section>
    {otherIncoming.length > 0 && <section><div className="mb-3"><h2 className="font-semibold text-white">Received payment history</h2></div><div className="grid gap-3">{otherIncoming.map((request) => <ReceivedHistoryCard key={request.id} request={request} />)}</div></section>}
  </div>;
}

function OutgoingPaymentCard({ request, updating, onMarkPaid, onCancel }) {
  const context = request.kind === "GYM_MEMBERSHIP" ? `${request.gym?.name || "Gym"} · ${request.plan?.name || "Membership"}` : `${request.listing?.membership?.plan?.gym?.name || "Gym"} · ${request.listing?.membership?.plan?.name || "Membership"}`;
  const detail = request.kind === "GYM_MEMBERSHIP" ? "The gym activates the membership after confirming your payment." : request.status === "AWAITING_GYM_APPROVAL" ? "The seller confirmed payment. The gym now has to approve the transfer." : "The seller must confirm payment before the gym approves the handover.";
  return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{context}</h3><PaymentStatus status={request.status} /></div><p className="mt-2 text-sm text-zinc-400">{detail}</p><p className="mt-3 text-xs text-zinc-500">Reference: <span className="font-semibold text-violet-200">{request.paymentRef}</span> · Created {formatDate(request.createdAt)}</p></div><p className="text-xl font-bold text-white">{formatPaise(request.amount)}</p></div>{request.status === "AWAITING_PAYMENT" && <div className="mt-5"><UpiPaymentCheckout request={request} compact busy={updating} onMarkPaid={(utr) => onMarkPaid(request.id, utr)} onCancel={() => onCancel(request.id)} /></div>}</article>;
}

function ReceivedPaymentCard({ request, updating, onConfirm, onReject }) {
  const person = request.buyer || {};
  const buyerName = [person.firstName, person.lastName].filter(Boolean).join(" ") || "Buyer";
  const context = request.kind === "GYM_MEMBERSHIP" ? `${request.gym?.name || "Gym"} · ${request.plan?.name || "Membership"}` : `${request.listing?.membership?.plan?.gym?.name || "Gym"} · ${request.listing?.membership?.plan?.name || "Membership"}`;
  return <article className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{context}</h3><PaymentStatus status={request.status} /></div><p className="mt-2 text-sm text-zinc-300">Buyer: {buyerName} · {person.email || "No email"}</p><div className="mt-3 grid gap-2 rounded-xl border border-amber-400/15 bg-black/15 p-3 text-xs text-amber-100/85 sm:grid-cols-3"><p>Amount: <span className="font-bold text-white">{formatPaise(request.amount)}</span></p><p>UTR: <span className="font-bold text-white">{request.utr}</span></p><p>Reference: <span className="font-bold text-white">{request.paymentRef}</span></p></div></div><div className="flex shrink-0 gap-2"><button type="button" disabled={updating} onClick={() => onConfirm(request.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> I received it</button><button type="button" disabled={updating} onClick={() => onReject(request.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div></div></article>;
}

function ReceivedHistoryCard({ request }) { const context = request.kind === "GYM_MEMBERSHIP" ? `${request.gym?.name || "Gym"} · ${request.plan?.name || "Membership"}` : `${request.listing?.membership?.plan?.gym?.name || "Gym"} · ${request.listing?.membership?.plan?.name || "Membership"}`; return <article className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#11121a] p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-white">{context}</p><PaymentStatus status={request.status} /></div><p className="mt-1 text-xs text-zinc-500">{formatPaise(request.amount)} · {request.paymentRef}</p></div><p className="text-xs text-zinc-500">{formatDate(request.completedAt || request.rejectedAt || request.createdAt)}</p></article>; }

function TransferCard({ request, direction, updating, onAction }) { const plan = request.listing?.membership?.plan || {}; const gym = plan.gym || {}; const counterparty = direction === "incoming" ? request.buyer : request.listing?.seller; const personName = [counterparty?.firstName, counterparty?.lastName].filter(Boolean).join(" ") || (direction === "incoming" ? "Buyer" : "Seller"); return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 transition hover:border-violet-500/25 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-400"><Dumbbell size={21} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{gym.name || plan.name || "Membership transfer"}</h2><LegacyStatus status={request.status} /></div><p className="mt-1 text-sm text-zinc-400">{plan.name || "Membership"} · {plan.durationInDays || "—"} days</p><p className="mt-2 flex items-center gap-1 text-xs text-zinc-500"><MapPin size={13} /> {gym.city || "Location pending"}</p></div></div><div className="grid grid-cols-2 gap-x-8 gap-y-3 border-y border-white/[0.07] py-4 text-sm sm:flex sm:border-y-0 sm:py-0"><Info label={direction === "incoming" ? "Requested by" : "Listed by"} value={personName} /><Info label="Listing price" value={formatPrice(request.listing?.askingPrice || 0)} /><Info label="Requested" value={formatDate(request.createdAt)} /></div>{direction === "incoming" && request.status === "PENDING" && <div className="flex gap-2"><button type="button" disabled={updating} onClick={() => onAction(request.id, "approve")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> Approve</button><button type="button" disabled={updating} onClick={() => onAction(request.id, "reject")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div>}{direction === "outgoing" && request.status === "PENDING" && <button type="button" disabled={updating} onClick={() => onAction(request.id, "cancel")} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-500/30 px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5 disabled:opacity-50"><X size={15} /> Cancel request</button>}</div></article>; }

function Tab({ active, onClick, icon: Icon, label, count }) { return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${active ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}><Icon size={16} /> {label}<span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? "bg-white/15" : "bg-white/[0.07]"}`}>{count}</span></button>; }
function Stat({ label, value, icon: Icon }) { return <div className="rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3"><p className="flex items-center gap-1.5 text-xs text-zinc-500"><Icon size={13} /> {label}</p><p className="mt-1 text-xl font-bold text-white">{value}</p></div>; }
function Info({ label, value }) { return <div><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 max-w-[140px] truncate font-medium text-white">{value}</p></div>; }
function PaymentStatus({ status }) { const styles = { AWAITING_PAYMENT: "bg-violet-500/15 text-violet-200", BUYER_MARKED_PAID: "bg-amber-500/15 text-amber-200", AWAITING_GYM_APPROVAL: "bg-sky-500/15 text-sky-200", COMPLETED: "bg-emerald-500/15 text-emerald-200", REJECTED: "bg-red-500/15 text-red-200", CANCELLED: "bg-zinc-500/15 text-zinc-300", EXPIRED: "bg-red-500/15 text-red-200" }; return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[status] || "bg-zinc-500/15 text-zinc-300"}`}>{String(status || "UNKNOWN").replaceAll("_", " ")}</span>; }
function LegacyStatus({ status }) { const styles = { PENDING: "bg-amber-500/15 text-amber-300", APPROVED: "bg-emerald-500/15 text-emerald-300", REJECTED: "bg-red-500/15 text-red-300", CANCELLED: "bg-zinc-500/15 text-zinc-300" }; return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${styles[status] || "bg-zinc-500/15 text-zinc-300"}`}>{status}</span>; }
function EmptyTransfers({ direction }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-8 text-center"><ArrowDownLeft size={36} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">No {direction} requests</h2><p className="mt-2 text-sm text-zinc-500">{direction === "incoming" ? "Older transfer requests for your listings will appear here." : "Older marketplace requests will appear here."}</p></div>; }
function formatDate(value) { const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(parsed); }
function formatPaise(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0) / 100); }

export default TransferRequestsPage;
