import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BadgeCheck, Ban, Building2, Check, CircleDollarSign, Clock3, CreditCard, LoaderCircle, Search, ShieldCheck, Store, UserCog, UserRoundCheck, UsersRound, X } from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getAdminDashboard, getAdminListings, getAdminPayments, getAdminUsers, getPendingGyms, updateAdminListingStatus, updateAdminUserAccess, updateAdminUserRole, updateGymApproval } from "../../api/admin.api";
import { useAuth } from "../../hooks/useAuth";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
const name = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || "User";

const sections = {
  dashboard: { eyebrow: "Platform control", title: "Admin Dashboard", description: "Monitor the FitSwap platform, approvals, marketplace activity, and moderation workload.", icon: ShieldCheck },
  gyms: { eyebrow: "Gym management", title: "Gym Approvals", description: "Review partner gym applications before they become visible to members.", icon: Building2 },
  listings: { eyebrow: "Marketplace moderation", title: "Marketplace Listings", description: "Review and manage live marketplace listings across the platform.", icon: Store },
  users: { eyebrow: "User management", title: "People & access", description: "Search member accounts, assign operational roles, and suspend access when necessary.", icon: UserCog },
  payments: { eyebrow: "Payment operations", title: "Payment ledger", description: "Review Razorpay transaction status and membership transfer activity across FitSwap.", icon: CircleDollarSign },
};

