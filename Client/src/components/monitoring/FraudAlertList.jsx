import { AlertTriangle, ShieldAlert } from "lucide-react";

const severityStyle = { HIGH: "border-red-400/25 bg-red-500/[0.06] text-red-200", MEDIUM: "border-amber-400/25 bg-amber-500/[0.06] text-amber-100", LOW: "border-sky-400/25 bg-sky-500/[0.06] text-sky-100" };
const actorName = (actor) => [actor?.firstName, actor?.lastName].filter(Boolean).join(" ") || "Unknown account";

export default function FraudAlertList({ alerts = [], emptyMessage = "No fraud indicators are currently flagged." }) {
  if (!alerts.length) return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-400/20 bg-emerald-500/[0.04] p-8 text-center"><ShieldAlert size={30} className="text-emerald-300" /><p className="mt-3 text-sm text-emerald-100">{emptyMessage}</p></div>;
  return <div className="grid gap-4">{alerts.map((alert) => <article key={alert.id} className={`rounded-2xl border p-5 ${severityStyle[alert.severity] || severityStyle.LOW}`}><div className="flex gap-3"><AlertTriangle size={20} className="mt-0.5 shrink-0" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold text-white">{alert.title}</h2><span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-bold">{alert.severity}</span></div><p className="mt-2 text-sm leading-6 text-zinc-300">{alert.description}</p><p className="mt-3 text-xs text-zinc-500">{alert.entityType.replaceAll("_", " ")} · {actorName(alert.actor)}{alert.actor?.email ? ` · ${alert.actor.email}` : ""}</p></div></div></article>)}</div>;
}
