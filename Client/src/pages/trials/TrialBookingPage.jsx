import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Dumbbell,
  Filter,
  LoaderCircle,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UsersRound,
  X,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { getAllGyms } from "../../api/gym.api";
import {
  bookTrialSlot,
  cancelMyTrialBooking,
  getAvailableTrialSlots,
  getMyTrialBookings,
} from "../../api/trial-booking.api";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

const formatDay = (value) => new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date(value));

const formatTime = (value) => new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
}).format(new Date(value));

const statusTone = {
  PENDING: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  CONFIRMED: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  COMPLETED: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  NO_SHOW: "border-red-400/20 bg-red-400/10 text-red-300",
  CANCELLED: "border-zinc-400/20 bg-zinc-400/10 text-zinc-300",
};

const asArray = (value) => Array.isArray(value) ? value : [];

const localDateValue = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  return local.toISOString().slice(0, 10);
};

function TrialBookingPage() {
  const [searchParams] = useSearchParams();
  const [initialGymId] = useState(() => searchParams.get("gymId") || "");
  const [activeTab, setActiveTab] = useState("discover");
  const [gyms, setGyms] = useState([]);
  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ city: "", gymId: initialGymId, date: "" });
  const [appliedFilters, setAppliedFilters] = useState(
    initialGymId ? { gymId: initialGymId } : {}
  );
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState(null);

  const loadSlots = useCallback(async (selectedFilters = {}) => {
    setLoadingSlots(true);
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(selectedFilters).filter(([, value]) => Boolean(value))
      );
      setSlots(asArray(await getAvailableTrialSlots(cleanFilters)));
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to load trial slots." });
    } finally {
      setLoadingSlots(false);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      setBookings(asArray(await getMyTrialBookings()));
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to load your trial bookings." });
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void Promise.all([
        loadSlots(initialGymId ? { gymId: initialGymId } : {}),
        loadBookings(),
        getAllGyms().then((data) => setGyms(asArray(data))).catch(() => setGyms([])),
      ]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialGymId, loadBookings, loadSlots]);

  const cities = useMemo(() => [...new Set(
    gyms.map((gym) => gym.city).filter(Boolean)
  )].sort((first, second) => first.localeCompare(second)), [gyms]);

  const filteredGyms = useMemo(() => gyms.filter(
    (gym) => !filters.city || gym.city === filters.city
  ), [filters.city, gyms]);

  const usedBookingSlotIds = useMemo(() => new Set(
    bookings.map((booking) => booking.slotId)
  ), [bookings]);

  const upcomingCount = useMemo(() => bookings.filter(
    (booking) => ACTIVE_STATUSES.includes(booking.status) && new Date(booking.slot?.startAt) > new Date()
  ).length, [bookings]);

  const applyFilters = async (event) => {
    event.preventDefault();
    const nextFilters = { ...filters };
    setAppliedFilters(nextFilters);
    await loadSlots(nextFilters);
  };

  const clearFilters = async () => {
    const emptyFilters = { city: "", gymId: "", date: "" };
    setFilters(emptyFilters);
    setAppliedFilters({});
    await loadSlots({});
  };

  const handleBook = async (slot) => {
    try {
      setBusyId(slot.id);
      setNotice(null);
      const booking = await bookTrialSlot(slot.id);
      setNotice({
        type: "success",
        text: booking.status === "PENDING"
          ? "Trial requested. The gym will confirm it shortly."
          : `Trial confirmed. Your reference is ${booking.bookingReference}.`,
      });
      await Promise.all([loadSlots(appliedFilters), loadBookings()]);
      setActiveTab("bookings");
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to book this trial." });
    } finally {
      setBusyId("");
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel trial ${booking.bookingReference}?`)) return;
    try {
      setBusyId(booking.id);
      setNotice(null);
      await cancelMyTrialBooking(booking.id, "Cancelled by member");
      setNotice({ type: "success", text: "Your trial booking was cancelled." });
      await Promise.all([loadSlots(appliedFilters), loadBookings()]);
    } catch (error) {
      setNotice({ type: "error", text: error.response?.data?.message || "Unable to cancel this trial." });
    } finally {
      setBusyId("");
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-[28px] border border-violet-400/20 bg-[radial-gradient(circle_at_86%_18%,rgba(139,92,246,.34),transparent_28%),radial-gradient(circle_at_66%_120%,rgba(14,165,233,.18),transparent_32%),linear-gradient(125deg,#171027,#10121a_58%,#0c1017)] p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-violet-200"><Sparkles size={13} /> Try before you join</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Book a gym trial that fits your day.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">Compare upcoming sessions, reserve a place, and keep every confirmation in one simple timeline.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Summary value={slots.length} label="Open slots" icon={CalendarDays} />
              <Summary value={upcomingCount} label="My upcoming" icon={TicketCheck} />
            </div>
          </div>
        </section>

        {notice && <div aria-live="polite" className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${notice.type === "error" ? "border-red-500/20 bg-red-500/[0.07] text-red-300" : "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-300"}`}><CircleAlert size={17} /> <span>{notice.text}</span><button type="button" aria-label="Dismiss message" onClick={() => setNotice(null)} className="ml-auto rounded-md p-1 hover:bg-white/10"><X size={15} /></button></div>}

        <div className="flex w-full gap-1 rounded-xl border border-white/[0.08] bg-[#11121a] p-1 sm:w-fit" role="tablist" aria-label="Gym trials">
          <Tab active={activeTab === "discover"} onClick={() => setActiveTab("discover")} icon={Dumbbell} label="Find a trial" />
          <Tab active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")} icon={TicketCheck} label={`My bookings (${bookings.length})`} />
        </div>

        {activeTab === "discover" ? (
          <>
            <form onSubmit={applyFilters} className="grid gap-4 rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
              <SelectField label="City" value={filters.city} onChange={(value) => setFilters((current) => ({ ...current, city: value, gymId: "" }))}>
                <option value="">All cities</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </SelectField>
              <SelectField label="Gym" value={filters.gymId} onChange={(value) => setFilters((current) => ({ ...current, gymId: value }))}>
                <option value="">All gyms</option>
                {filteredGyms.map((gym) => <option key={gym.id} value={gym.id}>{gym.name}</option>)}
              </SelectField>
              <label className="block text-xs font-semibold text-zinc-400">Date
                <input type="date" min={localDateValue(new Date())} value={filters.date} onChange={(event) => setFilters((current) => ({ ...current, date: event.target.value }))} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60" />
              </label>
              <div className="flex gap-2">
                <button type="submit" className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"><Filter size={16} /> Apply</button>
                {Object.values(appliedFilters).some(Boolean) && <button type="button" aria-label="Clear filters" onClick={() => void clearFilters()} className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]"><X size={16} /></button>}
              </div>
            </form>

            {loadingSlots ? <LoadingState label="Finding available trials…" /> : slots.length ? (
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Available gym trial slots">
                {slots.map((slot) => <TrialSlotCard key={slot.id} slot={slot} booked={usedBookingSlotIds.has(slot.id)} busy={busyId === slot.id} onBook={handleBook} />)}
              </section>
            ) : <EmptyState title="No open trials match these filters" text="Try another date or clear your filters to see more gym sessions." onRefresh={() => void clearFilters()} />}
          </>
        ) : loadingBookings ? <LoadingState label="Loading your trial history…" /> : bookings.length ? (
          <section className="space-y-3" aria-label="My gym trial bookings">
            {bookings.map((booking) => <BookingRow key={booking.id} booking={booking} busy={busyId === booking.id} onCancel={handleCancel} />)}
          </section>
        ) : <EmptyState title="You have not booked a trial yet" text="Explore available sessions and reserve your first gym visit." onRefresh={() => setActiveTab("discover")} />}
      </main>
    </DashboardLayout>
  );
}