function AdminPortalPage() {
  const { section } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const config = sections[section];
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updating, setUpdating] = useState("");

  const load = useCallback(async () => {
    if (!sections[section]) return;
    setLoading(true);
    setMessage("");
    try {
      const request = section === "dashboard" ? getAdminDashboard : section === "gyms" ? getPendingGyms : section === "listings" ? getAdminListings : section === "users" ? getAdminUsers : getAdminPayments;
      setData(await request());
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load this admin section.");
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (!config) {
    navigate("/admin/dashboard", { replace: true });
    return null;
  }

  const updateGym = async (gymId, status) => {
    try {
      setUpdating(gymId);
      await updateGymApproval(gymId, status);
      setMessage(`Gym ${status.toLowerCase()}.`);
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update the gym.");
    } finally { setUpdating(""); }
  };
  const updateListing = async (listingId, status) => {
    try {
      setUpdating(listingId);
      await updateAdminListingStatus(listingId, status);
      setMessage("Listing status updated.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update the listing.");
    } finally { setUpdating(""); }
  };
  const updateUserRole = async (userId, role) => {
    try {
      setUpdating(userId);
      await updateAdminUserRole(userId, role);
      setMessage("User role updated and recorded in the audit log.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update the user role.");
    } finally { setUpdating(""); }
  };
  const updateUserAccess = async (userId, isActive) => {
    try {
      setUpdating(userId);
      await updateAdminUserAccess(userId, isActive);
      setMessage(isActive ? "User account restored." : "User account suspended.");
      await load();
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update account access.");
    } finally { setUpdating(""); }
  };
  const Icon = config.icon;

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 pb-8"><section className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-[radial-gradient(circle_at_85%_15%,rgba(14,165,233,.24),transparent_26%),radial-gradient(circle_at_68%_110%,rgba(168,85,247,.18),transparent_34%),#10121a] p-6 shadow-2xl shadow-sky-950/10 sm:p-8"><span className="pointer-events-none absolute -right-5 -top-7 h-32 w-32 rounded-full border border-sky-300/15" /><div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-300">FitSwap administration · {config.eyebrow}</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{config.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{config.description}</p></div><span className="grid h-12 w-12 place-items-center rounded-2xl border border-sky-400/15 bg-sky-500/12 text-sky-200"><Icon size={23} /></span></div></section>{message && <p className={`rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}>{message}</p>}{loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-sky-400" size={20} /> Loading platform data…</div> : section === "dashboard" ? <AdminDashboard data={data} /> : section === "gyms" ? <GymQueue gyms={data || []} updating={updating} onUpdate={updateGym} /> : section === "listings" ? <ListingModeration listings={data || []} updating={updating} onUpdate={updateListing} /> : section === "users" ? <UserDirectory users={data || []} updating={updating} currentAdminId={user?.id} onRoleChange={updateUserRole} onAccessChange={updateUserAccess} /> : <PaymentLedger payments={data || []} />}</main></DashboardLayout>;
}

function AdminDashboard({ data }) { const overview = data?.overview || {}; return <div className="space-y-5"><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Members" value={overview.totalUsers || 0} icon={UsersRound} tone="violet" /><Metric label="Gym owners" value={overview.totalGymOwners || 0} icon={Building2} tone="sky" /><Metric label="Gym approvals" value={overview.pendingGyms || 0} icon={Clock3} tone="amber" /><Metric label="Active listings" value={overview.activeListings || 0} icon={Store} tone="emerald" /></section><section className="grid gap-5 xl:grid-cols-2"><article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Approval queue</h2><p className="mt-1 text-sm text-zinc-500">Items that need platform attention</p></div><Link to="/admin/gyms" className="text-sm font-semibold text-sky-300 hover:text-sky-200">Review gyms →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><AdminCallout label="Pending gyms" value={overview.pendingGyms || 0} note="Awaiting review" /><AdminCallout label="Pending transfers" value={overview.pendingTransfers || 0} note="Marketplace activity" /></div></article><article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold text-white">Marketplace health</h2><p className="mt-1 text-sm text-zinc-500">Listings currently managed by FitSwap</p></div><Link to="/admin/listings" className="text-sm font-semibold text-sky-300 hover:text-sky-200">Moderate listings →</Link></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><AdminCallout label="All listings" value={overview.totalListings || 0} note="Non-deleted records" /><AdminCallout label="Approved gyms" value={overview.approvedGyms || 0} note="Live partners" /></div></article></section><section className="grid gap-5 xl:grid-cols-2"><RecentGyms gyms={data?.recentGyms || []} /><RecentListings listings={data?.recentListings || []} /></section></div>; }
function Metric({ label, value, icon: Icon, tone }) { const tones = { violet: "bg-violet-500/12 text-violet-300", sky: "bg-sky-500/12 text-sky-300", amber: "bg-amber-500/12 text-amber-300", emerald: "bg-emerald-500/12 text-emerald-300" }; return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex items-start justify-between"><div><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span></div></article>; }
function AdminCallout({ label, value, note }) { return <div className="rounded-xl border border-white/[0.08] bg-black/15 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p><p className="mt-1 text-xs text-zinc-500">{note}</p></div>; }
function RecentGyms({ gyms }) { return <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="border-b border-white/[0.08] px-5 py-4"><h2 className="font-semibold text-white">Recent gym applications</h2></div>{gyms.length ? gyms.map((gym) => <div key={gym.id} className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{gym.name}</p><p className="mt-1 text-xs text-zinc-500">{gym.city} · {name(gym.owner)}</p></div><AdminStatus value={gym.status} /></div>) : <p className="p-6 text-sm text-zinc-500">No gym applications yet.</p>}</article>; }
function RecentListings({ listings }) { return <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="border-b border-white/[0.08] px-5 py-4"><h2 className="font-semibold text-white">Recent marketplace listings</h2></div>{listings.length ? listings.map((listing) => <div key={listing.id} className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{listing.membership?.plan?.gym?.name || "Gym membership"}</p><p className="mt-1 text-xs text-zinc-500">{listing.membership?.plan?.name} · {name(listing.seller)}</p></div><div className="text-right"><p className="text-sm font-semibold text-emerald-300">{currency(listing.askingPrice)}</p><AdminStatus value={listing.status} /></div></div>) : <p className="p-6 text-sm text-zinc-500">No marketplace listings yet.</p>}</article>; }
function GymQueue({ gyms, updating, onUpdate }) { return gyms.length ? <div className="grid gap-4">{gyms.map((gym) => <article key={gym.id} className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/12 text-sky-300"><Building2 size={20} /></span><div><h2 className="font-semibold text-white">{gym.name}</h2><p className="mt-1 text-sm text-zinc-400">{gym.city}, {gym.state} · Submitted {date(gym.createdAt)}</p><p className="mt-2 text-xs text-zinc-500">Owner: {name(gym.owner)} · {gym.owner?.email}</p></div></div><div className="flex gap-2"><button disabled={updating === gym.id} onClick={() => onUpdate(gym.id, "APPROVED")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> Approve</button><button disabled={updating === gym.id} onClick={() => onUpdate(gym.id, "REJECTED")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div></div></article>)}</div> : <Empty title="No gyms await approval" description="New gym applications will appear here for review." icon={BadgeCheck} />; }
function ListingModeration({ listings, updating, onUpdate }) { return listings.length ? <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-4">Listing</th><th className="px-5 py-4">Seller</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Moderate</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{listings.map((listing) => <tr key={listing.id}><td className="px-5 py-4"><p className="font-medium text-white">{listing.membership?.plan?.gym?.name}</p><p className="mt-1 text-xs text-zinc-500">{listing.membership?.plan?.name}</p></td><td className="px-5 py-4 text-zinc-300">{name(listing.seller)}</td><td className="px-5 py-4 font-medium text-emerald-300">{currency(listing.askingPrice)}</td><td className="px-5 py-4"><AdminStatus value={listing.status} /></td><td className="px-5 py-4"><select value={listing.status} disabled={updating === listing.id} onChange={(event) => onUpdate(listing.id, event.target.value)} className="rounded-lg border border-white/[0.1] bg-black/15 px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-sky-400"><option value="ACTIVE">Active</option><option value="PAUSED">Paused</option><option value="CANCELLED">Cancelled</option><option value="EXPIRED">Expired</option></select></td></tr>)}</tbody></table></div></div> : <Empty title="No marketplace listings" description="Listings will appear here when members start selling memberships." icon={Store} />; }
function UserDirectory({ users, updating, currentAdminId, onRoleChange, onAccessChange }) { const [search, setSearch] = useState(""); const [filter, setFilter] = useState("ALL"); const visible = users.filter((person) => { const matchesSearch = `${person.firstName} ${person.lastName} ${person.email} ${person.phone || ""}`.toLowerCase().includes(search.toLowerCase()); const matchesFilter = filter === "ALL" || (filter === "SUSPENDED" ? !person.isActive : person.role === filter); return matchesSearch && matchesFilter; }); return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="flex flex-col gap-3 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">Account directory</h2><p className="mt-1 text-sm text-zinc-500">{visible.length} of {users.length} accounts shown</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search people" className="w-full rounded-lg border border-white/[0.1] bg-black/15 py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 sm:w-48" /></label><select value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-lg border border-white/[0.1] bg-black/15 px-3 py-2 text-sm text-zinc-200 outline-none"><option value="ALL">All accounts</option><option value="USER">Members</option><option value="GYM_OWNER">Gym owners</option><option value="ADMIN">Administrators</option><option value="SUSPENDED">Suspended</option></select></div></div>{visible.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-4">Person</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Activity</th><th className="px-5 py-4">Access</th><th className="px-5 py-4 text-right">Controls</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{visible.map((person) => { const isSelf = person.id === currentAdminId; return <tr key={person.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-200">{person.firstName?.[0]}{person.lastName?.[0]}</span><div><p className="font-medium text-white">{name(person)}{isSelf && <span className="ml-2 text-xs font-normal text-sky-300">You</span>}</p><p className="mt-1 text-xs text-zinc-500">{person.email}</p></div></div></td><td className="px-5 py-4"><select disabled={updating === person.id || isSelf} value={person.role} onChange={(event) => onRoleChange(person.id, event.target.value)} className="rounded-lg border border-white/[0.1] bg-black/15 px-2.5 py-2 text-xs text-zinc-200 outline-none disabled:opacity-50"><option value="USER">Member</option><option value="GYM_OWNER">Gym owner</option><option value="GYM_STAFF">Gym staff</option><option value="ADMIN">Administrator</option></select></td><td className="px-5 py-4 text-xs text-zinc-400"><p>{person._count?.memberships || 0} memberships</p><p className="mt-1">{person._count?.listings || 0} listings · {person._count?.payments || 0} payments</p></td><td className="px-5 py-4"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${person.isActive ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{person.isActive ? "ACTIVE" : "SUSPENDED"}</span></td><td className="px-5 py-4 text-right"><button type="button" disabled={updating === person.id || isSelf} onClick={() => onAccessChange(person.id, !person.isActive)} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${person.isActive ? "border-red-500/25 text-red-300 hover:bg-red-500/10" : "border-emerald-500/25 text-emerald-300 hover:bg-emerald-500/10"}`}>{person.isActive ? <Ban size={14} /> : <UserRoundCheck size={14} />}{person.isActive ? "Suspend" : "Restore"}</button></td></tr>; })}</tbody></table></div> : <Empty title="No matching accounts" description="Try another search or account filter." icon={UsersRound} />}</section>; }
function PaymentLedger({ payments }) { const totalPaid = payments.filter((payment) => payment.status === "PAID").reduce((total, payment) => total + Number(payment.amount || 0), 0) / 100; return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="flex flex-col gap-3 border-b border-white/[0.08] p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-white">Razorpay payment activity</h2><p className="mt-1 text-sm text-zinc-500">Completed online payments and their membership transfers.</p></div><div className="rounded-xl bg-emerald-500/10 px-4 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-300">Paid volume shown</p><p className="mt-1 text-lg font-bold text-white">{currency(totalPaid)}</p></div></div>{payments.length ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="border-b border-white/[0.08] text-xs uppercase tracking-wide text-zinc-500"><tr><th className="px-5 py-4">Membership</th><th className="px-5 py-4">Buyer</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Recorded</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{payments.map((payment) => <tr key={payment.id} className="transition hover:bg-white/[0.025]"><td className="px-5 py-4"><p className="font-medium text-white">{payment.listing?.membership?.plan?.gym?.name || "Gym membership"}</p><p className="mt-1 text-xs text-zinc-500">{payment.listing?.membership?.plan?.name || "Membership transfer"}</p></td><td className="px-5 py-4"><p className="text-zinc-200">{name(payment.buyer)}</p><p className="mt-1 text-xs text-zinc-500">{payment.buyer?.email}</p></td><td className="px-5 py-4 font-semibold text-emerald-300">{currency(Number(payment.amount || 0) / 100)}</td><td className="px-5 py-4"><AdminStatus value={payment.status} /></td><td className="px-5 py-4 text-xs text-zinc-400">{date(payment.verifiedAt || payment.createdAt)}</td></tr>)}</tbody></table></div> : <Empty title="No online payments yet" description="Razorpay transactions will appear here after successful verification." icon={CreditCard} />}</section>; }
function AdminStatus({ value }) { const styles = { APPROVED: "bg-emerald-500/10 text-emerald-300", ACTIVE: "bg-emerald-500/10 text-emerald-300", PAID: "bg-emerald-500/10 text-emerald-300", PENDING: "bg-amber-500/10 text-amber-300", CREATED: "bg-amber-500/10 text-amber-300", PAUSED: "bg-sky-500/10 text-sky-300", REJECTED: "bg-red-500/10 text-red-300", CANCELLED: "bg-red-500/10 text-red-300", FAILED: "bg-red-500/10 text-red-300", EXPIRED: "bg-zinc-500/15 text-zinc-300" }; return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${styles[value] || "bg-zinc-500/15 text-zinc-300"}`}>{value}</span>; }
function Empty({ icon: Icon, title, description }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.12] bg-[#11121a] p-8 text-center"><Icon size={34} className="text-sky-400" /><h2 className="mt-4 font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{description}</p></div>; }

export default AdminPortalPage;
