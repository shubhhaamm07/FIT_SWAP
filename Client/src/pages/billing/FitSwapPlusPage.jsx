import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleAlert,
  Clock3,
  Crown,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import UpiPaymentCheckout from "../../components/payments/UpiPaymentCheckout";
import {
  cancelPlatformPayment,
  createMemberSubscriptionPayment,
  getMyPlatformBilling,
  markPlatformPaymentPaid,
} from "../../api/platform-billing.api";

const currency = (amountInPaise) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amountInPaise || 0) / 100);

const displayDate = (value) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "—";

const plusFeatures = [
  "Create multiple active membership listings",
  "AI fair-price suggestions before you sell",
  "30-day crowd graphs and quiet-time recommendations",
  "Unlimited saved listings with price-drop alerts",
  "Early alerts for listings matching your city",
  "One complimentary 7-day priority listing boost every calendar month",
  "High-priority support queue and private 30-day wellness insights",
  "Your active Plus status and expiry in one place",
];

const freeFeatures = [
  "Browse gyms and membership listings",
  "One active listing at a time",
  "Trial booking and transfer tracking",
  "Live crowd reporting and basic wellness tools",
];

function FitSwapPlusPage() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [paymentRequest, setPaymentRequest] = useState(null);

  const loadBilling = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getMyPlatformBilling();
      setBilling(data);
      const pending = (data.payments || []).find(
        (payment) =>
          payment.kind === "MEMBER_SUBSCRIPTION" &&
          ["AWAITING_PAYMENT", "BUYER_MARKED_PAID"].includes(payment.status),
      );
      setPaymentRequest((current) => current || pending || null);
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load FitSwap Plus plans.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBilling();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadBilling]);

  const plans = useMemo(
    () =>
      (billing?.offers || []).filter(
        (offer) => offer.kind === "MEMBER_SUBSCRIPTION",
      ),
    [billing?.offers],
  );
  const activePlan = billing?.activeMemberSubscription;
  const history = (billing?.payments || []).filter(
    (payment) => payment.kind === "MEMBER_SUBSCRIPTION",
  );

  const startPayment = async (planCode) => {
    try {
      setBusy(`create-${planCode}`);
      setMessage("");
      const request = await createMemberSubscriptionPayment(planCode);
      setPaymentRequest(request);
      setBilling((current) => ({
        ...current,
        payments: [
          request,
          ...(current?.payments || []).filter((payment) => payment.id !== request.id),
        ],
      }));
      setMessage("Your FitSwap Plus UPI QR is ready. Pay the exact amount, then submit the UTR.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to create the FitSwap Plus payment request.",
      );
    } finally {
      setBusy("");
    }
  };

  const markPaid = async (utr) => {
    if (!paymentRequest) return;
    try {
      setBusy(paymentRequest.id);
      const updated = await markPlatformPaymentPaid(paymentRequest.id, utr);
      setPaymentRequest(updated);
      setBilling((current) => ({
        ...current,
        payments: (current?.payments || []).map((payment) =>
          payment.id === updated.id ? updated : payment,
        ),
      }));
      setMessage("Your UTR was recorded. An administrator will verify the FitSwap UPI payment, usually within 2–3 hours.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to record the UPI reference.",
      );
    } finally {
      setBusy("");
    }
  };

  const cancelPayment = async () => {
    if (!paymentRequest) return;
    try {
      setBusy(paymentRequest.id);
      await cancelPlatformPayment(paymentRequest.id);
      setPaymentRequest(null);
      await loadBilling();
      setMessage("FitSwap Plus payment request cancelled.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to cancel the payment request.",
      );
    } finally {
      setBusy("");
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/25 bg-[radial-gradient(circle_at_85%_15%,rgba(250,204,21,.18),transparent_22%),radial-gradient(circle_at_70%_90%,rgba(168,85,247,.24),transparent_35%),linear-gradient(130deg,#1a1130,#10111a_62%,#161020)] p-6 shadow-2xl shadow-violet-950/25 sm:p-8">
          <div className="pointer-events-none absolute -right-7 -top-10 h-44 w-44 rounded-full border border-amber-200/15" />
          <div className="pointer-events-none absolute right-16 top-10 h-20 w-20 rounded-full border border-violet-200/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-100">
                <Crown size={13} /> Member membership
              </p>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                FitSwap <span className="text-amber-200">Plus</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
                Get more value from the marketplace with paid features that are activated only after your manual UPI payment is verified.
              </p>
            </div>
            <div className="rounded-2xl border border-white/[0.1] bg-black/20 px-4 py-3 text-sm backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Verification time</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-white"><Clock3 size={16} className="text-amber-200" /> Usually 2–3 hours</p>
            </div>
          </div>
        </section>

        {message && (
          <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-200"}`}>
            <CircleAlert size={16} className="mt-0.5 shrink-0" /> {message}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin text-violet-300" /> Loading your membership options…</div>
        ) : (
          <>
            {activePlan && (
              <section className="flex flex-col gap-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.07] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-200"><ShieldCheck size={20} /></span><div><p className="font-bold text-emerald-50">FitSwap Plus is active</p><p className="mt-1 text-sm text-emerald-100/70">Your paid features stay available until {displayDate(activePlan.benefitExpiresAt)}.</p><p className="mt-2 text-xs font-semibold text-emerald-200">{billing?.entitlements?.freeMonthlyBoostAvailable ? "Your complimentary 7-day priority listing boost is ready in My Listings." : "Your complimentary priority boost has been used this calendar month."}</p></div></div>
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-bold text-emerald-200"><Check size={14} /> Active</span>
              </section>
            )}

            {paymentRequest && !activePlan ? (
              <section className="rounded-3xl border border-violet-400/20 bg-[#11121a] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-violet-300">FitSwap Plus checkout</p><h2 className="mt-2 text-2xl font-bold text-white">Complete your manual UPI payment</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Pay only to the FitSwap UPI shown in this QR code. Your Plus tools remain locked until an administrator matches your UTR with the real business payment.</p></div><button type="button" onClick={() => setPaymentRequest(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.07] hover:text-white" aria-label="Close checkout"><X size={18} /></button></div>
                <div className="mt-6"><UpiPaymentCheckout request={paymentRequest} busy={busy === paymentRequest.id} onMarkPaid={markPaid} onCancel={paymentRequest.status === "AWAITING_PAYMENT" ? cancelPayment : undefined} verificationNotice="FitSwap cannot confirm bank transfers automatically. A FitSwap administrator verifies the exact amount and UTR in the business UPI/bank account before unlocking Plus. Usually this takes 2–3 hours." /></div>
              </section>
            ) : !activePlan && (
              <section className="grid gap-5 lg:grid-cols-[0.82fr_1.18fr]">
                <FeatureCard title="Keep free" caption="Everything you need to get started" features={freeFeatures} tone="zinc" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {plans.map((plan) => <PlanCard key={plan.code} plan={plan} busy={busy === `create-${plan.code}`} onSelect={startPayment} />)}
                </div>
              </section>
            )}

            {!activePlan && !paymentRequest && <section className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15 text-violet-200"><Sparkles size={19} /></span><div><p className="font-semibold text-white">What Plus unlocks</p><div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">{plusFeatures.map((feature) => <p key={feature} className="flex items-start gap-2 text-sm leading-5 text-zinc-300"><Check size={15} className="mt-0.5 shrink-0 text-emerald-300" />{feature}</p>)}</div></div></div></section>}

            <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-white">FitSwap Plus payment history</h2><p className="mt-1 text-sm text-zinc-500">Only administrator-confirmed requests unlock paid access.</p></div><button type="button" onClick={loadBilling} className="text-xs font-semibold text-violet-300 hover:text-violet-200">Refresh</button></div><div className="mt-5 space-y-3">{history.length ? history.slice(0, 5).map((payment) => <div key={payment.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-black/15 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{payment.planCode === "PLUS_YEARLY" ? "FitSwap Plus Yearly" : "FitSwap Plus Monthly"}</p><p className="mt-1 text-xs text-zinc-500">{payment.paymentRef} · {displayDate(payment.createdAt)}</p></div><div className="flex items-center gap-3"><p className="font-semibold text-white">{currency(payment.amount)}</p><Status status={payment.status} /></div></div>) : <p className="rounded-xl border border-dashed border-white/[0.1] px-4 py-6 text-center text-sm text-zinc-500">No FitSwap Plus payments yet.</p>}</div></section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}

function FeatureCard({ title, caption, features, tone }) {
  return <article className={`rounded-3xl border p-6 ${tone === "zinc" ? "border-white/[0.08] bg-[#11121a]" : "border-violet-400/20 bg-violet-500/[0.05]"}`}><p className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">FitSwap membership</p><h2 className="mt-2 text-2xl font-bold text-white">{title}</h2><p className="mt-2 text-sm text-zinc-400">{caption}</p><div className="mt-6 space-y-3">{features.map((feature) => <p key={feature} className="flex items-start gap-2 text-sm leading-5 text-zinc-300"><Check size={16} className="mt-0.5 shrink-0 text-zinc-500" />{feature}</p>)}</div></article>;
}

function PlanCard({ plan, busy, onSelect }) {
  const yearly = plan.code === "PLUS_YEARLY";
  return <article className={`relative overflow-hidden rounded-3xl border p-5 ${yearly ? "border-amber-300/30 bg-[linear-gradient(145deg,rgba(202,138,4,.14),rgba(17,18,26,1)_55%)]" : "border-violet-400/20 bg-[#11121a]"}`}>{yearly && <span className="absolute right-0 top-0 rounded-bl-xl bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-[#261700]">Best value</span>}<p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-300">FitSwap Plus</p><h2 className="mt-3 text-xl font-bold text-white">{yearly ? "Yearly" : "Monthly"}</h2><p className="mt-2 text-3xl font-black tracking-tight text-white">{currency(plan.amount)}</p><p className="mt-1 text-xs text-zinc-500">{plan.benefitDays} days after admin confirmation</p><button type="button" disabled={busy} onClick={() => onSelect(plan.code)} className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition disabled:opacity-50 ${yearly ? "bg-amber-400 text-[#271701] hover:bg-amber-300" : "bg-violet-600 hover:bg-violet-500"}`}>{busy && <LoaderCircle size={15} className="animate-spin" />}{busy ? "Creating secure QR…" : "Continue to UPI"}</button></article>;
}

function Status({ status }) {
  const styles = { COMPLETED: "bg-emerald-500/10 text-emerald-300", BUYER_MARKED_PAID: "bg-amber-500/10 text-amber-300", AWAITING_PAYMENT: "bg-violet-500/10 text-violet-200", REJECTED: "bg-red-500/10 text-red-300", CANCELLED: "bg-zinc-500/10 text-zinc-300", EXPIRED: "bg-zinc-500/10 text-zinc-300" };
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] || styles.CANCELLED}`}>{String(status).replaceAll("_", " ")}</span>;
}

export default FitSwapPlusPage;
