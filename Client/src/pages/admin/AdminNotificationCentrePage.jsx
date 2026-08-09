import { useEffect, useMemo, useState } from "react";
import { BellRing, LoaderCircle, Megaphone, Search, Send, UsersRound } from "lucide-react";

import { createAnnouncement, getAnnouncementRecipients, getAnnouncements } from "../../api/admin.api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import DashboardLayout from "../../layouts/DashboardLayout";

const audienceOptions = [
  { value: "ALL_USERS", label: "All members & gym owners", note: "Send an in-app announcement across the platform." },
  { value: "MEMBERS", label: "Members only", note: "Send only to users with a FitSwap membership account." },
  { value: "GYM_OWNERS", label: "Gym owners only", note: "Send only to business partners and gym owners." },
  { value: "SELECTED_USERS", label: "Selected people", note: "Choose individual members or gym owners below." },
];
const date = (value) => new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
const name = (user) => [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin";

function AdminNotificationCentrePage() {
  const [recipients, setRecipients] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ title: "", message: "", audience: "ALL_USERS", recipientIds: [] });

  const load = async () => {
    setLoading(true);
    try {
      const [recipientData, announcementData] = await Promise.all([getAnnouncementRecipients(), getAnnouncements()]);
      setRecipients(Array.isArray(recipientData) ? recipientData : []);
      setAnnouncements(Array.isArray(announcementData) ? announcementData : []);
      setMessage("");
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to load the notification centre.");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const selectedAudience = audienceOptions.find((option) => option.value === form.audience);
  const visibleRecipients = useMemo(() => recipients.filter((recipient) => `${recipient.firstName} ${recipient.lastName} ${recipient.email}`.toLowerCase().includes(search.toLowerCase())), [recipients, search]);
  const toggleRecipient = (id) => setForm((current) => ({ ...current, recipientIds: current.recipientIds.includes(id) ? current.recipientIds.filter((recipientId) => recipientId !== id) : [...current.recipientIds, id] }));

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      const announcement = await createAnnouncement(form);
      setAnnouncements((current) => [announcement, ...current]);
      setForm({ title: "", message: "", audience: form.audience, recipientIds: [] });
      setMessage(`Announcement sent to ${announcement.recipientCount} recipient${announcement.recipientCount === 1 ? "" : "s"}.`);
    } catch (requestError) {
      setMessage(requestError.response?.data?.message || "Unable to send the announcement.");
    } finally { setSending(false); }
  };

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 pb-8"><AdminPageHeader eyebrow="Notification centre" title="Reach the right audience" description="Send important in-app announcements to everyone, a specific role, or selected people. Every campaign is saved for review." icon={Megaphone} />
    {message && <p className={`rounded-xl border px-4 py-3 text-sm ${message.includes("Unable") ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}>{message}</p>}
    {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle className="animate-spin text-sky-400" size={20} /> Loading notification centre…</div> : <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,.85fr)]"><form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div><h2 className="font-semibold text-white">Create announcement</h2><p className="mt-1 text-sm text-zinc-500">Announcements appear in the recipient’s FitSwap notification centre.</p></div><label className="block"><span className="text-sm font-medium text-zinc-200">Title</span><input required maxLength="100" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Scheduled maintenance" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-400/60" /></label><label className="block"><span className="text-sm font-medium text-zinc-200">Message</span><textarea required maxLength="1000" rows="5" value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} placeholder="Tell recipients what they need to know…" className="mt-2 w-full resize-y rounded-xl border border-white/[0.1] bg-black/15 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-sky-400/60" /></label><fieldset><legend className="text-sm font-medium text-zinc-200">Audience</legend><div className="mt-2 grid gap-2">{audienceOptions.map((option) => <label key={option.value} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${form.audience === option.value ? "border-sky-400/40 bg-sky-500/[0.08]" : "border-white/[0.08] bg-black/10 hover:bg-white/[0.03]"}`}><input checked={form.audience === option.value} onChange={() => setForm((current) => ({ ...current, audience: option.value, recipientIds: [] }))} type="radio" name="audience" className="mt-1 accent-sky-400" /><span><span className="block text-sm font-medium text-white">{option.label}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{option.note}</span></span></label>)}</div></fieldset>
      {form.audience === "SELECTED_USERS" && <section className="rounded-xl border border-white/[0.08] bg-black/10 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-medium text-zinc-200">Choose recipients</p><span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300">{form.recipientIds.length} selected</span></div><div className="relative mt-3"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name or email" className="w-full rounded-lg border border-white/[0.1] bg-[#11121a] py-2 pl-9 pr-3 text-sm text-white outline-none placeholder:text-zinc-600" /></div><div className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1">{visibleRecipients.map((recipient) => <label key={recipient.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.04]"><input checked={form.recipientIds.includes(recipient.id)} onChange={() => toggleRecipient(recipient.id)} type="checkbox" className="accent-sky-400" /><span className="grid h-7 w-7 place-items-center rounded-full bg-violet-500/15 text-[10px] font-bold text-violet-200">{recipient.firstName?.[0]}{recipient.lastName?.[0]}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-zinc-200">{name(recipient)}</span><span className="block truncate text-[11px] text-zinc-500">{recipient.email}</span></span><span className="text-[10px] font-semibold text-zinc-500">{recipient.role === "GYM_OWNER" ? "OWNER" : "MEMBER"}</span></label>)}</div></section>}
      <button disabled={sending || (form.audience === "SELECTED_USERS" && !form.recipientIds.length)} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-950/25 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"><Send size={16} /> {sending ? "Sending announcement…" : `Send to ${selectedAudience?.label || "audience"}`}</button></form>
      <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a]"><div className="flex items-start justify-between border-b border-white/[0.08] px-5 py-4"><div><h2 className="font-semibold text-white">Recent announcements</h2><p className="mt-1 text-sm text-zinc-500">Latest platform communication</p></div><BellRing size={19} className="text-sky-300" /></div>{announcements.length ? <div className="divide-y divide-white/[0.06]">{announcements.map((announcement) => <article key={announcement.id} className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="font-medium text-white">{announcement.title}</h3><span className="shrink-0 rounded-full bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-300">{announcement.recipientCount}</span></div><p className="mt-2 text-sm leading-6 text-zinc-400">{announcement.message}</p><div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500"><span>{announcement.audience.replaceAll("_", " ")}</span><span>·</span><span>{date(announcement.createdAt)}</span>{announcement.admin && <><span>·</span><span>by {name(announcement.admin)}</span></>}</div></article>)}</div> : <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><UsersRound size={30} className="text-sky-400" /><p className="mt-4 font-medium text-white">No announcements sent</p><p className="mt-2 text-sm leading-6 text-zinc-500">Your platform updates will be saved here after they are sent.</p></div>}</section></div>}
  </main></DashboardLayout>;
}

export default AdminNotificationCentrePage;
