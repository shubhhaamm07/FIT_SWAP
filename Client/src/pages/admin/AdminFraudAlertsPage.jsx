import { useCallback, useEffect, useState } from "react";
import { CircleAlert, LoaderCircle, RefreshCw, ShieldAlert } from "lucide-react";
import { getFraudAlerts } from "../../api/admin.api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FraudAlertList from "../../components/monitoring/FraudAlertList";
import DashboardLayout from "../../layouts/DashboardLayout";

export default function AdminFraudAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => { try { setLoading(true); setAlerts(await getFraudAlerts()); setError(""); } catch (requestError) { setError(requestError.response?.data?.message || "Unable to load fraud alerts."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 pb-8"><AdminPageHeader eyebrow="Marketplace safety" title="Fraud review queue" description="Explainable alerts based on unusual prices, repeated cancelled transfers, failed payments, and unusually high request activity." icon={ShieldAlert} />{error && <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300"><CircleAlert size={17} /> {error}<button type="button" onClick={load} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold"><RefreshCw size={14} /> Retry</button></div>}{loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-red-300" size={20} /> Analysing marketplace activity…</div> : <FraudAlertList alerts={alerts} />}</main></DashboardLayout>;
}
