import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ClipboardCheck, Clock3, ExternalLink, IndianRupee, ShieldCheck, X } from "lucide-react";

const formatPrice = (paise) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(paise || 0) / 100);

const getSafeUpiIntent = (value) => {
  if (typeof value !== "string") return "";

  try {
    const intent = new URL(value);
    return intent.protocol === "upi:" && intent.hostname === "pay" ? value : "";
  } catch {
    return "";
  }
};

function UpiPaymentCheckout({ request, busy = false, onMarkPaid, onCancel, compact = false, verificationNotice }) {
  const [utrState, setUtrState] = useState({ requestId: request.id, value: "" });
  const [now, setNow] = useState(() => Date.now());
  const isAwaitingPayment = request.status === "AWAITING_PAYMENT";
  const isMarkedPaid = request.status === "BUYER_MARKED_PAID";
  const utr = utrState.requestId === request.id ? utrState.value : "";
  const secondsLeft = Math.max(0, Math.ceil((new Date(request.expiresAt).getTime() - now) / 1000));

  useEffect(() => {
    if (!isAwaitingPayment) return undefined;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [isAwaitingPayment, request.expiresAt]);

  const countdown = useMemo(() => `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`, [secondsLeft]);
  const intent = getSafeUpiIntent(request.upiIntent);

  if (isMarkedPaid) {
    return <div className="rounded-2xl border border-amber-400/25 bg-amber-500/[0.07] p-5 text-center"><ClipboardCheck className="mx-auto text-amber-300" size={30} /><p className="mt-3 text-sm font-bold text-amber-100">Payment marked as sent</p><p className="mt-2 text-sm leading-6 text-amber-100/70">The recipient must check their real UPI or bank app before confirming this payment. Your membership has not moved yet.</p><p className="mt-4 rounded-xl border border-amber-400/15 bg-black/15 px-3 py-2 text-xs font-semibold tracking-wide text-amber-200">REFERENCE: {request.paymentRef}</p></div>;
  }

  if (!isAwaitingPayment) {
    const states = {
      AWAITING_GYM_APPROVAL: { title: "Waiting for gym approval", text: "The seller confirmed your payment. The gym is now reviewing the membership handover.", tone: "border-sky-400/25 bg-sky-500/[0.07] text-sky-100" },
      COMPLETED: { title: "Payment workflow completed", text: "The membership handover has been completed.", tone: "border-emerald-400/25 bg-emerald-500/[0.07] text-emerald-100" },
      REJECTED: { title: "Payment request rejected", text: request.rejectionReason || "The recipient could not confirm this payment. Contact them before making another payment.", tone: "border-red-400/25 bg-red-500/[0.07] text-red-100" },
      CANCELLED: { title: "Payment request cancelled", text: "No payment or membership transfer was completed.", tone: "border-zinc-400/20 bg-white/[0.04] text-zinc-200" },
      EXPIRED: { title: "Payment request expired", text: "Create a new request before making any payment. Do not pay against this old QR code.", tone: "border-red-400/25 bg-red-500/[0.07] text-red-100" },
    };
    const state = states[request.status] || { title: "Payment status updated", text: "Refresh this page to see the latest payment status.", tone: "border-white/[0.1] bg-white/[0.04] text-zinc-200" };
    return <div className={`rounded-2xl border p-5 text-center ${state.tone}`}><CheckCircle2 className="mx-auto" size={30} /><p className="mt-3 text-sm font-bold">{state.title}</p><p className="mt-2 text-sm leading-6 opacity-80">{state.text}</p><p className="mt-4 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs font-semibold tracking-wide">REFERENCE: {request.paymentRef}</p></div>;
  }

  return <section className={`rounded-2xl border border-violet-400/20 bg-violet-500/[0.06] ${compact ? "p-4" : "p-5"}`}>
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200"><ShieldCheck size={20} /></span><div><p className="font-semibold text-white">Pay directly by UPI</p><p className="mt-1 text-sm leading-5 text-zinc-400">This QR is created for this request only. Pay the exact amount, then enter your UTR/reference number.</p></div></div>
    <div className="mt-5 grid gap-5 sm:grid-cols-[150px_1fr] sm:items-center"><div className="mx-auto rounded-2xl bg-white p-3 shadow-lg shadow-violet-950/25"><QRCodeSVG value={intent || request.paymentRef} size={126} level="M" includeMargin /></div><div className="min-w-0"><div className="flex items-center justify-between gap-3"><p className="text-sm text-zinc-400">Exact amount</p><p className="text-2xl font-bold text-white">{formatPrice(request.amount)}</p></div><div className="mt-3 space-y-1 rounded-xl border border-white/[0.08] bg-black/15 p-3 text-xs text-zinc-400"><p><span className="text-zinc-500">Pay to:</span> <span className="font-medium text-zinc-200">{request.payeeName}</span></p><p><span className="text-zinc-500">UPI ID:</span> <span className="font-medium text-zinc-200">{request.recipientUpiId}</span></p><p><span className="text-zinc-500">Reference:</span> <span className="font-medium text-violet-200">{request.paymentRef}</span></p></div><div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-200"><Clock3 size={14} /> {secondsLeft > 0 ? `Complete within ${countdown}` : "This payment request has expired"}</div></div></div>
    <div className="mt-5 flex flex-col gap-3"><a href={intent || "#"} onClick={(event) => { if (!intent) event.preventDefault(); }} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-violet-500/15 py-3 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25"><ExternalLink size={16} /> Open in UPI app</a><label className="block text-xs font-medium text-zinc-400">UPI UTR / reference number<input value={utr} onChange={(event) => setUtrState({ requestId: request.id, value: event.target.value.toUpperCase() })} placeholder="Shown after payment in GPay, PhonePe, or your bank app" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></label><button type="button" disabled={busy || !utr.trim() || secondsLeft <= 0} onClick={() => onMarkPaid(utr)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"><CheckCircle2 size={17} /> {busy ? "Saving payment reference…" : "I have paid — notify recipient"}</button>{onCancel && <button type="button" disabled={busy} onClick={onCancel} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.1] py-2.5 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.05] disabled:opacity-50"><X size={16} /> Cancel payment request</button>}</div>
    <div className="mt-4 flex gap-2 rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-3 text-xs leading-5 text-amber-100/75"><IndianRupee size={15} className="mt-0.5 shrink-0 text-amber-300" />{verificationNotice || "FitSwap cannot see your bank balance or confirm the transfer automatically. The recipient checks their own UPI/bank app before membership activation or transfer."}</div>
  </section>;
}

export default UpiPaymentCheckout;
