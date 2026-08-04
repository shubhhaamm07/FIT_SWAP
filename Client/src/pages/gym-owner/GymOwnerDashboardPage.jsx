import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarClock,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  TrendingUp,
  UsersRound,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { RevenueTrendChart } from "../../components/gym-owner/OwnerRevenueCharts";
import { getGymOwnerDashboard } from "../../api/gym-owner.api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

function MetricCard({ label, value, note, icon: Icon, accent = "violet" }) {
  const accents = {
    violet: "bg-violet-500/12 text-violet-300 ring-violet-500/20",
    emerald: "bg-emerald-500/12 text-emerald-300 ring-emerald-500/20",
    sky: "bg-sky-500/12 text-sky-300 ring-sky-500/20",
    amber: "bg-amber-500/12 text-amber-300 ring-amber-500/20",
  };

  return (
    <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 shadow-xl shadow-black/10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">{value}</p>
          <p className="mt-2 text-xs text-zinc-500">{note}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${accents[accent]}`}>
          <Icon size={19} />
        </span>
      </div>
    </article>
  );
}

function GymOwnerDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      setDashboard(await getGymOwnerDashboard());
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not load your owner dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, []);

  if (loading) {
    return <DashboardLayout><div className="flex min-h-[62vh] items-center justify-center gap-3 text-sm text-zinc-400"><LoaderCircle size={20} className="animate-spin text-violet-400" /> Loading your gym performance…</div></DashboardLayout>;
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="mx-auto flex min-h-[58vh] max-w-lg flex-col items-center justify-center text-center">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6"><p className="font-semibold text-white">Owner dashboard unavailable</p><p className="mt-2 text-sm text-zinc-400">{error}</p><button type="button" onClick={loadDashboard} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"><RefreshCw size={16} /> Try again</button></div>
        </div>
      </DashboardLayout>
    );
  }

  const { overview, revenueTrend, recentSales, expiringMemberships, gyms } = dashboard;
  const gymCount = gyms.length;

  return (
    <DashboardLayout>
      <main className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-violet-500/20 bg-[radial-gradient(circle_at_82%_18%,rgba(139,92,246,0.32),transparent_25%),linear-gradient(120deg,#171029,#10111a_58%,#10111a)] p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold text-violet-300">OWNER CENTRE</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">Your gyms, at a glance.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300">Track sales, member activity, renewals and membership performance from one secure workspace.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/gyms" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"><Building2 size={17} /> View gyms</Link>
              <Link to="/transfers" className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500">Review transfers <ArrowRight size={17} /></Link>
            </div>
          </div>
        </section>

        {!gymCount ? (
          <section className="rounded-2xl border border-dashed border-violet-500/30 bg-violet-500/[0.04] p-8 text-center">
            <Building2 size={34} className="mx-auto text-violet-400" />
            <h3 className="mt-4 text-lg font-semibold text-white">Add your first gym to begin</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-400">Your analytics will appear as soon as you add a gym, publish membership plans, and start registering members.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Total revenue" value={formatCurrency(overview.totalRevenue)} note="All recorded membership sales" icon={IndianRupee} accent="violet" />
              <MetricCard label="Active members" value={overview.activeMembers.toLocaleString("en-IN")} note="Currently active memberships" icon={UsersRound} accent="emerald" />
              <MetricCard label="Membership sales" value={overview.membershipSales.toLocaleString("en-IN")} note={`${overview.currentMonthSales} sale${overview.currentMonthSales === 1 ? "" : "s"} this month`} icon={CreditCard} accent="sky" />
              <MetricCard label="Monthly growth" value={`${overview.monthlyGrowth > 0 ? "+" : ""}${overview.monthlyGrowth}%`} note={`${formatCurrency(overview.currentMonthRevenue)} earned this month`} icon={TrendingUp} accent="amber" />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.85fr)]">
              <RevenueTrendChart trend={revenueTrend} compact />
              <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-white">Memberships expiring soon</p><p className="mt-1 text-sm text-zinc-500">Within the next 30 days</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-300"><CalendarClock size={19} /></span></div>
                <p className="mt-6 text-4xl font-bold tracking-tight text-white">{overview.expiringMembershipCount}</p>
                <p className="mt-1 text-sm text-zinc-500">members may need a renewal reminder</p>
                <div className="mt-6 space-y-3 border-t border-white/[0.08] pt-4">
                  {expiringMemberships.length ? expiringMemberships.slice(0, 3).map((membership) => <div key={membership.id} className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-200">{membership.memberName}</p><p className="truncate text-xs text-zinc-500">{membership.planName}</p></div><span className="shrink-0 text-xs font-medium text-amber-300">{formatDate(membership.endDate)}</span></div>) : <p className="py-2 text-sm text-zinc-500">No active memberships expire in the next 30 days.</p>}
                </div>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.75fr)]">
              <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]">
                <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4 sm:px-6"><div><p className="font-semibold text-white">Recent membership sales</p><p className="mt-1 text-sm text-zinc-500">Latest memberships created across your gyms</p></div><span className="hidden rounded-lg bg-white/[0.04] px-2.5 py-1 text-xs text-zinc-400 sm:block">{overview.membershipSales} total</span></div>
                {recentSales.length ? <div className="divide-y divide-white/[0.06]">{recentSales.map((sale) => <div key={sale.id} className="flex items-center justify-between gap-4 px-5 py-4 sm:px-6"><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-100">{sale.memberName}</p><p className="mt-1 truncate text-xs text-zinc-500">{sale.gymName} · {sale.planName}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold text-emerald-300">{formatCurrency(sale.price)}</p><p className="mt-1 text-xs text-zinc-500">{formatDate(sale.createdAt)}</p></div></div>)}</div> : <p className="p-8 text-center text-sm text-zinc-500">Membership sales will show here when members join your plans.</p>}
              </article>

              <aside className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-white">Your gyms</p><p className="mt-1 text-sm text-zinc-500">Plans and approval status</p></div><span className="rounded-lg bg-violet-500/10 px-2.5 py-1 text-xs font-semibold text-violet-300">{gymCount} total</span></div>
                <div className="mt-5 space-y-3">{gyms.map((gym) => <div key={gym.id} className="rounded-xl border border-white/[0.07] bg-black/10 p-3.5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-zinc-100">{gym.name}</p><p className="mt-1 text-xs text-zinc-500">{gym.city} · {gym.planCount} plan{gym.planCount === 1 ? "" : "s"}</p></div><span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${gym.status === "APPROVED" ? "bg-emerald-500/10 text-emerald-300" : gym.status === "REJECTED" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>{gym.status}</span></div></div>)}</div>
                <Link to="/gyms" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-violet-200">Manage gyms <ArrowUpRight size={16} /></Link>
              </aside>
            </section>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}

export default GymOwnerDashboardPage;
