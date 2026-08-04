import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, BellRing, CheckCheck, CircleAlert, CreditCard, LoaderCircle, Tag } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "../../api/notification.api";

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const loadNotifications = useCallback(async () => {
    try { setLoading(true); setNotifications(await getNotifications()); setMessage(""); }
    catch (error) { setMessage(error.response?.data?.message || "Unable to load notifications."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { const timer = window.setTimeout(() => { void loadNotifications(); }, 0); return () => window.clearTimeout(timer); }, [loadNotifications]);
  const unread = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications]);
  const visible = filter === "unread" ? notifications.filter((item) => !item.isRead) : notifications;

  const readNotification = async (notificationId) => {
    const current = notifications.find((item) => item.id === notificationId);
    if (!current || current.isRead) return;
    try { setBusy(notificationId); await markNotificationRead(notificationId); setNotifications((items) => items.map((item) => item.id === notificationId ? { ...item, isRead: true } : item)); }
    catch (error) { setMessage(error.response?.data?.message || "Unable to update notification."); }
    finally { setBusy(""); }
  };

  const readAll = async () => {
    try { setBusy("all"); await markAllNotificationsRead(); setNotifications((items) => items.map((item) => ({ ...item, isRead: true }))); setMessage("All notifications marked as read."); }
    catch (error) { setMessage(error.response?.data?.message || "Unable to update notifications."); }
    finally { setBusy(""); }
  };

  return <DashboardLayout><main className="mx-auto w-full max-w-4xl pb-8"><section className="rounded-[28px] border border-white/[0.08] bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,.2),transparent_36%),#11121a] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-violet-300">Account updates</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Notifications</h1><p className="mt-2 text-sm text-zinc-400">Stay on top of your memberships, listings, and transfer activity.</p></div><div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3"><p className="text-xs text-violet-200/70">Unread updates</p><p className="mt-1 text-2xl font-bold text-white">{unread}</p></div></div></section>{message && <div className={`mt-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}><CircleAlert size={16} />{message}</div>}<section className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="flex flex-col gap-3 border-b border-white/[0.08] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex gap-2"><Filter active={filter === "all"} onClick={() => setFilter("all")} label="All" count={notifications.length} /><Filter active={filter === "unread"} onClick={() => setFilter("unread")} label="Unread" count={unread} /></div><button type="button" disabled={!unread || busy === "all"} onClick={readAll} className="inline-flex items-center gap-2 self-start rounded-xl border border-white/[0.1] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/[0.08] disabled:opacity-40"><CheckCheck size={15} /> {busy === "all" ? "Updating…" : "Mark all as read"}</button></div>{loading ? <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin" /> Loading notifications…</div> : visible.length ? <div>{visible.map((notification) => <NotificationRow key={notification.id} notification={notification} busy={busy === notification.id} onRead={readNotification} />)}</div> : <EmptyNotifications filter={filter} />}</section></main></DashboardLayout>;
}

function NotificationRow({ notification, busy, onRead }) { const Icon = notification.title?.toLowerCase().includes("transfer") ? Tag : notification.title?.toLowerCase().includes("membership") ? CreditCard : Bell; return <button type="button" onClick={() => onRead(notification.id)} className={`flex w-full items-start gap-4 border-b border-white/[0.07] p-4 text-left transition last:border-0 sm:px-6 ${notification.isRead ? "bg-transparent" : "bg-violet-500/[0.045] hover:bg-violet-500/[0.08]"}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${notification.isRead ? "bg-white/[0.05] text-zinc-400" : "bg-violet-500/15 text-violet-300"}`}><Icon size={18} /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="font-semibold text-white">{notification.title}</p>{!notification.isRead && <span className="h-2 w-2 rounded-full bg-violet-400" />}</div><p className="mt-1 text-sm leading-6 text-zinc-400">{notification.message}</p><p className="mt-2 text-xs text-zinc-600">{formatWhen(notification.createdAt)}</p></div>{busy && <LoaderCircle size={16} className="mt-1 shrink-0 animate-spin text-violet-300" />}</button>; }
function Filter({ active, onClick, label, count }) { return <button type="button" onClick={onClick} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}>{label} <span className="ml-1 opacity-70">{count}</span></button>; }
function EmptyNotifications({ filter }) { return <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><BellRing size={21} /></div><h2 className="mt-4 font-semibold text-white">{filter === "unread" ? "You’re all caught up" : "No notifications yet"}</h2><p className="mt-2 text-sm text-zinc-500">{filter === "unread" ? "There are no unread updates right now." : "Membership and marketplace updates will appear here."}</p></div>; }
function formatWhen(value) { const difference = Date.now() - new Date(value).getTime(); const minutes = Math.max(1, Math.floor(difference / 60000)); if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours}h ago`; return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value)); }

export default NotificationsPage;
