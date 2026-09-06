import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDownToLine,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  LoaderCircle,
  MessageCircleMore,
  Paperclip,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  TicketCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getAdminUsers } from "../../api/admin.api";
import {
  createSupportTicket,
  downloadSupportAttachment,
  getSupportTicket,
  getSupportTickets,
  reopenSupportTicket,
  replyToSupportTicket,
  updateSupportTicket,
} from "../../api/support-ticket.api";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";

const CATEGORIES = [
  ["TRANSFER", "Transfer"],
  ["PAYMENT", "Payment"],
  ["MEMBERSHIP", "Membership"],
  ["GYM", "Gym"],
  ["LISTING", "Listing"],
  ["ACCOUNT", "Account"],
  ["TECHNICAL", "Technical issue"],
  ["OTHER", "Other"],
];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CLOSED"];
const RELATED_TYPES = ["NONE", "MEMBERSHIP", "TRANSFER", "PAYMENT", "LISTING", "GYM", "TRIAL"];
const INITIAL_DRAFT = { category: "OTHER", subject: "", priority: "NORMAL", description: "", relatedType: "NONE", relatedEntityId: "" };

const formatDate = (value, withTime = true) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric", ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
};
const displayName = (person) => [person?.firstName, person?.lastName].filter(Boolean).join(" ") || person?.email || "FitSwap support";
const errorMessage = (error, fallback) => error?.response?.data?.message || fallback;
const statusLabel = (status) => String(status || "OPEN").replaceAll("_", " ");
const isClosed = (status) => ["RESOLVED", "CLOSED"].includes(status);

function SupportTicketsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === "ADMIN";
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [draft, setDraft] = useState(INITIAL_DRAFT);
  const [filters, setFilters] = useState({ search: "", status: "", priority: "", assigned: "" });
  const [reply, setReply] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [savingTicket, setSavingTicket] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const fileInputRef = useRef(null);

  const loadTickets = useCallback(async ({ keepSelection = true } = {}) => {
    try {
      setLoadingList(true);
      const data = await getSupportTickets({
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(isAdmin && filters.assigned ? { assigned: filters.assigned } : {}),
      });
      setTickets(data || []);
      if (!keepSelection || !data?.some((ticket) => ticket.id === selectedId)) {
        setSelectedId(data?.[0]?.id || "");
      }
    } catch (error) {
      showToast(errorMessage(error, "Unable to load support tickets."), "error");
    } finally {
      setLoadingList(false);
    }
  }, [filters, isAdmin, selectedId, showToast]);

  const loadTicket = useCallback(async (ticketId) => {
    if (!ticketId) {
      setSelectedTicket(null);
      return;
    }
    try {
      setLoadingDetail(true);
      setSelectedTicket(await getSupportTicket(ticketId));
    } catch (error) {
      showToast(errorMessage(error, "Unable to load this ticket."), "error");
      setSelectedTicket(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTickets({ keepSelection: false }); }, 0);
    return () => window.clearTimeout(timer);
    // Filters intentionally drive the server-side listing.
  }, [filters.status, filters.priority, filters.assigned, isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadTicket(selectedId); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadTicket, selectedId]);

  useEffect(() => {
    if (!isAdmin) return undefined;
    let active = true;
    getAdminUsers()
      .then((people) => { if (active) setAdminUsers((people || []).filter((person) => person.role === "ADMIN" && person.isActive)); })
      .catch(() => { if (active) setAdminUsers(user ? [user] : []); });
    return () => { active = false; };
  }, [isAdmin, user]);

  const selectedSummary = useMemo(() => tickets.find((ticket) => ticket.id === selectedId), [tickets, selectedId]);
  const activeTicket = selectedTicket || selectedSummary;

  const submitTicket = async (event) => {
    event.preventDefault();
    if (draft.subject.trim().length < 3 || draft.description.trim().length < 10) {
      showToast("Add a subject and at least 10 characters of detail.", "error");
      return;
    }
    if (draft.relatedType !== "NONE" && !draft.relatedEntityId.trim()) {
      showToast("Add the related record ID or choose “No linked record”.", "error");
      return;
    }
    try {
      setSubmitting(true);
      const ticket = await createSupportTicket({
        ...draft,
        subject: draft.subject.trim(),
        description: draft.description.trim(),
        relatedEntityId: draft.relatedEntityId.trim() || undefined,
      });
      setDraft(INITIAL_DRAFT);
      setShowComposer(false);
      setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)]);
      setSelectedId(ticket.id);
      setSelectedTicket(ticket);
      showToast(`Ticket ${ticket.ticketNumber} created. The support team has been notified.`);
    } catch (error) {
      showToast(errorMessage(error, "Unable to create the support ticket."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!activeTicket || (!reply.trim() && !attachments.length)) return;
    try {
      setSubmitting(true);
      const nextTicket = await replyToSupportTicket(activeTicket.id, { body: reply, attachments });
      setReply("");
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSelectedTicket(nextTicket);
      setTickets((current) => [nextTicket, ...current.filter((ticket) => ticket.id !== nextTicket.id)]);
      showToast("Reply sent.");
    } catch (error) {
      showToast(errorMessage(error, "Unable to send this reply."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const manageTicket = async (payload, successMessage) => {
    if (!activeTicket) return;
    try {
      setSavingTicket(true);
      const nextTicket = await updateSupportTicket(activeTicket.id, payload);
      setSelectedTicket(nextTicket);
      setTickets((current) => current.map((ticket) => ticket.id === nextTicket.id ? { ...ticket, ...nextTicket } : ticket));
      showToast(successMessage);
    } catch (error) {
      showToast(errorMessage(error, "Unable to update this support ticket."), "error");
    } finally {
      setSavingTicket(false);
    }
  };

  const reopen = async () => {
    if (!activeTicket) return;
    try {
      setSavingTicket(true);
      const nextTicket = await reopenSupportTicket(activeTicket.id);
      setSelectedTicket(nextTicket);
      setTickets((current) => [nextTicket, ...current.filter((ticket) => ticket.id !== nextTicket.id)]);
      showToast("Ticket reopened and queued for another review.");
    } catch (error) {
      showToast(errorMessage(error, "Unable to reopen this ticket."), "error");
    } finally {
      setSavingTicket(false);
    }
  };

  const pickAttachments = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 3 || files.some((file) => file.size > 5 * 1024 * 1024)) {
      showToast("Choose up to three PDF or image files, each 5 MB or smaller.", "error");
      event.target.value = "";
      return;
    }
    if (files.reduce((total, file) => total + file.size, 0) > 10 * 1024 * 1024) {
      showToast("Attachments must total 10 MB or less.", "error");
      event.target.value = "";
      return;
    }
    setAttachments(files);
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_88%_8%,rgba(168,85,247,.25),transparent_28%),radial-gradient(circle_at_3%_100%,rgba(59,130,246,.15),transparent_35%),#11121a] p-6 shadow-2xl shadow-violet-950/15 sm:p-8">
          <span className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full border border-violet-200/10" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-300">FitSwap care centre</p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">{isAdmin ? "Support operations" : "Help & support"}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{isAdmin ? "Work through member and gym-owner cases with a complete, auditable conversation history." : "Ask for help with a membership, payment, transfer, gym, listing, or account issue. Every update stays in one private thread."}</p>
            </div>
            {!isAdmin && <button type="button" onClick={() => setShowComposer(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"><Plus size={17} /> Create a ticket</button>}
          </div>
        </section>

        {showComposer && <TicketComposer draft={draft} onChange={setDraft} submitting={submitting} onClose={() => setShowComposer(false)} onSubmit={submitTicket} />}

        <section className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#11121a] shadow-xl shadow-black/10">
          <div className="grid min-h-[680px] xl:grid-cols-[330px_minmax(0,1fr)]">
            <aside className={`border-b border-white/[0.08] xl:border-b-0 xl:border-r ${activeTicket ? "hidden xl:block" : "block"}`}>
              <TicketListHeader filters={filters} setFilters={setFilters} isAdmin={isAdmin} loading={loadingList} onRefresh={() => void loadTickets()} />
              <div className="max-h-[560px] overflow-y-auto xl:max-h-[610px]">
                {loadingList ? <Loading label="Loading tickets…" compact /> : tickets.length ? tickets.map((ticket) => <TicketListItem key={ticket.id} ticket={ticket} selected={ticket.id === selectedId} isAdmin={isAdmin} onClick={() => setSelectedId(ticket.id)} />) : <EmptyTickets isAdmin={isAdmin} onCreate={() => setShowComposer(true)} />}
              </div>
            </aside>
            <section className={`${activeTicket ? "block" : "hidden xl:block"} min-w-0`}>
              {loadingDetail ? <Loading label="Loading conversation…" /> : activeTicket ? <TicketDetail
                ticket={activeTicket}
                user={user}
                isAdmin={isAdmin}
                adminUsers={adminUsers}
                reply={reply}
                attachments={attachments}
                inputRef={fileInputRef}
                busy={submitting || savingTicket}
                onBack={() => setSelectedId("")}
                onReplyChange={setReply}
                onPickAttachments={pickAttachments}
                onRemoveAttachment={(index) => setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                onSend={sendReply}
                onReopen={reopen}
                onManage={manageTicket}
              /> : <EmptyConversation />}
            </section>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

function TicketComposer({ draft, onChange, onClose, onSubmit, submitting }) {
  const setField = (field, value) => onChange((current) => ({ ...current, [field]: value, ...(field === "relatedType" && value === "NONE" ? { relatedEntityId: "" } : {}) }));
  return <section className="rounded-3xl border border-violet-400/20 bg-[#11121a] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-violet-200">New support ticket</p><p className="mt-1 text-sm text-zinc-500">Please do not include passwords, card PINs, or full bank-account numbers.</p></div><button type="button" aria-label="Close ticket form" onClick={onClose} className="rounded-lg p-2 text-zinc-500 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button></div><form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}><Field label="Category"><select value={draft.category} onChange={(event) => setField("category", event.target.value)} className={fieldClass}>{CATEGORIES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Priority"><select value={draft.priority} onChange={(event) => setField("priority", event.target.value)} className={fieldClass}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{statusLabel(priority)}</option>)}</select></Field><Field label="Subject" className="sm:col-span-2"><input required minLength={3} maxLength={140} value={draft.subject} onChange={(event) => setField("subject", event.target.value)} placeholder="Briefly describe the issue" className={fieldClass} /></Field><Field label="Details" className="sm:col-span-2"><textarea required minLength={10} maxLength={5000} value={draft.description} onChange={(event) => setField("description", event.target.value)} placeholder="Tell us what happened, what you expected, and any useful dates or references." rows={5} className={`${fieldClass} resize-y`} /></Field><Field label="Linked record (optional)"><select value={draft.relatedType} onChange={(event) => setField("relatedType", event.target.value)} className={fieldClass}>{RELATED_TYPES.map((type) => <option key={type} value={type}>{type === "NONE" ? "No linked record" : statusLabel(type)}</option>)}</select></Field><Field label="Record ID" hint={draft.relatedType === "NONE" ? "Choose a record type first" : "Only records you can access are accepted"}><input disabled={draft.relatedType === "NONE"} value={draft.relatedEntityId} onChange={(event) => setField("relatedEntityId", event.target.value)} placeholder="Paste the FitSwap record ID" className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-45`} /></Field><div className="sm:col-span-2 flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="rounded-xl border border-white/[0.1] px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:bg-white/[0.05]">Cancel</button><button disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-55"><TicketCheck size={16} />{submitting ? "Creating…" : "Create ticket"}</button></div></form></section>;
}

function TicketListHeader({ filters, setFilters, isAdmin, loading, onRefresh }) { return <div className="border-b border-white/[0.08] p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">{isAdmin ? "All cases" : "My tickets"}</p><p className="mt-1 text-xs text-zinc-500">Newest activity first</p></div><button type="button" onClick={onRefresh} aria-label="Refresh tickets" className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white"><RefreshCw className={loading ? "animate-spin" : ""} size={16} /></button></div><label className="relative mt-4 block"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" /><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} onKeyDown={(event) => { if (event.key === "Enter") onRefresh(); }} placeholder="Search subject or ticket" className="w-full rounded-xl border border-white/[0.09] bg-black/20 py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400" /></label><div className="mt-3 grid grid-cols-2 gap-2"><select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} className={filterClass}><option value="">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))} className={filterClass}><option value="">All priorities</option>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{statusLabel(priority)}</option>)}</select>{isAdmin && <select value={filters.assigned} onChange={(event) => setFilters((current) => ({ ...current, assigned: event.target.value }))} className={`col-span-2 ${filterClass}`}><option value="">All assignments</option><option value="me">Assigned to me</option></select>}</div></div>; }

function TicketListItem({ ticket, selected, isAdmin, onClick }) { return <button type="button" onClick={onClick} className={`w-full border-b border-white/[0.06] p-4 text-left transition last:border-b-0 ${selected ? "bg-violet-500/[0.11]" : "hover:bg-white/[0.035]"}`}><div className="flex items-start justify-between gap-3"><span className="text-[10px] font-bold tracking-[0.1em] text-violet-300">{ticket.ticketNumber}</span><StatusBadge status={ticket.status} /></div><p className="mt-2 truncate text-sm font-semibold text-white">{ticket.subject}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{ticket.latestMessage?.body || ticket.relatedLabel || "No message preview"}</p><div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-zinc-600"><span className="inline-flex items-center gap-1"><MessageCircleMore size={12} /> {ticket._count?.messages || 0}</span><span>{isAdmin ? displayName(ticket.creator) : formatDate(ticket.lastMessageAt, false)}</span></div></button>; }

function TicketDetail({ ticket, user, isAdmin, adminUsers, reply, attachments, inputRef, busy, onBack, onReplyChange, onPickAttachments, onRemoveAttachment, onSend, onReopen, onManage }) { const inactive = isClosed(ticket.status); return <div className="flex min-h-[680px] flex-col"><header className="border-b border-white/[0.08] p-4 sm:p-5"><div className="flex items-start gap-3"><button type="button" onClick={onBack} aria-label="Back to ticket list" className="mt-0.5 rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white xl:hidden"><ChevronLeft size={19} /></button><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold tracking-[0.1em] text-violet-300">{ticket.ticketNumber}</span><StatusBadge status={ticket.status} /><PriorityBadge priority={ticket.priority} /></div><h2 className="mt-2 text-lg font-semibold text-white sm:text-xl">{ticket.subject}</h2><p className="mt-1 text-xs text-zinc-500">Opened {formatDate(ticket.createdAt)} · {ticket.category.toLowerCase()} request</p></div></div>{ticket.relatedLabel && <div className="mt-4 flex items-center gap-2 rounded-xl border border-sky-400/15 bg-sky-500/[0.06] px-3 py-2.5 text-xs text-sky-100"><FileText size={15} className="shrink-0 text-sky-300" /><span className="min-w-0 truncate">Related: {ticket.relatedLabel}</span></div>}{isAdmin && <AdminControls ticket={ticket} admins={adminUsers} disabled={busy} onManage={onManage} />}</header><div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-black/[0.08] p-4 sm:p-5">{ticket.messages?.map((message) => <MessageBubble key={message.id} message={message} viewer={user} ticketId={ticket.id} isAdmin={isAdmin} />)}{ticket.auditLogs?.length > 0 && <AuditTimeline logs={ticket.auditLogs} />}</div>{inactive ? <div className="border-t border-white/[0.08] bg-[#11121a] p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">This ticket is {ticket.status.toLowerCase()}.</p><p className="mt-1 text-xs text-zinc-500">{isAdmin ? "Change the status above if follow-up is required." : "Reopen it if you still need help."}</p></div>{!isAdmin && <button disabled={busy} type="button" onClick={onReopen} className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-semibold text-violet-200 hover:bg-violet-500/20 disabled:opacity-50"><RotateCcw size={15} /> Reopen ticket</button>}</div></div> : <ReplyComposer reply={reply} attachments={attachments} inputRef={inputRef} busy={busy} onChange={onReplyChange} onPick={onPickAttachments} onRemove={onRemoveAttachment} onSubmit={onSend} />}</div>; }

function AdminControls({ ticket, admins, disabled, onManage }) { return <div className="mt-4 grid gap-2 border-t border-white/[0.07] pt-4 sm:grid-cols-3"><label className="text-[11px] font-medium text-zinc-500">Status<select disabled={disabled} value={ticket.status} onChange={(event) => onManage({ status: event.target.value }, "Ticket status updated.")} className={`mt-1.5 w-full ${filterClass}`} >{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label><label className="text-[11px] font-medium text-zinc-500">Priority<select disabled={disabled} value={ticket.priority} onChange={(event) => onManage({ priority: event.target.value }, "Ticket priority updated.")} className={`mt-1.5 w-full ${filterClass}`}>{PRIORITIES.map((priority) => <option key={priority} value={priority}>{statusLabel(priority)}</option>)}</select></label><label className="text-[11px] font-medium text-zinc-500">Assignee<select disabled={disabled} value={ticket.assignedToId || ""} onChange={(event) => onManage({ assignedToId: event.target.value || null }, "Ticket assignment updated.")} className={`mt-1.5 w-full ${filterClass}`}><option value="">Unassigned</option>{admins.map((admin) => <option key={admin.id} value={admin.id}>{displayName(admin)}</option>)}</select></label></div>; }

function MessageBubble({ message, viewer, ticketId }) { const mine = message.senderId === viewer?.id; const senderIsAdmin = message.sender?.role === "ADMIN"; return <article className={`flex gap-3 ${mine ? "flex-row-reverse" : ""}`}><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${senderIsAdmin ? "bg-sky-500/15 text-sky-300" : "bg-violet-500/15 text-violet-300"}`}>{senderIsAdmin ? <ShieldCheck size={17} /> : <UserRound size={17} />}</div><div className={`max-w-[88%] sm:max-w-[76%] ${mine ? "text-right" : ""}`}><div className="mb-1 flex items-center gap-2 text-[11px] text-zinc-500"><span className={mine ? "order-2" : ""}>{mine ? "You" : displayName(message.sender)}</span>{senderIsAdmin && <span className="rounded-full bg-sky-500/10 px-1.5 py-0.5 font-semibold text-sky-300">SUPPORT</span>}<span>{formatDate(message.createdAt)}</span></div><div className={`rounded-2xl border px-4 py-3 text-left text-sm leading-6 ${mine ? "border-violet-400/20 bg-violet-600/15 text-violet-50" : "border-white/[0.08] bg-[#161720] text-zinc-200"}`}><p className="whitespace-pre-wrap break-words">{message.body}</p>{message.attachments?.length > 0 && <div className="mt-3 space-y-2 border-t border-white/10 pt-3">{message.attachments.map((attachment) => <button type="button" key={attachment.id} onClick={() => void downloadSupportAttachment(ticketId, attachment.id, attachment.fileName)} className="flex w-full items-center gap-2 rounded-lg bg-black/15 px-2.5 py-2 text-left text-xs text-violet-100 hover:bg-black/25"><Paperclip size={14} /><span className="min-w-0 flex-1 truncate">{attachment.fileName}</span><span className="text-zinc-500">{Math.max(1, Math.round(attachment.byteSize / 1024))} KB</span><ArrowDownToLine size={14} /></button>)}</div>}</div></div></article>; }

function AuditTimeline({ logs }) { return <details className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3"><summary className="cursor-pointer text-xs font-semibold text-zinc-400">Ticket activity ({logs.length})</summary><div className="mt-3 space-y-3 border-l border-white/[0.1] pl-4">{logs.map((log) => <div key={log.id} className="relative text-xs"><span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-violet-400" /><p className="font-medium text-zinc-300">{log.detail || statusLabel(log.action)}</p><p className="mt-1 text-zinc-600">{formatDate(log.createdAt)} · {log.actorRole?.replaceAll("_", " ")}</p></div>)}</div></details>; }

function ReplyComposer({ reply, attachments, inputRef, busy, onChange, onPick, onRemove, onSubmit }) { return <form onSubmit={onSubmit} className="border-t border-white/[0.08] bg-[#11121a] p-4 sm:p-5"><textarea value={reply} onChange={(event) => onChange(event.target.value)} maxLength={5000} rows={3} placeholder="Write a reply…" className={`${fieldClass} resize-none`} />{attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{attachments.map((file, index) => <span key={`${file.name}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-lg border border-violet-400/20 bg-violet-500/10 px-2.5 py-1.5 text-xs text-violet-100"><Paperclip size={13} /><span className="max-w-40 truncate">{file.name}</span><button type="button" aria-label={`Remove ${file.name}`} onClick={() => onRemove(index)} className="rounded text-violet-200 hover:text-white"><X size={14} /></button></span>)}</div>}<div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><div><input ref={inputRef} id="support-attachments" type="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp" onChange={onPick} className="sr-only" /><label htmlFor="support-attachments" className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/[0.1] px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-white/[0.06]"><Paperclip size={15} /> Attach files</label><p className="mt-1.5 text-[10px] text-zinc-600">PDF, JPG, PNG, or WEBP · up to 3 files · 5 MB each</p></div><button disabled={busy || (!reply.trim() && !attachments.length)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"><Send size={15} />{busy ? "Sending…" : "Send reply"}</button></div></form>; }

function StatusBadge({ status }) { const styles = { OPEN: "bg-violet-500/15 text-violet-200", IN_PROGRESS: "bg-sky-500/15 text-sky-200", WAITING_FOR_USER: "bg-amber-500/15 text-amber-200", RESOLVED: "bg-emerald-500/15 text-emerald-200", CLOSED: "bg-zinc-500/15 text-zinc-300" }; return <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${styles[status] || styles.OPEN}`}>{statusLabel(status)}</span>; }
function PriorityBadge({ priority }) { const styles = { LOW: "text-zinc-400", NORMAL: "text-sky-300", HIGH: "text-amber-300", URGENT: "text-red-300" }; return <span className={`text-[10px] font-bold tracking-wide ${styles[priority] || styles.NORMAL}`}>{priority}</span>; }
function Loading({ label, compact = false }) { return <div className={`flex ${compact ? "min-h-64" : "min-h-[680px]"} items-center justify-center gap-2 text-sm text-zinc-500`}><LoaderCircle size={18} className="animate-spin text-violet-400" /> {label}</div>; }
function EmptyTickets({ isAdmin, onCreate }) { return <div className="flex min-h-72 flex-col items-center justify-center p-6 text-center"><TicketCheck size={30} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">{isAdmin ? "No support cases found" : "No tickets yet"}</h2><p className="mt-2 text-sm leading-6 text-zinc-500">{isAdmin ? "Try clearing a filter or come back when a member needs help." : "Create a private ticket and FitSwap support will reply here."}</p>{!isAdmin && <button type="button" onClick={onCreate} className="mt-4 rounded-xl bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-violet-500">Create a ticket</button>}</div>; }
function EmptyConversation() { return <div className="flex min-h-[680px] flex-col items-center justify-center p-8 text-center"><CircleHelp size={36} className="text-violet-400" /><h2 className="mt-4 font-semibold text-white">Choose a ticket</h2><p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">Select a ticket from the list to read the conversation and send an update.</p></div>; }
function Field({ label, hint, className = "", children }) { return <label className={`block ${className}`}><span className="mb-1.5 block text-xs font-medium text-zinc-300">{label}</span>{children}{hint && <span className="mt-1.5 block text-[11px] text-zinc-600">{hint}</span>}</label>; }
const fieldClass = "w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400";
const filterClass = "rounded-lg border border-white/[0.1] bg-black/20 px-2.5 py-2 text-xs text-zinc-300 outline-none focus:border-violet-400";

export default SupportTicketsPage;
