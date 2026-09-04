import { ClipboardList, ShieldCheck } from "lucide-react";

const date = (value) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const actorName = (actor) => [actor?.firstName, actor?.lastName].filter(Boolean).join(" ") || "FitSwap system";

export default function TransferAuditLogList({ logs = [], emptyMessage = "No transfer audit records yet." }) {
  if (!logs.length) return <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-8 text-center"><ClipboardList size={30} className="text-violet-300" /><p className="mt-3 text-sm text-zinc-400">{emptyMessage}</p></div>;
  return <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]">{logs.map((log) => <article key={log.id} className="flex gap-4 px-5 py-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-300"><ShieldCheck size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="text-sm font-medium text-white">{log.summary}</p><time className="text-xs text-zinc-500">{date(log.createdAt)}</time></div><p className="mt-1.5 text-xs text-zinc-500">{log.action.replaceAll("_", " ")} · by {actorName(log.actor)}{log.actorRole ? ` (${log.actorRole.replaceAll("_", " ")})` : ""}</p>{log.metadata && <p className="mt-1 text-xs text-zinc-600">Membership: {log.membershipId}{log.listingId ? ` · Listing: ${log.listingId}` : ""}</p>}</div></article>)}</div>;
}
