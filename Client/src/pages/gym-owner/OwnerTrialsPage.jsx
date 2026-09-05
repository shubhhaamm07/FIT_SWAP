import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  Building2,
  CalendarClock,
  Check,
  CircleAlert,
  LoaderCircle,
  Plus,
  RefreshCw,
  UserCheck,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getMyGyms } from "../../api/gym.api";
import {
  createOwnerTrialSlot,
  deactivateOwnerTrialSlot,
  getOwnerTrialBookings,
  getOwnerTrialSlots,
  updateOwnerTrialBookingStatus,
} from "../../api/trial-booking.api";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];
const BOOKING_STATUSES = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW", "CANCELLED"];

const asArray = (value) => Array.isArray(value) ? value : [];

const formatDate = (value) => new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(value));

const formatTime = (value) => new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const localDateTimeValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const initialTimes = () => {
  const start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return { startAt: localDateTimeValue(start), endAt: localDateTimeValue(end) };
};

const initialForm = () => ({
  gymId: "",
  ...initialTimes(),
  capacity: "10",
  requiresApproval: false,
});

const statusClasses = {
  PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  CONFIRMED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  COMPLETED: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  NO_SHOW: "border-red-400/20 bg-red-400/10 text-red-300",
  CANCELLED: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
};

function OwnerTrialsPage() {
  const [gyms, setGyms] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("slots");
  const [gymFilter, setGymFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [gymData, slotData, bookingData] = await Promise.all([
        getMyGyms(),
        getOwnerTrialSlots(),
        getOwnerTrialBookings(),
      ]);
      const nextGyms = asArray(gymData);
      setGyms(nextGyms);
      setSlots(asArray(slotData));
      setBookings(asArray(bookingData));
      const firstApprovedGym = nextGyms.find((gym) => gym.status === "APPROVED");
      setForm((current) => ({
        ...current,
        gymId: nextGyms.some((gym) => gym.id === current.gymId && gym.status === "APPROVED")
          ? current.gymId
          : firstApprovedGym?.id || "",
      }));
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to load trial management." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const visibleSlots = useMemo(() => slots.filter(
    (slot) => !gymFilter || slot.gymId === gymFilter
  ), [gymFilter, slots]);

  const approvedGyms = useMemo(() => gyms.filter(
    (gym) => gym.status === "APPROVED"
  ), [gyms]);

  const visibleBookings = useMemo(() => bookings.filter((booking) => {
    const gymMatches = !gymFilter || booking.slot?.gymId === gymFilter;
    const statusMatches = statusFilter === "ALL" || booking.status === statusFilter;
    return gymMatches && statusMatches;
  }), [bookings, gymFilter, statusFilter]);

  const pendingCount = useMemo(() => bookings.filter(
    (booking) => booking.status === "PENDING"
  ).length, [bookings]);

  const upcomingCount = useMemo(() => slots.filter(
    (slot) => slot.isActive && new Date(slot.startAt) > new Date()
  ).length, [slots]);

  const handleCreateSlot = async (event) => {
    event.preventDefault();
    try {
      setBusyId("create-slot");
      setNotice(null);
      await createOwnerTrialSlot({
        gymId: form.gymId,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        capacity: Number(form.capacity),
        requiresApproval: form.requiresApproval,
      });
      setNotice({ type: "success", text: "Trial slot created and available to members." });
      setShowForm(false);
      setForm((current) => ({ ...initialForm(), gymId: current.gymId }));
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to create the trial slot." });
    } finally {
      setBusyId("");
    }
  };

  const handleDeactivate = async (slot) => {
    const reason = window.prompt(
      "Why is this trial slot being cancelled? Booked members will be notified.",
      "This session is no longer available."
    );
    if (reason === null) return;
    try {
      setBusyId(slot.id);
      setNotice(null);
      await deactivateOwnerTrialSlot(slot.id, reason);
      setNotice({ type: "success", text: "Trial slot deactivated. Affected bookings were cancelled." });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to deactivate this trial slot." });
    } finally {
      setBusyId("");
    }
  };

  const handleBookingStatus = async (booking, status) => {
    let reason;
    if (status === "CANCELLED") {
      reason = window.prompt("Why are you cancelling this booking?", "The gym cannot host this trial.");
      if (reason === null) return;
    } else if (!window.confirm(`Mark trial ${booking.bookingReference} as ${status.replaceAll("_", " ").toLowerCase()}?`)) {
      return;
    }

    try {
      setBusyId(booking.id);
      setNotice(null);
      await updateOwnerTrialBookingStatus(booking.id, status, reason);
      setNotice({ type: "success", text: `Trial ${booking.bookingReference} updated to ${status.replaceAll("_", " ").toLowerCase()}.` });
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to update this trial booking." });
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(circle_at_84%_15%,rgba(16,185,129,.24),transparent_27%),radial-gradient(circle_at_62%_120%,rgba(124,58,237,.2),transparent_34%),#11121a] p-6 sm:p-8">
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">Member acquisition</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Gym trial sessions</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Publish controlled-capacity trial slots, review member requests, and record attendance without creating temporary memberships.</p></div>
            <div className="flex gap-3"><Metric value={upcomingCount} label="Upcoming slots" icon={CalendarClock} /><Metric value={pendingCount} label="Need approval" icon={UserCheck} /></div>
          </div>
        </section>

        {notice && <div aria-live="polite" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === "error" ? "border-red-500/20 bg-red-500/[0.07] text-red-300" : "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"}`}><CircleAlert size={17} /><span>{notice.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)} className="ml-auto rounded-md p-1 hover:bg-white/10"><X size={15} /></button></div>}

        <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#11121a] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-black/20 p-1" role="tablist" aria-label="Trial management">
            <Tab active={activeTab === "slots"} onClick={() => setActiveTab("slots")} icon={CalendarClock} label={`Slots (${slots.length})`} />
            <Tab active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} icon={UsersRound} label={`Bookings (${bookings.length})`} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select aria-label="Filter by gym" value={gymFilter} onChange={(event) => setGymFilter(event.target.value)} className="rounded-xl border border-white/[0.1] bg-[#0c0d13] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60"><option value="">All my gyms</option>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}</select>
            {activeTab === "bookings" && <select aria-label="Filter by booking status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-white/[0.1] bg-[#0c0d13] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60">{BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>}
            {activeTab === "slots" && <button type="button" disabled={!approvedGyms.length} onClick={() => setShowForm((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-40"><Plus size={16} /> New slot</button>}
          </div>
        </section>

        {showForm && activeTab === "slots" && approvedGyms.length > 0 && <SlotForm gyms={approvedGyms} form={form} setForm={setForm} busy={busyId === "create-slot"} onSubmit={handleCreateSlot} onClose={() => setShowForm(false)} />}

        {loading ? <Loading /> : activeTab === "slots" ? (
          !approvedGyms.length ? <Empty icon={Building2} title={gyms.length ? "Your gym is awaiting approval" : "Add and approve a gym first"} text="Trial slots can only be published after a gym has been approved by FitSwap." onRefresh={() => void loadData()} /> : visibleSlots.length ? <section className="grid gap-4 md:grid-cols-2" aria-label="Gym trial slots">{visibleSlots.map((slot) => <OwnerSlotCard key={slot.id} slot={slot} busy={busyId === slot.id} onDeactivate={handleDeactivate} />)}</section> : <Empty icon={CalendarClock} title="No trial slots found" text="Create a future session and choose how many members can attend." onRefresh={() => setShowForm(true)} />
        ) : visibleBookings.length ? <section className="space-y-3" aria-label="Gym trial bookings">{visibleBookings.map((booking) => <OwnerBookingRow key={booking.id} booking={booking} busy={busyId === booking.id} onStatus={handleBookingStatus} />)}</section> : <Empty icon={UsersRound} title="No trial bookings found" text="Member bookings will appear here after you publish trial slots." onRefresh={() => void loadData()} />}
      </main>
    </DashboardLayout>
  );
}

function Metric({ value, label, icon: Icon }) {
  return <div className="min-w-28 rounded-2xl border border-white/[0.09] bg-black/20 px-4 py-3"><div className="flex items-center gap-2 text-zinc-400"><Icon size={14} /><span className="text-xs">{label}</span></div><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
}

function Tab({ active, onClick, icon: Icon, label }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${active ? "bg-violet-600 text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}><Icon size={16} />{label}</button>;
}

function SlotForm({ gyms, form, setForm, busy, onSubmit, onClose }) {
  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return <form onSubmit={onSubmit} className="rounded-2xl border border-violet-500/20 bg-[linear-gradient(135deg,rgba(124,58,237,.1),#11121a_46%)] p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold text-white">Create trial slot</h2><p className="mt-1 text-sm text-zinc-500">Times are entered in your current local timezone.</p></div><button type="button" aria-label="Close form" onClick={onClose} className="rounded-lg p-2 text-zinc-400 hover:bg-white/[0.06] hover:text-white"><X size={17} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><FormSelect label="Gym" value={form.gymId} onChange={(value) => setValue("gymId", value)}>{gyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name} · {gym.status}</option>)}</FormSelect><FormInput label="Starts" type="datetime-local" value={form.startAt} onChange={(value) => setValue("startAt", value)} /><FormInput label="Ends" type="datetime-local" value={form.endAt} onChange={(value) => setValue("endAt", value)} /><FormInput label="Capacity" type="number" min="1" max="100" value={form.capacity} onChange={(value) => setValue("capacity", value)} /></div><div className="mt-5 flex flex-col justify-between gap-4 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center"><label className="flex cursor-pointer items-start gap-3"><input type="checkbox" checked={form.requiresApproval} onChange={(event) => setValue("requiresApproval", event.target.checked)} className="mt-1 h-4 w-4 accent-violet-500" /><span><span className="block text-sm font-medium text-zinc-200">Approve each request manually</span><span className="mt-0.5 block text-xs text-zinc-500">Otherwise, available places are confirmed immediately.</span></span></label><button type="submit" disabled={busy || !form.gymId} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}{busy ? "Creating…" : "Publish slot"}</button></div></form>;
}

function FormInput({ label, onChange, ...inputProps }) {
  return <label className="text-xs font-semibold text-zinc-400">{label}<input required {...inputProps} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" /></label>;
}

function FormSelect({ label, value, onChange, children }) {
  return <label className="text-xs font-semibold text-zinc-400">{label}<select required value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c0d13] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60">{children}</select></label>;
}

function OwnerSlotCard({ slot, busy, onDeactivate }) {
  const upcoming = new Date(slot.startAt) > new Date();
  const occupancy = slot.capacity ? Math.min(100, Math.round((slot.bookedCount / slot.capacity) * 100)) : 0;
  return <article className={`rounded-2xl border bg-[#11121a] p-5 ${slot.isActive ? "border-white/[0.08]" : "border-zinc-700/40 opacity-70"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{slot.gym?.name}</h2><span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${slot.isActive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-zinc-500/20 bg-zinc-500/10 text-zinc-400"}`}>{slot.isActive ? "ACTIVE" : "INACTIVE"}</span></div><p className="mt-2 text-sm text-zinc-400">{formatDate(slot.startAt)} · {formatTime(slot.startAt)}–{formatTime(slot.endAt)}</p></div><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><CalendarClock size={19} /></span></div><div className="mt-5"><div className="flex items-center justify-between text-xs"><span className="text-zinc-500">Reserved places</span><span className="font-semibold text-zinc-200">{slot.bookedCount} / {slot.capacity}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400" style={{ width: `${occupancy}%` }} /></div></div><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-zinc-500">{slot.requiresApproval ? "Manual approval" : "Instant confirmation"}</p>{slot.isActive && upcoming && <button type="button" disabled={busy} onClick={() => void onDeactivate(slot)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/[0.05] px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Ban size={14} />} Deactivate</button>}</div></article>;
}

function OwnerBookingRow({ booking, busy, onStatus }) {
  const started = new Date(booking.slot?.startAt) <= new Date();
  const active = ACTIVE_STATUSES.includes(booking.status);
  const memberName = [booking.user?.firstName, booking.user?.lastName].filter(Boolean).join(" ") || "Member";
  return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex min-w-0 gap-4"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-500/10 text-sky-300"><UsersRound size={19} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{memberName}</h2><Status status={booking.status} /></div><p className="mt-1 text-sm text-zinc-400">{booking.slot?.gym?.name} · {formatDate(booking.slot?.startAt)} at {formatTime(booking.slot?.startAt)}</p><p className="mt-1 text-xs text-zinc-500">{booking.user?.email} · <span className="font-mono text-zinc-300">{booking.bookingReference}</span></p>{booking.cancellationReason && <p className="mt-2 text-xs text-red-300">{booking.cancellationReason}</p>}</div></div>{active && <div className="flex flex-wrap gap-2 lg:justify-end">{booking.status === "PENDING" && <Action label="Confirm" icon={Check} tone="emerald" disabled={busy} onClick={() => void onStatus(booking, "CONFIRMED")} />}{started && <><Action label="Completed" icon={UserCheck} tone="sky" disabled={busy} onClick={() => void onStatus(booking, "COMPLETED")} /><Action label="No-show" icon={UserRoundX} tone="amber" disabled={busy} onClick={() => void onStatus(booking, "NO_SHOW")} /></>}<Action label="Cancel" icon={X} tone="red" disabled={busy} onClick={() => void onStatus(booking, "CANCELLED")} /></div>}</div></article>;
}

function Status({ status }) {
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClasses[status] || statusClasses.CANCELLED}`}>{String(status || "UNKNOWN").replaceAll("_", " ")}</span>;
}

function Action({ label, icon: Icon, tone, ...buttonProps }) {
  const tones = { emerald: "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300 hover:bg-emerald-500/10", sky: "border-sky-500/20 bg-sky-500/[0.07] text-sky-300 hover:bg-sky-500/10", amber: "border-amber-500/20 bg-amber-500/[0.07] text-amber-300 hover:bg-amber-500/10", red: "border-red-500/20 bg-red-500/[0.07] text-red-300 hover:bg-red-500/10" };
  return <button type="button" {...buttonProps} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${tones[tone]}`}><Icon size={14} />{label}</button>;
}

function Loading() {
  return <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#11121a] text-sm text-zinc-400"><LoaderCircle size={20} className="animate-spin text-violet-400" />Loading trial operations…</div>;
}

function Empty({ icon: Icon, title, text, onRefresh }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-8 text-center"><Icon size={38} className="text-violet-400" /><h2 className="mt-4 text-lg font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{text}</p><button type="button" onClick={onRefresh} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"><RefreshCw size={16} /> Continue</button></div>;
}

export default OwnerTrialsPage;
