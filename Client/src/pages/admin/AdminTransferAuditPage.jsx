import { useCallback, useEffect, useState } from "react";
import { CircleAlert, ClipboardList, LoaderCircle, RefreshCw } from "lucide-react";
import { getTransferAuditLogs } from "../../api/admin.api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import TransferAuditLogList from "../../components/monitoring/TransferAuditLogList";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function AdminTransferAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setLoading(true); setLogs(await getTransferAuditLogs()); setError(""); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to load transfer audit history."); } finally { setLoading(false); } }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);
  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 pb-8"><AdminPageHeader eyebrow="Marketplace governance" title="Transfer audit trail" description="Every policy update, listing decision, payment step, approval, rejection, and completed membership handover." icon={ClipboardList} />{error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}<button type="button" onClick={load} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold"><RefreshCw size={14} /> Retry</button></div>}{loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-violet-300" size={20} /> Loading transfer history…</div> : <TransferAuditLogList logs={logs} emptyMessage="Transfer audit records will appear when a policy or handover action occurs." />}</main></DashboardLayout>;
}
