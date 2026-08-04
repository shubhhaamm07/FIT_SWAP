import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  CalendarClock,
  CircleAlert,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { createMembershipPlan, getMyGyms } from "../../api/gym.api";
import { getGymOwnerMembers, getGymOwnerSales, getGymOwnerTransfers } from "../../api/gym-owner.api";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
const name = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "Member";

const sectionConfig = {
  gyms: { eyebrow: "Business setup", title: "My gyms", description: "Manage the gyms you own, their approval status, and their plans.", icon: Building2 },
  plans: { eyebrow: "Membership catalogue", title: "Membership plans", description: "Create plans your members can buy directly from your gyms.", icon: CreditCard },
  members: { eyebrow: "Member management", title: "Members", description: "See memberships held at your gyms and follow upcoming expiries.", icon: UsersRound },
  sales: { eyebrow: "Business performance", title: "Sales & revenue", description: "Review every membership sale recorded for your gyms.", icon: IndianRupee },
  transfers: { eyebrow: "Marketplace oversight", title: "Transfer oversight", description: "Monitor marketplace transfers involving memberships from your gyms.", icon: ArrowUpRight },
};

function GymOwnerOperationsPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const config = sectionConfig[section];
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    if (!sectionConfig[section]) return;
    setLoading(true);
    setError("");
    try {
      const request = section === "gyms" || section === "plans" ? getMyGyms : section === "members" ? getGymOwnerMembers : section === "sales" ? getGymOwnerSales : getGymOwnerTransfers;
      setData(await request());
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

  const plans = useMemo(() => data.flatMap((gym) => (gym.plans || []).map((plan) => ({ ...plan, gym }))), [data]);

  if (!config) {
    navigate("/owner/dashboard", { replace: true });
    return null;
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

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-[radial-gradient(circle_at_82%_15%,rgba(139,92,246,.26),transparent_29%),#11121a] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-violet-300">{config.eyebrow}</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">{config.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{config.description}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/12 text-violet-300"><Icon size={23} /></span></div>
        </section>

        {message && <p className={`rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}>{message}</p>}
        {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}<button type="button" onClick={loadData} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-red-200"><RefreshCw size={14} /> Retry</button></div>}
        {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-violet-400" size={20} /> Loading owner data…</div> : section === "gyms" ? <GymsContent gyms={data} /> : section === "plans" ? <PlansContent gyms={data} plans={plans} showPlanForm={showPlanForm} setShowPlanForm={setShowPlanForm} savingPlan={savingPlan} onPlanCreated={onPlanCreated} /> : section === "members" ? <MembersContent memberships={data} /> : section === "sales" ? <SalesContent sales={data} /> : <TransfersContent transfers={data} />}
      </main>
    </DashboardLayout>
  );
}

function GymsContent({ gyms }) {
  return gyms.length ? <div className="grid gap-5 md:grid-cols-2">{gyms.map((gym) => <article key={gym.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-300"><Building2 size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="truncate font-semibold text-white">{gym.name}</h2><Status value={gym.status} /></div><p className="mt-1 text-sm text-zinc-500">{gym.city}, {gym.state}</p><p className="mt-4 text-sm leading-6 text-zinc-400">{gym.description || "No description added yet."}</p><div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4"><span className="text-xs text-zinc-500">{gym.plans?.length || 0} membership plan{gym.plans?.length === 1 ? "" : "s"}</span><span className="text-xs text-zinc-500">Created {date(gym.createdAt)}</span></div></div></div></article>)}</div> : <Empty icon={Building2} title="No gyms yet" description="Create a gym profile to start offering official memberships." />;
}

function PlansContent({ gyms, plans, showPlanForm, setShowPlanForm, savingPlan, onPlanCreated }) {
  return <div className="space-y-5"><div className="flex justify-end"><button type="button" disabled={!gyms.length} onClick={() => setShowPlanForm((current) => !current)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"><Plus size={17} /> Add membership plan</button></div>{showPlanForm && <PlanForm gyms={gyms} saving={savingPlan} onCancel={() => setShowPlanForm(false)} onSubmit={onPlanCreated} />}{plans.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <article key={plan.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><p className="text-xs font-medium text-violet-300">{plan.gym.name}</p><h2 className="mt-2 font-semibold text-white">{plan.name}</h2><p className="mt-1 text-sm text-zinc-500">{plan.durationInDays} days · {plan.transferable ? "Transferable" : "Not transferable"}</p><p className="mt-5 text-2xl font-bold text-white">{currency(plan.price)}</p><p className="mt-1 text-xs text-zinc-500">Transfer fee: {plan.transferFee ? currency(plan.transferFee) : "Not set"}</p></article>)}</div> : <Empty icon={CreditCard} title="No membership plans" description="Create a plan so members can buy directly from your gym." />}</div>;
}

function PlanForm({ gyms, saving, onCancel, onSubmit }) {
  const [form, setForm] = useState({ gymId: gyms[0]?.id || "", name: "", durationInDays: "30", price: "", transferFee: "", transferable: true, freezeAllowed: true });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => { event.preventDefault(); onSubmit({ ...form, durationInDays: Number(form.durationInDays), price: Number(form.price), transferFee: form.transferFee ? Number(form.transferFee) : null }); };
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-5 md:grid-cols-2"><Field label="Gym"><select required value={form.gymId} onChange={(event) => update("gymId", event.target.value)}>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select></Field><Field label="Plan name"><input required value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Monthly Membership" /></Field><Field label="Duration (days)"><input required min="1" type="number" value={form.durationInDays} onChange={(event) => update("durationInDays", event.target.value)} /></Field><Field label="Price (₹)"><input required min="1" type="number" value={form.price} onChange={(event) => update("price", event.target.value)} placeholder="4999" /></Field><Field label="Transfer fee (₹, optional)"><input min="0" type="number" value={form.transferFee} onChange={(event) => update("transferFee", event.target.value)} placeholder="199" /></Field><div className="flex flex-wrap items-center gap-4 pt-6 text-sm text-zinc-300"><label className="flex items-center gap-2"><input checked={form.transferable} onChange={(event) => update("transferable", event.target.checked)} type="checkbox" /> Transferable</label><label className="flex items-center gap-2"><input checked={form.freezeAllowed} onChange={(event) => update("freezeAllowed", event.target.checked)} type="checkbox" /> Freeze allowed</label></div><div className="flex gap-3 md:col-span-2"><button disabled={saving} className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Creating…" : "Create plan"}</button><button type="button" onClick={onCancel} className="rounded-lg border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/5">Cancel</button></div></form>;
}

function Field({ label, children }) { return <label className="block text-sm font-medium text-zinc-200"><span className="mb-2 block">{label}</span>{children && <div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-white/[0.1] [&_input]:bg-[#11121a] [&_input]:px-3 [&_input]:py-2.5 [&_input]:text-white [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/[0.1] [&_select]:bg-[#11121a] [&_select]:px-3 [&_select]:py-2.5 [&_select]:text-white">{children}</div>}</label>; }

function MembersContent({ memberships }) { return memberships.length ? <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Gym & plan</th><th className="px-5 py-4">Expires</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{memberships.map((membership) => <tr key={membership.id}><td className="px-5 py-4"><p className="font-medium text-white">{name(membership.member)}</p><p className="mt-1 text-xs text-zinc-500">{membership.member.email}</p></td><td className="px-5 py-4 text-zinc-300"><p>{membership.plan.gym.name}</p><p className="mt-1 text-xs text-zinc-500">{membership.plan.name}</p></td><td className="px-5 py-4 text-zinc-400">{date(membership.endDate)}</td><td className="px-5 py-4"><Status value={membership.status} /></td></tr>)}</tbody></table></div></div> : <Empty icon={UsersRound} title="No members yet" description="Member records will appear here when people buy your plans." />; }

function SalesContent({ sales }) { const total = sales.reduce((sum, sale) => sum + Number(sale.amount), 0); return <div className="space-y-5"><div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5"><p className="text-sm text-emerald-200">Recorded membership revenue</p><p className="mt-2 text-3xl font-bold text-white">{currency(total)}</p><p className="mt-1 text-sm text-zinc-400">Across {sales.length} membership sale{sales.length === 1 ? "" : "s"}</p></div>{sales.length ? <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="divide-y divide-white/[0.06]">{sales.map((sale) => <div key={sale.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="truncate font-medium text-white">{name(sale.member)}</p><p className="mt-1 truncate text-xs text-zinc-500">{sale.plan.gym.name} · {sale.plan.name} · {date(sale.createdAt)}</p></div><p className="shrink-0 font-semibold text-emerald-300">{currency(sale.amount)}</p></div>)}</div></div> : <Empty icon={IndianRupee} title="No sales yet" description="Membership revenue appears here as members join your plans." />}</div>; }

function TransfersContent({ transfers }) { return transfers.length ? <div className="grid gap-4">{transfers.map((transfer) => <article key={transfer.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{transfer.listing.membership.plan.gym.name}</h2><Status value={transfer.status} /></div><p className="mt-1 text-sm text-zinc-400">{transfer.listing.membership.plan.name} · {currency(transfer.listing.askingPrice)}</p><p className="mt-3 text-xs text-zinc-500">Seller: {name(transfer.listing.seller)} · Buyer: {name(transfer.buyer)} · Requested {date(transfer.createdAt)}</p></div><span className="flex items-center gap-2 text-xs text-zinc-500"><CalendarClock size={15} /> Listing: {transfer.listing.status}</span></div></article>)}</div> : <Empty icon={ArrowUpRight} title="No transfer activity" description="Marketplace transfers involving plans from your gyms will appear here." />; }

function Status({ value }) { const style = value === "ACTIVE" || value === "APPROVED" || value === "SOLD" ? "bg-emerald-500/10 text-emerald-300" : value === "PENDING" ? "bg-amber-500/10 text-amber-300" : value === "EXPIRED" || value === "REJECTED" ? "bg-red-500/10 text-red-300" : "bg-zinc-500/15 text-zinc-300"; return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${style}`}>{value}</span>; }
function Empty({ icon: Icon, title, description }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-[#11121a] p-8 text-center"><Icon size={34} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p></div>; }

export default GymOwnerOperationsPage;
