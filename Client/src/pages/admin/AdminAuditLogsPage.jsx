import { useEffect, useState } from "react";
import { BellRing, Building2, CircleAlert, ClipboardList, LoaderCircle, ShieldCheck, Store } from "lucide-react";

import { getAuditLogs } from "../../api/admin.api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import DashboardLayout from "../../layouts/DashboardLayout";

const date = (value) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const name = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Administrator";
const config = { ANNOUNCEMENT_SENT: { label: "Announcement", icon: BellRing, style: "bg-sky-500/12 text-sky-300" }, GYM_STATUS_UPDATED: { label: "Gym approval", icon: Building2, style: "bg-emerald-500/12 text-emerald-300" }, LISTING_STATUS_UPDATED: { label: "Listing moderation", icon: Store, style: "bg-violet-500/12 text-violet-300" }, USER_ROLE_UPDATED: { label: "Role update", icon: ShieldCheck, style: "bg-amber-500/12 text-amber-300" }, TRANSFER_RESOLVED: { label: "Transfer resolution", icon: ClipboardList, style: "bg-fuchsia-500/12 text-fuchsia-300" } };

function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); try { setLogs(await getAuditLogs()); setError(""); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to load audit logs."); } finally { setLoading(false); } };
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 pb-8"><AdminPageHeader eyebrow="Security & audit" title="Admin activity log" description="A chronological record of important administrative actions. This supports traceability and makes platform decisions easy to review." icon={ClipboardList} />
    {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}<button onClick={load} className="ml-auto text-xs font-semibold text-red-200">Retry</button></div>}
    {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-sky-400" size={20} /> Loading activity history…</div> : <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="border-b border-white/[0.08] px-5 py-4"><h2 className="font-semibold text-white">Recent activity</h2><p className="mt-1 text-sm text-zinc-500">Most recent 100 administrative records</p></div>{logs.length ? <div className="divide-y divide-white/[0.06]">{logs.map((log) => { const action = config[log.action] || { label: log.action.replaceAll("_", " "), icon: ShieldCheck, style: "bg-zinc-500/15 text-zinc-300" }; const Icon = action.icon; return <article key={log.id} className="flex gap-4 px-5 py-4"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${action.style}`}><Icon size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-white">{log.summary}</p><span className="text-xs text-zinc-500">{date(log.createdAt)}</span></div><div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500"><span>{action.label}</span><span>·</span><span>by {name(log.admin)}</span>{log.targetType && <><span>·</span><span>{log.targetType.replaceAll("_", " ")}</span></>}</div></div></article>; })}</div> : <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center"><ShieldCheck size={32} className="text-sky-400" /><h2 className="mt-4 font-semibold text-white">No admin activity yet</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">Approvals, marketplace moderation, and announcements will automatically appear here.</p></div>}</section>}
  </main></DashboardLayout>;
}

export default AdminAuditLogsPage;
