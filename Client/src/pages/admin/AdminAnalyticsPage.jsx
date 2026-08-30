import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, BadgeIndianRupee, BarChart3, CircleAlert, Download, LoaderCircle, TrendingUp, UserRoundCheck, UsersRound } from "lucide-react";

import { getPlatformAnalytics } from "../../api/admin.api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import DashboardLayout from "../../layouts/DashboardLayout";

const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));

function Metric({ label, value, note, icon: Icon, tone = "sky" }) {
  const styles = { sky: "bg-sky-500/12 text-sky-300", emerald: "bg-emerald-500/12 text-emerald-300", violet: "bg-violet-500/12 text-violet-300", amber: "bg-amber-500/12 text-amber-300" };
  return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-zinc-400">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p><p className="mt-1.5 text-xs text-zinc-500">{note}</p></div><span className={`grid h-10 w-10 place-items-center rounded-xl ${styles[tone]}`}><Icon size={19} /></span></div></article>;
}

function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState(6);

  const load = useCallback(async (months = period) => {
    setError("");
    try { setData(await getPlatformAnalytics({ months })); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to load platform analytics."); }
  }, [period]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(period); }, 0);
    return () => window.clearTimeout(timer);
  }, [period, load]);
  const highestRevenue = useMemo(() => Math.max(...(data?.revenueTrend || []).map((item) => Number(item.revenue || 0)), 1), [data]);
  const downloadReport = () => {
    if (!data) return;
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [["FitSwap Platform Analytics"], ["Reporting period", `${data.periodMonths} months`], [], ["Month", "Revenue (INR)", "Membership sales"], ...data.revenueTrend.map((item) => [item.label, Number(item.revenue || 0).toFixed(2), item.sales]), [], ["Metric", "Value"], ["Active users", data.overview.activeUsers], ["New registrations", data.overview.newRegistrations], ["Listing conversion (%)", data.overview.listingConversion], ["Platform revenue (INR)", Number(data.overview.platformRevenue || 0).toFixed(2)]];
    const blob = new Blob([rows.map((row) => row.map(escape).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fitswap-platform-report-${data.periodMonths}-months.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 pb-8"><AdminPageHeader eyebrow="Reports & analytics" title="Platform performance" description="Track revenue, active customers, registrations, marketplace conversion, and the strongest gym partners." icon={BarChart3} />
    <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#11121a] p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-white">Reporting window</p><p className="mt-1 text-xs text-zinc-500">Choose how much performance history to include.</p></div><div className="flex gap-2"><select value={period} onChange={(event) => setPeriod(Number(event.target.value))} className="rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-zinc-200 outline-none focus:border-sky-400"><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select><button type="button" disabled={!data} onClick={downloadReport} className="inline-flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2.5 text-sm font-semibold text-sky-200 transition hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} /> Export CSV</button></div></section>
    {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}<button onClick={load} className="ml-auto text-xs font-semibold text-red-200">Retry</button></div>}
    {!data ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={20} className="animate-spin text-sky-400" /> Loading live reports…</div> : <><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Platform revenue" value={currency(data.overview.platformRevenue)} note={`Membership sales in the last ${data.periodMonths} months`} icon={BadgeIndianRupee} tone="emerald" /><Metric label="Active users" value={data.overview.activeUsers} note={`${data.overview.registeredUsers} registered members and owners`} icon={UsersRound} tone="sky" /><Metric label="New registrations" value={data.overview.newRegistrations} note="Joined during this month" icon={UserRoundCheck} tone="violet" /><Metric label="Listing conversion" value={`${data.overview.listingConversion}%`} note="Listings that resulted in a sale" icon={Activity} tone="amber" /></section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,.75fr)]"><article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-semibold text-white">Revenue trend</h2><p className="mt-1 text-sm text-zinc-500">Membership revenue recorded each month</p></div><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${data.overview.monthlyGrowth >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}><TrendingUp size={14} /> {data.overview.monthlyGrowth >= 0 ? "+" : ""}{data.overview.monthlyGrowth}% this month</span></div><div className="mt-8 flex h-52 items-end gap-3">{data.revenueTrend.map((month) => <div key={month.label} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[10px] text-zinc-500">{currency(month.revenue)}</span><div className="flex h-36 w-full items-end rounded-t-lg bg-white/[0.035]"><div style={{ height: `${Math.max((Number(month.revenue || 0) / highestRevenue) * 100, month.revenue ? 8 : 2)}%` }} className="w-full rounded-t-lg bg-gradient-to-t from-sky-600 to-violet-400 transition-all duration-700" /></div><span className="truncate text-[10px] text-zinc-500">{month.label}</span></div>)}</div></article><article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><h2 className="font-semibold text-white">This month</h2><p className="mt-1 text-sm text-zinc-500">Current platform momentum</p><p className="mt-7 text-3xl font-bold text-white">{currency(data.overview.currentMonthRevenue)}</p><p className="mt-1 text-sm text-zinc-500">{data.revenueTrend.at(-1)?.sales || 0} membership sales recorded</p><div className="mt-7 border-t border-white/[0.08] pt-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Monthly growth</p><p className="mt-2 text-xl font-bold text-emerald-300">{data.overview.monthlyGrowth >= 0 ? "+" : ""}{data.overview.monthlyGrowth}%</p></div></article></section>
      <section className="grid gap-5 xl:grid-cols-2"><RankedList title="Top gyms by revenue" items={data.topGyms} value={(item) => currency(item.revenue)} note={(item) => `${item.sales} membership sale${item.sales === 1 ? "" : "s"}`} /><RankedList title="Best-selling membership plans" items={data.topPlans} value={(item) => `${item.sales} sale${item.sales === 1 ? "" : "s"}`} note={(item) => `${item.gymName} · ${currency(item.revenue)}`} /></section></>}
  </main></DashboardLayout>;
}

function RankedList({ title, items, value, note }) { return <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="border-b border-white/[0.08] px-5 py-4"><h2 className="font-semibold text-white">{title}</h2></div>{items.length ? items.map((item, index) => <div key={item.id} className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4 last:border-0"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-300">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{item.name}</p><p className="mt-1 truncate text-xs text-zinc-500">{note(item)}</p></div><p className="shrink-0 text-sm font-semibold text-emerald-300">{value(item)}</p></div>) : <p className="p-6 text-sm text-zinc-500">Data will appear once membership sales are recorded.</p>}</section>; }

export default AdminAnalyticsPage;
