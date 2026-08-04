import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Check, CircleAlert, Clock3, Dumbbell, LoaderCircle, MapPin, X } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { approveTransferRequest, cancelTransferRequest, getIncomingTransferRequests, getMyTransferRequests, rejectTransferRequest } from "../../api/transfer.api";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const TransferRequestsPage = () => {
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState("");

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const results = await Promise.all([getIncomingTransferRequests(), getMyTransferRequests()]);
      setIncoming(results[0]);
      setOutgoing(results[1]);
      setMessage("");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to load transfer requests.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadRequests();
    };
    void load();
  }, [loadRequests]);

  const handleAction = async (requestId, action) => {
    try {
      setUpdatingId(requestId);
      if (action === "approve") await approveTransferRequest(requestId);
      else if (action === "reject") await rejectTransferRequest(requestId);
      else await cancelTransferRequest(requestId);
      await loadRequests();
      setMessage("Transfer request " + (action === "approve" ? "approved." : action === "reject" ? "rejected." : "cancelled."));
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to update this transfer request.");
    } finally {
      setUpdatingId("");
    }
  };

  const requests = activeTab === "incoming" ? incoming : outgoing;
  const incomingPendingCount = useMemo(() => incoming.filter((request) => request.status === "PENDING").length, [incoming]);
  const outgoingPendingCount = useMemo(() => outgoing.filter((request) => request.status === "PENDING").length, [outgoing]);

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a] p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm font-medium text-violet-400">Marketplace</p><h1 className="mt-1 text-3xl font-bold tracking-tight text-white">Transfer Requests</h1><p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">Review buyer requests for your listings and follow memberships you want to receive.</p></div>
            <div className="flex flex-wrap gap-3"><Stat label="Received" value={incoming.length} icon={ArrowDownLeft} /><Stat label="Sent" value={outgoing.length} icon={ArrowUpRight} /><Stat label="To review" value={incomingPendingCount} icon={Clock3} /><Stat label="Your pending" value={outgoingPendingCount} icon={Clock3} /></div>
          </div>
        </section>

        <div className="flex w-fit rounded-xl border border-white/[0.08] bg-[#11121a] p-1">
          <Tab active={activeTab === "incoming"} onClick={() => setActiveTab("incoming")} icon={ArrowDownLeft} label="Incoming" count={incoming.length} />
          <Tab active={activeTab === "outgoing"} onClick={() => setActiveTab("outgoing")} icon={ArrowUpRight} label="Outgoing" count={outgoing.length} />
        </div>

        {message && <div className={"flex items-center gap-2 rounded-xl border px-4 py-3 text-sm " + (message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300")}><CircleAlert size={16} /> {message}</div>}

        {loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin" size={19} /> Loading transfer requests…</div> : requests.length ? <div className="grid gap-4">{requests.map((request) => <TransferCard key={request.id} request={request} direction={activeTab} updating={updatingId === request.id} onAction={handleAction} />)}</div> : <EmptyTransfers direction={activeTab} />}
      </main>
    </DashboardLayout>
  );
};

function TransferCard({ request, direction, updating, onAction }) {
  const plan = request.listing?.membership?.plan || {};
  const gym = plan.gym || {};
  const counterparty = direction === "incoming" ? request.buyer : request.listing?.seller;
  const name = [counterparty?.firstName, counterparty?.lastName].filter(Boolean).join(" ") || (direction === "incoming" ? "Buyer" : "Seller");

  return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 transition hover:border-violet-500/25 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/12 text-violet-400"><Dumbbell size={21} /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{gym.name || plan.name || "Membership transfer"}</h2><Status status={request.status} /></div><p className="mt-1 text-sm text-zinc-400">{plan.name || "Membership"} · {plan.durationInDays || "—"} days</p><p className="mt-2 flex items-center gap-1 text-xs text-zinc-500"><MapPin size={13} /> {gym.city || "Location pending"}</p></div></div><div className="grid grid-cols-2 gap-x-8 gap-y-3 border-y border-white/[0.07] py-4 text-sm sm:flex sm:border-y-0 sm:py-0"><Info label={direction === "incoming" ? "Requested by" : "Listed by"} value={name} /><Info label="Listing price" value={formatPrice(request.listing?.askingPrice || 0)} /><Info label="Requested" value={formatDate(request.createdAt)} /></div>{direction === "incoming" && request.status === "PENDING" && <div className="flex gap-2"><button type="button" disabled={updating} onClick={() => onAction(request.id, "approve")} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"><Check size={15} /> Approve</button><button type="button" disabled={updating} onClick={() => onAction(request.id, "reject")} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50"><X size={15} /> Reject</button></div>}{direction === "outgoing" && request.status === "PENDING" && <button type="button" disabled={updating} onClick={() => onAction(request.id, "cancel")} className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-500/30 px-3 py-2 text-sm font-semibold text-zinc-300 hover:bg-white/5 disabled:opacity-50"><X size={15} /> Cancel request</button>}</div></article>;
}

function Tab({ active, onClick, icon: Icon, label, count }) { return <button type="button" onClick={onClick} className={"inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition " + (active ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white")}><Icon size={16} /> {label}<span className={"rounded-full px-1.5 py-0.5 text-[10px] " + (active ? "bg-white/15" : "bg-white/[0.07]")}>{count}</span></button>; }
function Stat({ label, value, icon: Icon }) { return <div className="rounded-xl border border-white/[0.08] bg-black/10 px-4 py-3"><p className="flex items-center gap-1.5 text-xs text-zinc-500"><Icon size={13} /> {label}</p><p className="mt-1 text-xl font-bold text-white">{value}</p></div>; }
function Info({ label, value }) { return <div><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 max-w-[140px] truncate font-medium text-white">{value}</p></div>; }
function Status({ status }) { const styles = { PENDING: "bg-amber-500/15 text-amber-300", APPROVED: "bg-emerald-500/15 text-emerald-300", REJECTED: "bg-red-500/15 text-red-300", CANCELLED: "bg-zinc-500/15 text-zinc-300" }; return <span className={"rounded-full px-2 py-1 text-[10px] font-bold " + (styles[status] || "bg-zinc-500/15 text-zinc-300")}>{status}</span>; }
function EmptyTransfers({ direction }) { return <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-8 text-center"><ArrowDownLeft size={36} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">No {direction} requests</h2><p className="mt-2 text-sm text-zinc-500">{direction === "incoming" ? "Transfer requests for your listings will appear here." : "Requests you make on marketplace listings will appear here."}</p></div>; }
function formatDate(value) { return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)); }

export default TransferRequestsPage;