function Summary({ value, label, icon: Icon }) {
  return <div className="min-w-28 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur"><div className="flex items-center gap-2 text-zinc-400"><Icon size={15} /><span className="text-xs">{label}</span></div><p className="mt-1 text-2xl font-bold text-white">{value}</p></div>;
}

function Tab({ active, onClick, icon: Icon, label }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${active ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30" : "text-zinc-400 hover:bg-white/[0.05] hover:text-white"}`}><Icon size={16} />{label}</button>;
}

function SelectField({ label, value, onChange, children }) {
  return <label className="block text-xs font-semibold text-zinc-400">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/[0.1] bg-[#0c0d13] px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60">{children}</select></label>;
}

function TrialSlotCard({ slot, booked, busy, onBook }) {
  const image = slot.gym?.images?.[0]?.imageUrl;
  return <article className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#11121a] shadow-xl shadow-black/10">
    <div className="relative h-32 overflow-hidden bg-[linear-gradient(135deg,#312e81,#111827)]">{image && <img src={image} alt="" className="h-full w-full object-cover opacity-75" />}<div className="absolute inset-0 bg-gradient-to-t from-[#11121a] via-transparent to-transparent" /><span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur"><UsersRound size={12} className="mr-1 inline" /> {slot.remainingCapacity} left</span></div>
    <div className="p-5"><h2 className="truncate text-lg font-semibold text-white">{slot.gym?.name}</h2><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-zinc-500"><MapPin size={13} /> {slot.gym?.address}, {slot.gym?.city}</p><div className="mt-4 grid grid-cols-2 gap-2"><Info icon={CalendarDays} text={formatDay(slot.startAt)} /><Info icon={Clock3} text={`${formatTime(slot.startAt)} – ${formatTime(slot.endAt)}`} /></div>{slot.requiresApproval && <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-300"><ShieldCheck size={14} /> Gym confirmation required</p>}<button type="button" disabled={busy || booked} onClick={() => void onBook(slot)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <LoaderCircle size={16} className="animate-spin" /> : booked ? <CheckCircle2 size={16} /> : <TicketCheck size={16} />}{busy ? "Booking…" : booked ? "Previously booked" : "Book free trial"}</button></div>
  </article>;
}

function Info({ icon: Icon, text }) {
  return <div className="rounded-xl border border-white/[0.07] bg-black/15 p-2.5"><Icon size={14} className="text-violet-300" /><p className="mt-1.5 text-[11px] leading-4 text-zinc-300">{text}</p></div>;
}

function BookingRow({ booking, busy, onCancel }) {
  const canCancel = ACTIVE_STATUSES.includes(booking.status) && new Date(booking.slot?.startAt) > new Date();
  return <article className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Dumbbell size={21} /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-semibold text-white">{booking.slot?.gym?.name}</h2><Status status={booking.status} /></div><p className="mt-1 text-sm text-zinc-400">{formatDay(booking.slot?.startAt)} · {formatTime(booking.slot?.startAt)}</p><p className="mt-1 text-xs text-zinc-500">Reference: <span className="font-mono text-zinc-300">{booking.bookingReference}</span></p>{booking.cancellationReason && <p className="mt-2 text-xs text-red-300">{booking.cancellationReason}</p>}</div></div>{canCancel && <button type="button" disabled={busy} onClick={() => void onCancel(booking)} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10 disabled:opacity-50">{busy ? <LoaderCircle size={14} className="animate-spin" /> : <X size={14} />} Cancel booking</button>}</article>;
}

function Status({ status }) {
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone[status] || statusTone.CANCELLED}`}>{String(status || "UNKNOWN").replaceAll("_", " ")}</span>;
}

function LoadingState({ label }) {
  return <div className="flex min-h-72 items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-[#11121a] text-sm text-zinc-400"><LoaderCircle size={20} className="animate-spin text-violet-400" />{label}</div>;
}

function EmptyState({ title, text, onRefresh }) {
  return <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-[#11121a] p-8 text-center"><CalendarDays size={38} className="text-violet-400" /><h2 className="mt-4 text-lg font-semibold text-white">{title}</h2><p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">{text}</p><button type="button" onClick={onRefresh} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08]"><RefreshCw size={16} /> Try again</button></div>;
}

export default TrialBookingPage;
