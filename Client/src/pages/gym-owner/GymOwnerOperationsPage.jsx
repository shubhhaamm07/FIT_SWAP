import { Component, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  Check,
  CircleAlert,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  LocateFixed,
  Mail,
  Phone,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { RevenueByGymChart, RevenueTrendChart, SalesVolumeChart } from "../../components/gym-owner/OwnerRevenueCharts";
import { createMembershipPlan, getMyGyms, updateMembershipPlan, updateMyGym } from "../../api/gym.api";
import { getGymFraudAlerts, getGymOwnerMembers, getGymOwnerSales, getGymOwnerTransfers, getGymTransferAuditLogs } from "../../api/gym-owner.api";
import { approveUpiMarketplaceTransfer, confirmUpiPaymentReceived, getGymUpiApprovalRequests, getMyUpiPaymentRequests, rejectUpiPayment } from "../../api/upi-payment.api";
import { cancelPlatformPayment, createOwnerSubscriptionPayment, getMyPlatformBilling, markPlatformPaymentPaid } from "../../api/platform-billing.api";
import { approveCashTransferByGymOwner, getGymCashApprovalRequests, rejectCashTransferByGymOwner } from "../../api/transfer.api";
import UpiPaymentCheckout from "../../components/payments/UpiPaymentCheckout";
import FraudAlertList from "../../components/monitoring/FraudAlertList";
import TransferAuditLogList from "../../components/monitoring/TransferAuditLogList";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
};
const name = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Member";
const array = (value) => Array.isArray(value) ? value : [];

const sectionConfig = {
  gyms: { eyebrow: "Business setup", title: "My gyms", description: "Manage the gyms you own, their approval status, and their plans.", icon: Building2 },
  plans: { eyebrow: "Membership catalogue", title: "Membership plans", description: "Create plans your members can buy directly from your gyms.", icon: CreditCard },
  members: { eyebrow: "Member management", title: "Members", description: "See memberships held at your gyms and follow upcoming expiries.", icon: UsersRound },
  sales: { eyebrow: "Business performance", title: "Sales & revenue", description: "Review every membership sale recorded for your gyms.", icon: IndianRupee },
  transfers: { eyebrow: "Marketplace oversight", title: "Transfer oversight", description: "Monitor marketplace transfers involving memberships from your gyms.", icon: ArrowUpRight },
  audit: { eyebrow: "Marketplace governance", title: "Transfer audit trail", description: "Review policy decisions, requests, approvals, and completed handovers for your gyms.", icon: SlidersHorizontal },
  risk: { eyebrow: "Marketplace safety", title: "Risk alerts", description: "Review explainable alerts for unusual prices and suspicious transfer or payment activity.", icon: CircleAlert },
  billing: { eyebrow: "FitSwap for business", title: "Plans & billing", description: "Choose optional business tools that help your gyms get more visibility on FitSwap.", icon: WalletCards },
};

