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
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { RevenueByGymChart, RevenueTrendChart, SalesVolumeChart } from "../../components/gym-owner/OwnerRevenueCharts";
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
        {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-violet-400" size={20} /> Loading owner data…</div> : section === "gyms" ? <GymsContent gyms={data} /> : section === "plans" ? <PlansContent gyms={data} plans={plans} showPlanForm={showPlanForm} setShowPlanForm={setShowPlanForm} savingPlan={savingPlan} onPlanCreated={onPlanCreated} /> : section === "members" ? <MembersContent members={data} /> : section === "sales" ? <SalesContent salesData={data} /> : <TransfersContent transfers={data} />}
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

function MembersContent({ members }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [gymId, setGymId] = useState("ALL");
  const [selectedMember, setSelectedMember] = useState(null);
  const now = new Date();
  const expiringLimit = new Date(now);
  expiringLimit.setDate(expiringLimit.getDate() + 30);

  const gyms = useMemo(() => {
    const results = new Map();
    members.forEach((member) => member.memberships.forEach((membership) => results.set(membership.plan.gym.id, membership.plan.gym)));
    return Array.from(results.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [members]);

  const getMemberState = (member) => {
    const active = member.memberships.some((membership) => membership.status === "ACTIVE" && new Date(membership.endDate) > now);
    if (active) return "ACTIVE";
    if (member.memberships.some((membership) => membership.status === "FROZEN")) return "FROZEN";
    if (member.memberships.some((membership) => membership.status === "EXPIRED")) return "EXPIRED";
    return member.memberships[0]?.status || "INACTIVE";
  };

  const membersExpiringSoon = members.filter((member) => member.memberships.some((membership) => membership.status === "ACTIVE" && new Date(membership.endDate) > now && new Date(membership.endDate) <= expiringLimit));
  const activeMembers = members.filter((member) => getMemberState(member) === "ACTIVE");
  const frozenMembers = members.filter((member) => getMemberState(member) === "FROZEN");
  const visibleMembers = members.filter((member) => {
    const text = `${member.firstName} ${member.lastName} ${member.email || ""} ${member.phone || ""} ${member.memberships.map((membership) => `${membership.plan.gym.name} ${membership.plan.name}`).join(" ")}`.toLowerCase();
    const matchesSearch = text.includes(search.trim().toLowerCase());
    const matchesStatus = status === "ALL" || getMemberState(member) === status;
    const matchesGym = gymId === "ALL" || member.memberships.some((membership) => membership.plan.gym.id === gymId);
    return matchesSearch && matchesStatus && matchesGym;
  });

  if (!members.length) return <Empty icon={UsersRound} title="No members yet" description="Member records will appear here when people buy your plans." />;

  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MemberMetric label="Total members" value={members.length} note="Unique members across your gyms" icon={UsersRound} accent="violet" />
      <MemberMetric label="Active members" value={activeMembers.length} note="Currently valid memberships" icon={UsersRound} accent="emerald" />
      <MemberMetric label="Expiring soon" value={membersExpiringSoon.length} note="Ending within 30 days" icon={CalendarClock} accent="amber" />
      <MemberMetric label="Frozen members" value={frozenMembers.length} note="Memberships on hold" icon={CreditCard} accent="sky" />
    </section>

    <section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="relative min-w-0 flex-1"><Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member name, email, phone, gym, or plan" className="w-full rounded-xl border border-white/[0.1] bg-black/15 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></div><div className="flex flex-wrap items-center gap-2"><SlidersHorizontal size={16} className="text-zinc-500" /><select value={gymId} onChange={(event) => setGymId(event.target.value)} className="rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-400/60"><option value="ALL">All gyms</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-zinc-300 outline-none focus:border-violet-400/60"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="FROZEN">Frozen</option><option value="EXPIRED">Expired</option></select></div></div>
      <p className="mt-3 text-xs text-zinc-500">Showing {visibleMembers.length} of {members.length} members</p>
    </section>

    {visibleMembers.length ? <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-4">Member</th><th className="px-5 py-4">Memberships</th><th className="px-5 py-4">Nearest expiry</th><th className="px-5 py-4">Status</th><th className="px-5 py-4" /></tr></thead><tbody className="divide-y divide-white/[0.06]">{visibleMembers.map((member) => { const nearestExpiry = [...member.memberships].sort((first, second) => new Date(first.endDate) - new Date(second.endDate))[0]; return <tr key={member.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">{`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}</span><div><p className="font-medium text-white">{name(member)}</p><p className="mt-1 text-xs text-zinc-500">{member.email}</p></div></div></td><td className="px-5 py-4"><p className="font-medium text-zinc-200">{member.memberships.length} membership{member.memberships.length === 1 ? "" : "s"}</p><p className="mt-1 max-w-[220px] truncate text-xs text-zinc-500">{member.memberships.map((membership) => membership.plan.gym.name).join(", ")}</p></td><td className="px-5 py-4 text-zinc-400">{nearestExpiry ? date(nearestExpiry.endDate) : "—"}</td><td className="px-5 py-4"><Status value={getMemberState(member)} /></td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedMember(member)} className="rounded-lg border border-white/[0.1] px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white">View</button></td></tr>; })}</tbody></table></div></section> : <Empty icon={Search} title="No members match these filters" description="Try another name, gym, or membership status." />}

    {selectedMember && <MemberDrawer member={selectedMember} onClose={() => setSelectedMember(null)} />}
  </div>;
}

function MemberMetric({ label, value, note, icon: Icon, accent }) { const colors = { violet: "bg-violet-500/12 text-violet-300", emerald: "bg-emerald-500/12 text-emerald-300", amber: "bg-amber-500/12 text-amber-300", sky: "bg-sky-500/12 text-sky-300" }; return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p><p className="mt-1.5 text-xs text-zinc-500">{note}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${colors[accent]}`}><Icon size={19} /></span></div></article>; }

function MemberDrawer({ member, onClose }) { return <div role="dialog" aria-modal="true" aria-label="Member details" className="fixed inset-0 z-50 flex items-end bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"><div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/[0.1] bg-[#12131c] shadow-2xl sm:rounded-3xl"><div className="sticky top-0 flex items-start justify-between border-b border-white/[0.08] bg-[#12131c]/95 p-5 backdrop-blur sm:p-6"><div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 font-bold text-white">{`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}</span><div><h2 className="text-lg font-semibold text-white">{name(member)}</h2><p className="mt-1 text-sm text-zinc-500">Member profile</p></div></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.08] hover:text-white"><X size={19} /></button></div><div className="p-5 sm:p-6"><div className="grid gap-3 sm:grid-cols-2"><InfoCard icon={Mail} label="Email" value={member.email || "Not provided"} /><InfoCard icon={Phone} label="Phone" value={member.phone || "Not provided"} /></div><div className="mt-6"><div className="flex items-center justify-between"><h3 className="font-semibold text-white">Membership history</h3><span className="text-xs text-zinc-500">{member.memberships.length} record{member.memberships.length === 1 ? "" : "s"}</span></div><div className="mt-3 space-y-3">{member.memberships.map((membership) => <div key={membership.id} className="rounded-xl border border-white/[0.08] bg-black/15 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium text-white">{membership.plan.gym.name}</p><p className="mt-1 text-sm text-zinc-400">{membership.plan.name} · {membership.plan.durationInDays} days</p></div><Status value={membership.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.07] pt-3 text-xs"><div><p className="text-zinc-500">Started</p><p className="mt-1 font-medium text-zinc-300">{date(membership.startDate)}</p></div><div><p className="text-zinc-500">Expires</p><p className="mt-1 font-medium text-zinc-300">{date(membership.endDate)}</p></div></div></div>)}</div></div></div></div></div>; }

function InfoCard({ icon: Icon, label, value }) { return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.08] bg-black/10 p-3"><Icon size={17} className="shrink-0 text-violet-300" /><div className="min-w-0"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 truncate text-sm text-zinc-200">{value}</p></div></div>; }

function SalesContent({ salesData }) {
  const [search, setSearch] = useState("");
  const [gymId, setGymId] = useState("ALL");
  const {
    summary = {
      totalRevenue: 0,
      totalSales: 0,
      currentMonthRevenue: 0,
      currentMonthSales: 0,
      monthlyGrowth: 0,
      averageSaleValue: 0,
    },
    revenueTrend = [],
    revenueByGym = [],
    sales = [],
  } = salesData || {};

  const gyms = useMemo(() => {
    const results = new Map();
    sales.forEach((sale) => results.set(sale.plan.gym.id, sale.plan.gym));
    return Array.from(results.values()).sort((first, second) => first.name.localeCompare(second.name));
  }, [sales]);

  const visibleSales = sales.filter((sale) => {
    const text = `${sale.member.firstName} ${sale.member.lastName} ${sale.member.email || ""} ${sale.plan.gym.name} ${sale.plan.name}`.toLowerCase();
    const matchesSearch = text.includes(search.trim().toLowerCase());
    const matchesGym = gymId === "ALL" || sale.plan.gym.id === gymId;
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
                      <p className="mt-1 text-xs text-zinc-500">{sale.member.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-zinc-200">{sale.plan.gym.name}</p>
                      <p className="mt-1 text-xs text-zinc-500">{sale.plan.name}</p>
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

function TransfersContent({ transfers }) { return transfers.length ? <div className="grid gap-4">{transfers.map((transfer) => <article key={transfer.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{transfer.listing.membership.plan.gym.name}</h2><Status value={transfer.status} /></div><p className="mt-1 text-sm text-zinc-400">{transfer.listing.membership.plan.name} · {currency(transfer.listing.askingPrice)}</p><p className="mt-3 text-xs text-zinc-500">Seller: {name(transfer.listing.seller)} · Buyer: {name(transfer.buyer)} · Requested {date(transfer.createdAt)}</p></div><span className="flex items-center gap-2 text-xs text-zinc-500"><CalendarClock size={15} /> Listing: {transfer.listing.status}</span></div></article>)}</div> : <Empty icon={ArrowUpRight} title="No transfer activity" description="Marketplace transfers involving plans from your gyms will appear here." />; }

function Status({ value }) { const style = value === "ACTIVE" || value === "APPROVED" || value === "SOLD" ? "bg-emerald-500/10 text-emerald-300" : value === "PENDING" ? "bg-amber-500/10 text-amber-300" : value === "EXPIRED" || value === "REJECTED" ? "bg-red-500/10 text-red-300" : "bg-zinc-500/15 text-zinc-300"; return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${style}`}>{value}</span>; }
function Empty({ icon: Icon, title, description }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-[#11121a] p-8 text-center"><Icon size={34} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p></div>; }

export default GymOwnerOperationsPage;