function GymOwnerOperationsPage() {
  const { section } = useParams();
  const config = sectionConfig[section];
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [editingGym, setEditingGym] = useState(null);
  const [savingGym, setSavingGym] = useState(false);
  const [message, setMessage] = useState("");
  const [updatingPaymentId, setUpdatingPaymentId] = useState("");

  const loadData = useCallback(async () => {
    if (!sectionConfig[section]) return;
    setLoading(true);
      setError("");
      try {
      if (section === "transfers") {
        const [legacyTransfers, upiApprovals, upiPayments, cashApprovals] = await Promise.all([getGymOwnerTransfers(), getGymUpiApprovalRequests(), getMyUpiPaymentRequests(), getGymCashApprovalRequests()]);
        setData({ legacyTransfers: array(legacyTransfers), upiApprovals: array(upiApprovals), cashApprovals: array(cashApprovals), directPayments: array(upiPayments?.incoming).filter((request) => request.kind === "GYM_MEMBERSHIP") });
        return;
      }
      if (section === "billing") {
        setData(await getMyPlatformBilling());
        return;
      }
      if (section === "audit") {
        setData(await getGymTransferAuditLogs());
        return;
      }
      if (section === "risk") {
        setData(await getGymFraudAlerts());
        return;
      }
      const request = section === "gyms" || section === "plans" ? getMyGyms : section === "members" ? getGymOwnerMembers : section === "sales" ? getGymOwnerSales : getGymOwnerTransfers;
      const response = await request();
      setData(section === "sales" ? response || {} : array(response));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load this owner section.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  // Most owner sections return a list, while Sales returns a reporting object.
  // Keep the shared page safe when navigating between those different response shapes.
  const gymsData = useMemo(() => array(data), [data]);
  const plans = useMemo(() => gymsData.flatMap((gym) => (gym.plans || []).map((plan) => ({ ...plan, gym }))), [gymsData]);

  if (!config) {
    return <Navigate to="/owner/dashboard" replace />;
  }

  const Icon = config.icon;
  const onPlanCreated = async (planData) => {
    try {
      setSavingPlan(true);
      await createMembershipPlan(planData.gymId, planData);
      setShowPlanForm(false);
      setMessage("Membership plan created successfully.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to create the plan.");
    } finally {
      setSavingPlan(false);
    }
  };
  const onPolicyUpdated = async (planId, policyData) => {
    try {
      setSavingPlan(true);
      await updateMembershipPlan(planId, policyData);
      setEditingPolicy(null);
      setMessage("Transfer policy updated successfully.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to update the transfer policy.");
    } finally {
      setSavingPlan(false);
    }
  };
  const onGymUpdated = async (gymData) => {
    try {
      setSavingGym(true);
      await updateMyGym(editingGym.id, gymData);
      setEditingGym(null);
      setMessage("Gym profile updated successfully.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to update the gym profile.");
    } finally {
      setSavingGym(false);
    }
  };
  const onApproveUpiTransfer = async (requestId) => {
    if (!window.confirm("Approve this handover only after the seller has confirmed the payment. This will move the membership to the buyer.")) return;
    try {
      setUpdatingPaymentId(requestId);
      await approveUpiMarketplaceTransfer(requestId);
      setMessage("UPI payment approved and membership transferred to the buyer.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to approve the UPI transfer.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onRejectUpiTransfer = async (requestId) => {
    const reason = window.prompt("Why are you rejecting this UPI handover?", "The transfer could not be approved.");
    if (reason === null) return;
    try {
      setUpdatingPaymentId(requestId);
      await rejectUpiPayment(requestId, reason);
      setMessage("UPI transfer rejected and the buyer was notified.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to reject the UPI transfer.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onConfirmDirectUpiPayment = async (requestId) => {
    if (!window.confirm("Confirm only after checking the exact amount and UTR in your real UPI or bank app. This will activate a new membership.")) return;
    try {
      setUpdatingPaymentId(requestId);
      await confirmUpiPaymentReceived(requestId);
      setMessage("UPI payment confirmed and the new membership is now active.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to confirm the UPI payment.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onApproveCashTransfer = async (requestId) => {
    if (!window.confirm("Approve this cash handover only after completing your gym’s required checks. This will move the membership to the buyer.")) return;
    try {
      setUpdatingPaymentId(requestId);
      await approveCashTransferByGymOwner(requestId);
      setMessage("Cash transfer approved and membership moved to the buyer.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to approve the cash transfer.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onRejectCashTransfer = async (requestId) => {
    if (!window.confirm("Reject this cash transfer request?")) return;
    try {
      setUpdatingPaymentId(requestId);
      await rejectCashTransferByGymOwner(requestId);
      setMessage("Cash transfer rejected and the buyer was notified.");
      await loadData();
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to reject the cash transfer.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onStartBusinessPlan = async (planCode) => {
    try {
      setUpdatingPaymentId(`plan-${planCode}`);
      const payment = await createOwnerSubscriptionPayment(planCode);
      setData((current) => ({ ...current, payments: [payment, ...(current?.payments || []).filter((item) => item.id !== payment.id)] }));
      setMessage("Your FitSwap Business UPI QR is ready. Pay the exact amount, then enter the UTR.");
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to create the FitSwap Business payment request.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onMarkBusinessPlanPaid = async (requestId, utr) => {
    try {
      setUpdatingPaymentId(requestId);
      const payment = await markPlatformPaymentPaid(requestId, utr);
      setData((current) => ({ ...current, payments: (current?.payments || []).map((item) => item.id === payment.id ? payment : item) }));
      setMessage("Your UTR was recorded. A FitSwap administrator will confirm it in the business account.");
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to record the UPI reference.");
    } finally {
      setUpdatingPaymentId("");
    }
  };
  const onCancelBusinessPlanPayment = async (requestId) => {
    try {
      setUpdatingPaymentId(requestId);
      await cancelPlatformPayment(requestId);
      await loadData();
      setMessage("FitSwap Business payment request cancelled.");
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to cancel the payment request.");
    } finally {
      setUpdatingPaymentId("");
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_88%_15%,rgba(168,85,247,.30),transparent_26%),radial-gradient(circle_at_68%_110%,rgba(14,165,233,.14),transparent_32%),#11121a] p-6 shadow-2xl shadow-violet-950/10 sm:p-8">
          <span className="pointer-events-none absolute -right-5 -top-7 h-32 w-32 rounded-full border border-violet-300/15" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">Owner workspace · {config.eyebrow}</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{config.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{config.description}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl border border-violet-400/15 bg-violet-500/12 text-violet-200 shadow-lg shadow-violet-950/30"><Icon size={23} /></span></div>
        </section>

        {message && <p className={`rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}>{message}</p>}
        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}<button type="button" onClick={loadData} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-red-200"><RefreshCw size={14} /> Retry</button></div>}
        {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-violet-400" size={20} /> Loading owner data…</div> : <OwnerContentBoundary resetKey={section}>{section === "gyms" ? <GymsContent gyms={gymsData} onEdit={setEditingGym} /> : section === "plans" ? <PlansContent gyms={gymsData} plans={plans} showPlanForm={showPlanForm} setShowPlanForm={setShowPlanForm} savingPlan={savingPlan} editingPolicy={editingPolicy} setEditingPolicy={setEditingPolicy} onPlanCreated={onPlanCreated} onPolicyUpdated={onPolicyUpdated} /> : section === "members" ? <MembersContent members={gymsData} /> : section === "sales" ? <SalesContent salesData={data} /> : section === "billing" ? <BillingContent billing={data} updatingPaymentId={updatingPaymentId} onStartPlan={onStartBusinessPlan} onMarkPaid={onMarkBusinessPlanPaid} onCancelPayment={onCancelBusinessPlanPayment} onRefresh={loadData} /> : section === "audit" ? <TransferAuditLogList logs={array(data)} emptyMessage="Policy and transfer actions for your gyms will appear here." /> : section === "risk" ? <FraudAlertList alerts={array(data)} emptyMessage="No risk indicators are flagged for your gyms." /> : <TransfersContent transfers={data?.legacyTransfers} approvals={data?.upiApprovals} cashApprovals={data?.cashApprovals} directPayments={data?.directPayments} updatingPaymentId={updatingPaymentId} onApproveUpiTransfer={onApproveUpiTransfer} onRejectUpiTransfer={onRejectUpiTransfer} onConfirmDirectUpiPayment={onConfirmDirectUpiPayment} onApproveCashTransfer={onApproveCashTransfer} onRejectCashTransfer={onRejectCashTransfer} />}</OwnerContentBoundary>}
        {editingGym && <GymProfileForm gym={editingGym} saving={savingGym} onCancel={() => setEditingGym(null)} onSubmit={onGymUpdated} />}
      </main>
    </DashboardLayout>
  );
}

class OwnerContentBoundary extends Component {
  state = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { hasError: false, resetKey: props.resetKey } : null;
  }

  render() {
    if (this.state.hasError) {
      return <Empty icon={CircleAlert} title="This section needs a refresh" description="The data for this page could not be displayed safely. Use the sidebar to reopen the section." />;
    }

    return this.props.children;
  }
}

function GymsContent({ gyms, onEdit }) {
  return gyms.length ? <div className="grid gap-5 md:grid-cols-2">{gyms.map((gym) => <article key={gym.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-300"><Building2 size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="truncate font-semibold text-white">{gym.name}</h2><Status value={gym.status} /></div><p className="mt-1 text-sm text-zinc-500">{gym.city}, {gym.state}</p><p className="mt-4 text-sm leading-6 text-zinc-400">{gym.description || "No description added yet."}</p><div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4"><span className="text-xs text-zinc-500">{gym.plans?.length || 0} membership plan{gym.plans?.length === 1 ? "" : "s"}</span><button type="button" onClick={() => onEdit(gym)} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/10"><Pencil size={14} /> Edit profile</button></div></div></div></article>)}</div> : <Empty icon={Building2} title="No gyms yet" description="Create a gym profile to start offering official memberships." />;
}

function GymProfileForm({ gym, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState({ name: gym.name || "", description: gym.description || "", address: gym.address || "", city: gym.city || "", state: gym.state || "", pincode: gym.pincode || "", phone: gym.phone || "", email: gym.email || "", latitude: gym.latitude ?? "", longitude: gym.longitude ?? "" });
  const [locating, setLocating] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      latitude: form.latitude === "" ? null : Number(form.latitude),
      longitude: form.longitude === "" ? null : Number(form.longitude),
    });
  };
  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationMessage("Location is not supported by this browser.");
      return;
    }
    setLocating(true);
    setLocationMessage("Finding this gym's coordinates…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) }));
        setLocationMessage("Coordinates added. Confirm that you are currently at the gym before saving.");
        setLocating(false);
      },
      () => {
        setLocationMessage("Location could not be detected. You can enter the coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };
  return <div role="dialog" aria-modal="true" aria-label="Edit gym profile" className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:p-8"><form onSubmit={submit} className="mx-auto my-6 max-w-3xl rounded-3xl border border-white/[0.1] bg-[#12131c] p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">Gym profile</p><h2 className="mt-2 text-2xl font-bold text-white">Edit {gym.name}</h2><p className="mt-2 text-sm text-zinc-500">Your details are visible to members. Approval status can only be changed by FitSwap admins.</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white"><X size={19} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Gym name"><input required value={form.name} onChange={(event) => update("name", event.target.value)} /></Field><Field label="Phone"><input required value={form.phone} onChange={(event) => update("phone", event.target.value)} /></Field><Field label="Email"><input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="optional" /></Field><Field label="Pincode"><input required value={form.pincode} onChange={(event) => update("pincode", event.target.value)} /></Field><Field label="Address"><input required value={form.address} onChange={(event) => update("address", event.target.value)} /></Field><Field label="City"><input required value={form.city} onChange={(event) => update("city", event.target.value)} /></Field><Field label="State"><input required value={form.state} onChange={(event) => update("state", event.target.value)} /></Field><label className="block text-sm font-medium text-zinc-200 sm:col-span-2"><span className="mb-2 block">Description</span><textarea rows="4" value={form.description} onChange={(event) => update("description", event.target.value)} className="w-full rounded-lg border border-white/[0.1] bg-[#11121a] px-3 py-2.5 text-white outline-none focus:border-violet-400" placeholder="Tell members about your gym" /></label><div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/[0.04] p-4 sm:col-span-2"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Nearby map location</p><p className="mt-1 text-xs leading-5 text-zinc-500">Add the exact gym coordinates so members can calculate distance and see the map pin.</p></div><button type="button" disabled={locating} onClick={useCurrentLocation} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-400/25 px-3 py-2.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/10 disabled:opacity-50"><LocateFixed size={15} /> {locating ? "Locating…" : "Use current location"}</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Latitude"><input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} placeholder="e.g. 30.733315" /></Field><Field label="Longitude"><input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} placeholder="e.g. 76.779419" /></Field></div>{locationMessage && <p aria-live="polite" className="mt-3 text-xs text-cyan-200/80">{locationMessage}</p>}</div></div><div className="mt-6 flex flex-wrap gap-3"><button disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50">{saving ? "Saving profile…" : "Save changes"}</button><button type="button" onClick={onCancel} className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.05]">Cancel</button></div></form></div>;
}

function PlansContent({ gyms, plans, showPlanForm, setShowPlanForm, savingPlan, editingPolicy, setEditingPolicy, onPlanCreated, onPolicyUpdated }) {
  return <div className="space-y-5">
    <div className="flex justify-end"><button type="button" disabled={!gyms.length} onClick={() => setShowPlanForm((current) => !current)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /> Add membership plan</button></div>
    {showPlanForm && <PlanForm gyms={gyms} saving={savingPlan} onCancel={() => setShowPlanForm(false)} onSubmit={onPlanCreated} />}
    {editingPolicy && <TransferPolicyForm plan={editingPolicy} saving={savingPlan} onCancel={() => setEditingPolicy(null)} onSubmit={(policy) => onPolicyUpdated(editingPolicy.id, policy)} />}
    {plans.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium text-violet-300">{plan.gym.name}</p><h2 className="mt-2 font-semibold text-white">{plan.name}</h2><p className="mt-1 text-sm text-zinc-500">{plan.durationInDays} days · {plan.transferable ? "Transferable" : "Not transferable"}</p></div><button type="button" onClick={() => setEditingPolicy(plan)} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/25 px-2.5 py-2 text-xs font-semibold text-violet-200 hover:bg-violet-500/10"><SlidersHorizontal size={14} /> Policy</button></div><p className="mt-5 text-2xl font-bold text-white">{currency(plan.price)}</p><div className="mt-3 space-y-1 text-xs text-zinc-400"><p>Min. remaining: {plan.minimumTransferDays ?? 30} days</p><p>Approval: {plan.requiresGymApproval === false ? "Seller-confirmed handover" : "Gym owner required"}</p><p>Methods: {[plan.allowOnlinePayment !== false && "UPI", plan.allowCashTransfer && "Cash"].filter(Boolean).join(" + ") || "None"}</p><p>Transfer fee: {plan.transferFee ? currency(plan.transferFee) : "Not set"}</p></div></article>)}</div> : <Empty icon={CreditCard} title="No membership plans" description="Create a plan so members can buy directly from your gym." />}
  </div>;
}

function PlanForm({ gyms, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState({ gymId: gyms[0]?.id || "", name: "", durationInDays: "30", price: "", transferFee: "", transferable: true, freezeAllowed: true, minimumTransferDays: "30", maximumTransfers: "", requiresGymApproval: true, allowOnlinePayment: true, allowCashTransfer: false });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, durationInDays: Number(form.durationInDays), price: Number(form.price), transferFee: form.transferFee ? Number(form.transferFee) : null, minimumTransferDays: Number(form.minimumTransferDays), maximumTransfers: form.maximumTransfers ? Number(form.maximumTransfers) : null }); };
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5 md:grid-cols-2"><Field label="Gym"><select required value={form.gymId} onChange={(event) => update("gymId", event.target.value)}>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select></Field><Field label="Plan name"><input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Monthly Membership" /></Field><Field label="Duration (days)"><input required min="1" type="number" value={form.durationInDays} onChange={(event) => update("durationInDays", event.target.value)} /></Field><Field label="Price (₹)"><input required min="1" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="4999" /></Field><Field label="Transfer fee (₹, optional)"><input min="0" type="number" value={form.transferFee} onChange={(event) => update("transferFee", event.target.value)} placeholder="199" /></Field><Field label="Minimum days remaining"><input required min="0" type="number" value={form.minimumTransferDays} onChange={(event) => update("minimumTransferDays", event.target.value)} /></Field><Field label="Maximum transfers (optional)"><input min="1" type="number" value={form.maximumTransfers} onChange={(event) => update("maximumTransfers", event.target.value)} placeholder="No limit" /></Field><TransferPolicySwitches form={form} update={update} /><div className="flex gap-3 md:col-span-2"><button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating…" : "Create plan"}</button><button type="button" onClick={onCancel} className="rounded-lg border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5">Cancel</button></div></form>;
}

function TransferPolicyForm({ plan, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState({ transferable: plan.transferable, freezeAllowed: plan.freezeAllowed, transferFee: plan.transferFee ?? "", minimumTransferDays: String(plan.minimumTransferDays ?? 30), maximumTransfers: plan.maximumTransfers ?? "", requiresGymApproval: plan.requiresGymApproval !== false, allowOnlinePayment: plan.allowOnlinePayment !== false, allowCashTransfer: Boolean(plan.allowCashTransfer) });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, transferFee: form.transferFee === "" ? null : Number(form.transferFee), minimumTransferDays: Number(form.minimumTransferDays), maximumTransfers: form.maximumTransfers === "" ? null : Number(form.maximumTransfers) }); };
  return <form onSubmit={submit} className="rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.05] p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">Dynamic transfer policy</p><h2 className="mt-2 text-lg font-bold text-white">{plan.name}</h2><p className="mt-1 text-sm text-zinc-400">Rules are applied before listing, payment, and final handover.</p></div><button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white"><X size={19} /></button></div><div className="mt-5 grid gap-4 md:grid-cols-2"><Field label="Transfer fee (₹, optional)"><input min="0" type="number" value={form.transferFee} onChange={(event) => update("transferFee", event.target.value)} /></Field><Field label="Minimum days remaining"><input required min="0" type="number" value={form.minimumTransferDays} onChange={(event) => update("minimumTransferDays", event.target.value)} /></Field><Field label="Maximum transfers (optional)"><input min="1" type="number" value={form.maximumTransfers} onChange={(event) => update("maximumTransfers", event.target.value)} placeholder="No limit" /></Field><TransferPolicySwitches form={form} update={update} /></div><div className="mt-5 flex gap-3"><button disabled={saving} className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving…" : "Save transfer policy"}</button><button type="button" onClick={onCancel} className="rounded-lg border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5">Cancel</button></div></form>;
}

function TransferPolicySwitches({ form, update }) { return <div className="space-y-3 rounded-xl border border-white/[0.08] bg-black/15 p-4 text-sm text-zinc-300 md:col-span-2"><p className="font-semibold text-white">Transfer controls</p><label className="flex items-center gap-2"><input checked={form.transferable} onChange={(event) => update("transferable", event.target.checked)} type="checkbox" /> Allow membership transfers</label><label className="flex items-center gap-2"><input checked={form.requiresGymApproval} onChange={(event) => update("requiresGymApproval", event.target.checked)} type="checkbox" /> Require gym-owner approval after payment</label><label className="flex items-center gap-2"><input checked={form.allowOnlinePayment} onChange={(event) => update("allowOnlinePayment", event.target.checked)} type="checkbox" /> Allow secure UPI handover</label><label className="flex items-center gap-2"><input checked={form.allowCashTransfer} onChange={(event) => update("allowCashTransfer", event.target.checked)} type="checkbox" /> Allow cash transfer requests</label><label className="flex items-center gap-2"><input checked={form.freezeAllowed} onChange={(event) => update("freezeAllowed", event.target.checked)} type="checkbox" /> Allow membership freeze</label></div>; }

function Field({ label, children }) { return <label className="block text-sm font-medium text-zinc-200"><span className="mb-2 block">{label}</span>{children && <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.1] [&_input]:bg-[#11121a] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-white [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.1] [&_select]:bg-[#11121a] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-white">{children}</div>}</label>; }

function MembersContent({ members }) {
  const memberList = useMemo(() => array(members).map((member) => ({ ...member, memberships: array(member.memberships) })), [members]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [gymId, setGymId] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState(null);
  const now = new Date();
  const expiringLimit = new Date(now);
  expiringLimit.setDate(expiringLimit.getDate() + 30);

  const gyms = useMemo(() => {
    const results = new Map();
    memberList.forEach((member) => member.memberships.forEach((membership) => {
      if (membership.plan?.gym?.id) results.set(membership.plan.gym.id, membership.plan.gym);
    }));
    return Array.from(results.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [memberList]);

  const getMemberState = (member) => {
    const active = member.memberships.some((membership) => membership.status === "ACTIVE" && new Date(membership.endDate) > now);
    if (active) return "ACTIVE";
    if (member.memberships.some((membership) => membership.status === "FROZEN")) return "FROZEN";
    if (member.memberships.some((membership) => membership.status === "EXPIRED")) return "EXPIRED";
    return member.memberships[0]?.status || "INACTIVE";
  };

  const membersExpiringSoon = memberList.filter((member) => member.memberships.some((membership) => membership.status === "ACTIVE" && new Date(membership.endDate) > now && new Date(membership.endDate) <= expiringLimit));
  const activeMembers = memberList.filter((member) => getMemberState(member) === "ACTIVE");
  const frozenMembers = memberList.filter((member) => getMemberState(member) === "FROZEN");
  const visibleMembers = memberList.filter((member) => {
    const text = `${member.firstName} ${member.lastName} ${member.email || ""} ${member.phone || ""} ${member.memberships.map((membership) => `${membership.plan?.gym?.name || ""} ${membership.plan?.name || ""}`).join(" ")}`.toLowerCase();
    const matchesSearch = text.includes(search.trim().toLowerCase());
    const matchesStatus = status === "ALL" || getMemberState(member) === status;
    const matchesGym = gymId === "ALL" || member.memberships.some((membership) => membership.plan?.gym?.id === gymId);
    return matchesSearch && matchesStatus && matchesGym;
  });

  if (!memberList.length) return <Empty icon={UsersRound} title="No members yet" description="Member records will appear here when people buy your plans." />;

  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MemberMetric label="Total members" value={memberList.length} note="Unique members across your gyms" icon={UsersRound} accent="violet" />
      <MemberMetric label="Active members" value={activeMembers.length} note="Currently valid memberships" icon={UsersRound} accent="emerald" />
      <MemberMetric label="Expiring soon" value={membersExpiringSoon.length} note="Ending within 30 days" icon={CalendarClock} accent="amber" />
      <MemberMetric label="Frozen members" value={frozenMembers.length} note="Memberships on hold" icon={CreditCard} accent="sky" />
    </section>

    <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member name, email, phone, gym, or plan" className="w-full rounded-xl border border-white/[0.1] bg-black/15 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></div><div className="flex flex-wrap items-center gap-2"><SlidersHorizontal size={16} className="text-zinc-500" /><select value={gymId} onChange={(event) => setGymId(event.target.value)} className="rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-400/60"><option value="ALL">All gyms</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-400/60"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="FROZEN">Frozen</option><option value="EXPIRED">Expired</option></select></div></div>
      <p className="mt-3 text-xs text-zinc-500">Showing {visibleMembers.length} of {memberList.length} members</p>
    </section>

    {visibleMembers.length ? <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Memberships</th><th className="px-5 py-4">Nearest expiry</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" /></tr></thead><tbody className="divide-y divide-white/[0.06]">{visibleMembers.map((member) => { const nearestExpiry = [...member.memberships].sort((first, second) => new Date(first.endDate) - new Date(second.endDate))[0]; return <tr key={member.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">{`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}</span><div><p className="font-medium text-white">{name(member)}</p><p className="mt-1 text-xs text-zinc-500">{member.email}</p></div></div></td><td className="px-5 py-4"><p className="font-medium text-zinc-200">{member.memberships.length} membership{member.memberships.length === 1 ? "" : "s"}</p><p className="mt-1 max-w-[220px] truncate text-xs text-zinc-500">{member.memberships.map((membership) => membership.plan?.gym?.name || "Gym").join(", ")}</p></td><td className="px-5 py-4 text-zinc-400">{nearestExpiry ? date(nearestExpiry.endDate) : "—"}</td><td className="px-5 py-4"><Status value={getMemberState(member)} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedMember(member)} className="rounded-lg border border-white/[0.1] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white">View</button></td></tr>; })}</tbody></table></div></section> : <Empty icon={Search} title="No members match these filters" description="Try another name, gym, or membership status." />}

    {selectedMember && <MemberDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />}
  </div>;
}

function MemberMetric({ label, value, note, icon: Icon, accent }) { const colors = { violet: "bg-violet-500/12 text-violet-300", emerald: "bg-emerald-500/12 text-emerald-300", amber: "bg-amber-500/12 text-amber-300", sky: "bg-sky-500/12 text-sky-300" }; return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p><p className="mt-1.5 text-xs text-zinc-500">{note}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[accent]}`}><Icon size={19} /></span></div></article>; }

function MemberDrawer({ member, onClose }) { return <div role="dialog" aria-modal="true" aria-label="Member details" className="fixed inset-0 z-50 flex items-end bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/[0.1] bg-[#12131c] shadow-2xl sm:rounded-3xl"><div className="sticky top-0 flex items-start justify-between border-b border-white/[0.08] bg-[#12131c]/95 p-5 backdrop-blur sm:p-6"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 font-bold text-white">{`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}</span><div><h2 className="text-lg font-semibold text-white">{name(member)}</h2><p className="mt-1 text-sm text-zinc-500">Member profile</p></div></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white"><X size={19} /></button></div><div className="p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-2"><InfoCard icon={Mail} label="Email" value={member.email || "Not provided"} /><InfoCard icon={Phone} label="Phone" value={member.phone || "Not provided"} /></div><div className="mt-6"><div className="flex items-center justify-between"><h3 className="font-semibold text-white">Membership history</h3><span className="text-xs text-zinc-500">{member.memberships.length} record{member.memberships.length === 1 ? "" : "s"}</span></div><div className="mt-3 space-y-3">{member.memberships.map((membership) => <div key={membership.id} className="rounded-xl border border-white/[0.08] bg-black/15 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-white">{membership.plan?.gym?.name || "Gym membership"}</p><p className="mt-1 text-sm text-zinc-400">{membership.plan?.name || "Membership plan"} · {membership.plan?.durationInDays || "—"} days</p></div><Status value={membership.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-3 text-xs"><div><p className="text-zinc-500">Started</p><p className="mt-1 font-medium text-zinc-300">{date(membership.startDate)}</p></div><div><p className="text-zinc-500">Expires</p><p className="mt-1 font-medium text-zinc-300">{date(membership.endDate)}</p></div></div></div>)}</div></div></div></div></div>; }

function InfoCard({ icon: Icon, label, value }) { return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3"><Icon size={17} className="shrink-0 text-violet-300" /><div className="min-w-0"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 truncate text-sm text-zinc-200">{value}</p></div></div>; }

function SalesContent({ salesData }) {
  const [search, setSearch] = useState("");
  const [gymId, setGymId] = useState("ALL");
  const report = salesData && !Array.isArray(salesData) ? salesData : {};
  const summaryDefaults = {
    totalRevenue: 0,
    totalSales: 0,
    currentMonthRevenue: 0,
    currentMonthSales: 0,
    monthlyGrowth: 0,
    averageSaleValue: 0,
  };
  const {
    revenueTrend: rawRevenueTrend,
    revenueByGym: rawRevenueByGym,
    sales: rawSales,
  } = report;
  const summary = { ...summaryDefaults, ...(report.summary && typeof report.summary === "object" ? report.summary : {}) };
  const revenueTrend = array(rawRevenueTrend);
  const revenueByGym = array(rawRevenueByGym);
  const sales = array(rawSales);

  const gyms = useMemo(() => {
    const results = new Map();
    sales.forEach((sale) => {
      if (sale.plan?.gym?.id) results.set(sale.plan.gym.id, sale.plan.gym);
    });
    return Array.from(results.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [sales]);

  const visibleSales = sales.filter((sale) => {
    const text = `${sale.member?.firstName || ""} ${sale.member?.lastName || ""} ${sale.member?.email || ""} ${sale.plan?.gym?.name || ""} ${sale.plan?.name || ""}`.toLowerCase();
    const matchesSearch = text.includes(search.trim().toLowerCase());
    const matchesGym = gymId === "ALL" || sale.plan?.gym?.id === gymId;
    return matchesSearch && matchesGym;
  });

  const growthPositive = summary.monthlyGrowth >= 0;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MemberMetric label="Total revenue" value={currency(summary.totalRevenue)} note={`${summary.totalSales} membership sale${summary.totalSales === 1 ? "" : "s"} recorded`} icon={IndianRupee} accent="emerald" />
        <MemberMetric label="This month" value={currency(summary.currentMonthRevenue)} note={`${summary.currentMonthSales} sale${summary.currentMonthSales === 1 ? "" : "s"} in current month`} icon={CreditCard} accent="violet" />
        <MemberMetric label="Average sale" value={currency(summary.averageSaleValue)} note="Mean value per membership sold" icon={IndianRupee} accent="sky" />
        <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">Monthly growth</p>
              <p className={`mt-2 text-2xl font-bold ${growthPositive ? "text-emerald-300" : "text-red-300"}`}>
                {growthPositive ? "+" : ""}{summary.monthlyGrowth}%
              </p>
              <p className="mt-1.5 text-xs text-zinc-500">Compared to last month</p>
            </div>
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${growthPositive ? "bg-emerald-500/12 text-emerald-300" : "bg-red-500/12 text-red-300"}`}>
              {growthPositive ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
            </span>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.85fr)]">
        <RevenueTrendChart trend={revenueTrend} />
        <SalesVolumeChart trend={revenueTrend} />
      </section>

      <RevenueByGymChart revenueByGym={revenueByGym} />

      <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search member, gym, or plan"
              className="w-full rounded-xl border border-white/[0.1] bg-black/15 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal size={16} className="text-zinc-500" />
            <select value={gymId} onChange={(event) => setGymId(event.target.value)} className="rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-400/60">
              <option value="ALL">All gyms</option>
              {gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">Showing {visibleSales.length} of {sales.length} sales</p>
      </section>

      {visibleSales.length ? (
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-4">Member</th>
                  <th className="px-5 py-4">Gym & plan</th>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {visibleSales.map((sale) => (
                  <tr key={sale.id} className="transition hover:bg-white/[0.025]">
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{name(sale.member)}</p>
                      <p className="mt-1 text-xs text-zinc-500">{sale.member?.email || "—"}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-200">{sale.plan?.gym?.name || "Gym membership"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{sale.plan?.name || "Membership plan"}</p>
                    </td>
                    <td className="px-5 py-4 text-zinc-400">{date(sale.createdAt)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-emerald-300">{currency(sale.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : sales.length ? (
        <Empty icon={Search} title="No sales match these filters" description="Try another member name, gym, or plan." />
      ) : (
        <Empty icon={IndianRupee} title="No sales yet" description="Membership revenue appears here as members join your plans." />
      )}
    </div>
  );
}

function BillingContent({ billing, updatingPaymentId, onStartPlan, onMarkPaid, onCancelPayment, onRefresh }) {
  const payments = array(billing?.payments);
  const offers = array(billing?.offers).filter((offer) => offer.kind === "OWNER_SUBSCRIPTION");
  const activeSubscription = billing?.activeSubscription;
  const pendingPayment = payments.find((payment) => payment.kind === "OWNER_SUBSCRIPTION" && ["AWAITING_PAYMENT", "BUYER_MARKED_PAID"].includes(payment.status));
  const pendingPaymentId = pendingPayment?.id;
  const pendingPaymentStatus = pendingPayment?.status;

  useEffect(() => {
    if (!pendingPaymentId || ["COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(pendingPaymentStatus)) return undefined;
    const timer = window.setInterval(() => { void onRefresh(); }, 20000);
    return () => window.clearInterval(timer);
  }, [pendingPaymentId, pendingPaymentStatus, onRefresh]);

  return <div className="space-y-6">
    <section className="overflow-hidden rounded-2xl border border-violet-400/20 bg-[radial-gradient(circle_at_90%_18%,rgba(168,85,247,.20),transparent_28%),#11121a] p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">Optional FitSwap Business plan</p><h2 className="mt-2 text-2xl font-bold text-white">Grow on FitSwap without sharing your member payments.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Business plans are paid to FitSwap&apos;s own UPI, separately from direct gym and marketplace payments. Membership money always stays between the buyer and the gym or seller.</p></div><WalletCards className="shrink-0 text-violet-300" size={30} /></div>{activeSubscription ? <div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-4"><p className="text-sm font-semibold text-emerald-100">Business plan active</p><p className="mt-1 text-sm text-emerald-100/70">{activeSubscription.planCode.replaceAll("_", " ")} · active until {date(activeSubscription.benefitExpiresAt)}</p></div> : <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-500/[0.05] p-4 text-sm leading-6 text-amber-100/75">You can keep using FitSwap without a paid plan. Business plans are optional and are for future promotional tools, priority support, and owner-facing visibility features.</div>}</section>

    {pendingPayment ? <section><div className="mb-3"><h2 className="font-semibold text-white">Complete your Business payment</h2><p className="mt-1 text-sm text-zinc-500">Pay only to the FitSwap Business UPI shown below, then submit the UTR for an admin to verify.</p></div><UpiPaymentCheckout request={pendingPayment} busy={updatingPaymentId === pendingPayment.id} onMarkPaid={(utr) => onMarkPaid(pendingPayment.id, utr)} onCancel={pendingPayment.status === "AWAITING_PAYMENT" ? () => onCancelPayment(pendingPayment.id) : undefined} verificationNotice="FitSwap cannot verify your bank balance automatically. A FitSwap administrator checks the business UPI/bank account and confirms your plan after the exact payment and UTR are found." /></section> : <section className="grid gap-4 md:grid-cols-2">{offers.map((offer) => <article key={offer.code} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">FitSwap Business</p><h2 className="mt-2 text-xl font-bold text-white">{offer.code === "OWNER_YEARLY" ? "Yearly" : "Monthly"}</h2><p className="mt-2 text-sm leading-6 text-zinc-400">{offer.code === "OWNER_YEARLY" ? "A full year of optional business tools with one payment." : "A flexible monthly option for gym owners."}</p><p className="mt-5 text-3xl font-bold text-white">{currency(Number(offer.amount || 0) / 100)}</p><p className="mt-1 text-xs text-zinc-500">{offer.benefitDays} days of access after confirmation</p><button type="button" disabled={Boolean(updatingPaymentId)} onClick={() => onStartPlan(offer.code)} className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50">{updatingPaymentId === `plan-${offer.code}` ? "Generating UPI QR…" : `Choose ${offer.code === "OWNER_YEARLY" ? "yearly" : "monthly"}`}</button></article>)}</section>}

    <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><h2 className="font-semibold text-white">Billing history</h2><p className="mt-1 text-sm text-zinc-500">A record of FitSwap feature payments—never member membership payments.</p><div className="mt-5 space-y-3">{payments.length ? payments.filter((payment) => payment.kind === "OWNER_SUBSCRIPTION").map((payment) => <div key={payment.id} className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium text-white">{payment.planCode.replaceAll("_", " ")}</p><p className="mt-1 text-xs text-zinc-500">{payment.paymentRef} · {date(payment.createdAt)}</p></div><div className="flex items-center gap-3"><p className="font-semibold text-white">{currency(Number(payment.amount || 0) / 100)}</p><Status value={payment.status} /></div></div>) : <p className="py-4 text-sm text-zinc-500">No FitSwap Business payments yet.</p>}</div></section>
  </div>;
}

function TransfersContent({ transfers, approvals, cashApprovals, directPayments, updatingPaymentId, onApproveUpiTransfer, onRejectUpiTransfer, onConfirmDirectUpiPayment, onApproveCashTransfer, onRejectCashTransfer }) {
  const transferList = array(transfers);
  const approvalList = array(approvals);
  const cashApprovalList = array(cashApprovals);
  const directPaymentList = array(directPayments);

  return <div className="space-y-6">
    <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Direct membership sales</p><h2 className="mt-2 text-xl font-bold text-white">UPI payments to verify</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Check the payer, exact amount, and UTR in your real UPI/bank app. Confirming here creates the membership only after your bank-side check.</p></div><span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1.5 text-sm font-bold text-amber-100">{directPaymentList.filter((request) => request.status === "BUYER_MARKED_PAID").length} to review</span></div>{directPaymentList.filter((request) => request.status === "BUYER_MARKED_PAID").length ? <div className="mt-5 grid gap-4">{directPaymentList.filter((request) => request.status === "BUYER_MARKED_PAID").map((request) => <article key={request.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{request.gym?.name || "Gym"}</h3><span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-200">BUYER MARKED PAID</span></div><p className="mt-1 text-sm text-zinc-400">{request.plan?.name || "Membership plan"} · {currency(Number(request.amount || 0) / 100)}</p><p className="mt-3 text-xs text-zinc-500">Buyer: {name(request.buyer)} · UTR: <span className="font-semibold text-zinc-300">{request.utr || "—"}</span></p><p className="mt-1 text-xs text-zinc-500">Reference: {request.paymentRef}</p></div><div className="flex shrink-0 gap-2"><button type="button" disabled={updatingPaymentId === request.id} onClick={() => onConfirmDirectUpiPayment(request.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> Confirm payment</button><button type="button" disabled={updatingPaymentId === request.id} onClick={() => onRejectUpiTransfer(request.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div></div></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-black/10 p-5 text-sm text-zinc-500">No direct gym payments need your confirmation right now.</div>}</section>
    <section className="rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">Secure UPI workflow</p><h2 className="mt-2 text-xl font-bold text-white">Gym approval queue</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Approve only after the seller has already checked the UTR and confirmed receipt. Approval moves the membership to the buyer and closes the listing.</p></div><span className="rounded-full border border-violet-300/20 bg-violet-500/10 px-3 py-1.5 text-sm font-bold text-violet-100">{approvalList.length} waiting</span></div>{approvalList.length ? <div className="mt-5 grid gap-4">{approvalList.map((request) => <article key={request.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{request.listing?.membership?.plan?.gym?.name || request.gym?.name || "Gym membership"}</h3><span className="rounded-full bg-sky-500/15 px-2 py-1 text-[10px] font-bold text-sky-200">SELLER CONFIRMED</span></div><p className="mt-1 text-sm text-zinc-400">{request.listing?.membership?.plan?.name || request.plan?.name || "Membership plan"} · {currency(Number(request.amount || 0) / 100)}</p><p className="mt-3 text-xs text-zinc-500">Seller: {name(request.recipient)} · Buyer: {name(request.buyer)} · UTR: <span className="font-semibold text-zinc-300">{request.utr || "—"}</span></p><p className="mt-1 text-xs text-zinc-500">Reference: {request.paymentRef} · Seller confirmed {date(request.recipientConfirmedAt)}</p></div><div className="flex shrink-0 gap-2"><button type="button" disabled={updatingPaymentId === request.id} onClick={() => onApproveUpiTransfer(request.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> Approve transfer</button><button type="button" disabled={updatingPaymentId === request.id} onClick={() => onRejectUpiTransfer(request.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div></div></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-black/10 p-5 text-sm text-zinc-500">No UPI transfers need gym approval right now.</div>}</section>
    <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.05] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Cash workflow</p><h2 className="mt-2 text-xl font-bold text-white">Cash handover queue</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Approve only after your gym’s cash-payment checks are complete. Approval moves the membership to the buyer and closes the listing.</p></div><span className="rounded-full border border-amber-300/20 bg-amber-500/10 px-3 py-1.5 text-sm font-bold text-amber-100">{cashApprovalList.length} waiting</span></div>{cashApprovalList.length ? <div className="mt-5 grid gap-4">{cashApprovalList.map((request) => <article key={request.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{request.listing?.membership?.plan?.gym?.name || "Gym membership"}</h3><span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-200">SELLER CONFIRMED CASH</span></div><p className="mt-1 text-sm text-zinc-400">{request.listing?.membership?.plan?.name || "Membership plan"} · {currency(request.listing?.askingPrice)}</p><p className="mt-3 text-xs text-zinc-500">Seller: {name(request.listing?.seller)} · Buyer: {name(request.buyer)} · Requested {date(request.createdAt)}</p></div><div className="flex shrink-0 gap-2"><button type="button" disabled={updatingPaymentId === request.id} onClick={() => onApproveCashTransfer(request.id)} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> Approve handover</button><button type="button" disabled={updatingPaymentId === request.id} onClick={() => onRejectCashTransfer(request.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div></div></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-white/[0.1] bg-black/10 p-5 text-sm text-zinc-500">No cash transfers need gym approval right now.</div>}</section>
    {transferList.length ? <section><div className="mb-3"><h2 className="font-semibold text-white">Transfer history</h2><p className="mt-1 text-sm text-zinc-500">Marketplace transfers involving plans from your gyms.</p></div><div className="grid gap-4">{transferList.map((transfer) => <article key={transfer.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{transfer.listing?.membership?.plan?.gym?.name || "Gym membership"}</h2><Status value={transfer.status} /></div><p className="mt-1 text-sm text-zinc-400">{transfer.listing?.membership?.plan?.name || "Membership plan"} · {currency(transfer.listing?.askingPrice)}</p><p className="mt-3 text-xs text-zinc-500">Seller: {name(transfer.listing?.seller)} · Buyer: {name(transfer.buyer)} · Requested {date(transfer.createdAt)}</p></div><span className="flex items-center gap-2 text-xs text-zinc-500"><CalendarClock size={15} /> Listing: {transfer.listing?.status || "—"}</span></div></article>)}</div></section> : approvalList.length || cashApprovalList.length ? null : <Empty icon={ArrowUpRight} title="No transfer activity" description="Marketplace transfers involving plans from your gyms will appear here." />}
  </div>;
}

function Status({ value }) { const style = ["ACTIVE", "APPROVED", "SOLD", "COMPLETED"].includes(value) ? "bg-emerald-500/10 text-emerald-300" : ["PENDING", "BUYER_MARKED_PAID", "AWAITING_PAYMENT", "AWAITING_GYM_APPROVAL"].includes(value) ? "bg-amber-500/10 text-amber-300" : ["EXPIRED", "REJECTED", "CANCELLED"].includes(value) ? "bg-red-500/10 text-red-300" : "bg-zinc-500/15 text-zinc-300"; return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${style}`}>{String(value || "UNKNOWN").replaceAll("_", " ")}</span>; }
function Empty({ icon: Icon, title, description }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-[#11121a] p-8 text-center"><Icon size={34} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p></div>; }

export default GymOwnerOperationsPage;
