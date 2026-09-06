import { useEffect, useState } from "react";
import { Activity, BarChart3, Clock3, Info, LoaderCircle, Users } from "lucide-react";
import { getGymCrowdLevel, reportGymCrowdLevel } from "../../api/gym.api";

const options = [
  { value: "LOW", label: "Low", description: "Plenty of space", active: "border-emerald-400/45 bg-emerald-500/15 text-emerald-100", colour: "bg-emerald-400", text: "text-emerald-200" },
  { value: "MEDIUM", label: "Medium", description: "Normal activity", active: "border-amber-400/45 bg-amber-500/15 text-amber-100", colour: "bg-amber-300", text: "text-amber-100" },
  { value: "HIGH", label: "High", description: "Busy right now", active: "border-rose-400/45 bg-rose-500/15 text-rose-100", colour: "bg-rose-400", text: "text-rose-100" },
];

const findOption = (level) => options.find((item) => item.value === level);

function CrowdLevelCard({ gymId }) {
  const [crowd, setCrowd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const data = await getGymCrowdLevel(gymId);
        if (active) setCrowd(data);
      } catch {
        if (active) setMessage("Crowd insights are temporarily unavailable.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [gymId]);

  const send = async (level) => {
    try {
      setSending(level);
      setMessage("");
      const data = await reportGymCrowdLevel(gymId, level);
      setCrowd(data);
      setMessage("Live pulse updated. Your report also improves the long-term pattern.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to share crowd level.");
    } finally {
      setSending("");
    }
  };

  const current = findOption(crowd?.level);
  const history = crowd?.history;
  const liveTotal = crowd?.reportCount || 0;

  return <section className="overflow-hidden rounded-3xl border border-sky-400/20 bg-[radial-gradient(circle_at_2%_3%,rgba(14,165,233,.14),transparent_31%),radial-gradient(circle_at_92%_100%,rgba(124,58,237,.13),transparent_30%),#11131b] shadow-[0_18px_60px_rgba(0,0,0,.16)]">
    <div className="border-b border-white/[0.08] px-5 py-5 sm:px-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/15 bg-sky-500/10 text-sky-200"><Activity size={20} /></span><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-sky-300">Community data</p><h2 className="mt-1 text-xl font-black tracking-tight text-white">Crowd Insights</h2><p className="mt-1 text-sm text-zinc-400">Live member reports plus a 30-day day-and-time pattern.</p></div></div><span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/[0.09] bg-black/20 px-3 py-1.5 text-xs font-semibold text-zinc-300"><span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]" /> Live updates</span></div></div>
    {loading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={17} className="animate-spin" /> Building crowd insights…</div> : <div className="grid gap-0 lg:grid-cols-[minmax(270px,.8fr)_minmax(320px,1.15fr)_minmax(300px,1fr)]"><LivePulse current={current} crowd={crowd} sending={sending} onSend={send} message={message} liveTotal={liveTotal} /><WeeklyChart history={history} /><TimeChart history={history} /></div>}
  </section>;
}

function LivePulse({ current, crowd, sending, onSend, message, liveTotal }) {
  return <div className="border-b border-white/[0.08] p-5 sm:p-6 lg:border-b-0 lg:border-r"><p className="text-xs font-bold uppercase tracking-[0.13em] text-zinc-500">Live right now</p><div className="mt-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4"><div className="flex items-start justify-between gap-3"><div><p className={`text-3xl font-black tracking-tight ${current?.text || "text-white"}`}>{current?.label || "Waiting for reports"}</p><p className="mt-1 text-sm text-zinc-400">{current?.description || "Be the first member to report."}</p></div><span className={`grid h-11 w-11 place-items-center rounded-xl ${current ? current.active : "border border-white/[0.08] bg-white/[0.04] text-zinc-500"}`}><Users size={20} /></span></div><LiveDistribution counts={crowd?.counts} total={liveTotal} /></div><p className="mt-5 text-sm font-semibold text-white">Are you at this gym now?</p><p className="mt-1 text-xs leading-5 text-zinc-500">Your report stays live for 90 minutes.</p><div className="mt-3 grid grid-cols-3 gap-2">{options.map((option) => <button key={option.value} type="button" disabled={Boolean(sending)} onClick={() => onSend(option.value)} className={`min-h-16 rounded-xl border px-2 py-2 text-left transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55 ${option.active}`}><span className="block text-xs font-black">{sending === option.value ? <LoaderCircle size={15} className="animate-spin" /> : option.label}</span><span className="mt-1 block text-[10px] leading-3 opacity-75">{option.description}</span></button>)}</div>{message && <p className={`mt-4 text-xs leading-5 ${/updated/i.test(message) ? "text-emerald-200" : "text-amber-200"}`}>{message}</p>}<p className="mt-4 flex gap-1.5 text-[11px] leading-4 text-zinc-500"><Info size={13} className="mt-0.5 shrink-0" /> Active members only. This is a crowd signal, not a reservation.</p></div>;
}

function LiveDistribution({ counts = { low: 0, medium: 0, high: 0 }, total }) {
  const entries = [{ key: "low", label: "Low", colour: "bg-emerald-400" }, { key: "medium", label: "Medium", colour: "bg-amber-300" }, { key: "high", label: "High", colour: "bg-rose-400" }];
  return <div className="mt-5"><div className="flex h-2 overflow-hidden rounded-full bg-white/[0.06]">{total ? entries.map((entry) => counts[entry.key] ? <span key={entry.key} style={{ width: `${(counts[entry.key] / total) * 100}%` }} className={entry.colour} /> : null) : <span className="w-full bg-white/[0.05]" />}</div><div className="mt-2 flex justify-between text-[10px] font-semibold text-zinc-500">{entries.map((entry) => <span key={entry.key}>{entry.label} {counts[entry.key] || 0}</span>)}</div><p className="mt-3 text-xs text-zinc-500">{total ? `${total} active ${total === 1 ? "report" : "reports"} in the last 90 min` : "No active reports yet"}</p></div>;
}

function WeeklyChart({ history }) {
  const hasData = Boolean(history?.sampleCount);
  const calmest = history?.calmestDay;
  return <div className="border-b border-white/[0.08] p-5 sm:p-6 lg:border-b-0 lg:border-r"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-zinc-500">Typical day</p><h3 className="mt-1 font-bold text-white">Seven-day crowd average</h3></div><BarChart3 size={18} className="text-violet-300" /></div><p className="mt-2 min-h-10 text-xs leading-5 text-zinc-500">{hasData ? "Higher bars mean members usually report more activity." : "Bars will appear as members start sharing crowd reports."}</p><div className="mt-5 flex h-40 items-end justify-between gap-2 border-b border-white/[0.08] px-1">{(history?.days || defaultDays()).map((day) => <div key={day.label} className="flex h-full min-w-0 flex-1 flex-col justify-end"><div className="flex h-full items-end"><div title={day.samples ? `${day.label}: ${levelText(day.averageLevel)} from ${day.samples} reports` : `${day.label}: no reports yet`} style={{ height: day.crowdPercent === null ? "6%" : `${Math.max(18, day.crowdPercent)}%` }} className={`w-full rounded-t-lg transition ${day.crowdPercent === null ? "bg-white/[0.06]" : barColour(day.averageLevel)}`} /></div><p className="mt-2 text-center text-[10px] font-semibold text-zinc-500">{day.label}</p></div>)}</div><Insight text={calmest ? `${calmest.label} is usually the calmest day in the last ${history.windowDays} days.` : "Need at least 3 reports for a reliable quiet-day suggestion."} positive={Boolean(calmest)} /></div>;
}

function TimeChart({ history }) {
  const calmest = history?.calmestTime;
  const hasData = Boolean(history?.sampleCount);
  return <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.13em] text-zinc-500">Typical time</p><h3 className="mt-1 font-bold text-white">When is it busiest?</h3></div><Clock3 size={18} className="text-sky-300" /></div><p className="mt-2 min-h-10 text-xs leading-5 text-zinc-500">{hasData ? "Average crowd level by time slot, based on the last 30 days." : "Time trends will build after verified member reports."}</p><div className="mt-4 space-y-2.5">{(history?.timeSlots || defaultTimes()).filter((slot) => !slot.label.startsWith("12–6 AM")).map((slot) => <div key={slot.label} className="grid grid-cols-[74px_1fr_26px] items-center gap-2"><span className="text-[10px] font-semibold text-zinc-500">{slot.label}</span><div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]"><div style={{ width: slot.crowdPercent === null ? "0%" : `${Math.max(10, slot.crowdPercent)}%` }} className={`h-full rounded-full ${slot.crowdPercent === null ? "" : barColour(slot.averageLevel)}`} /></div><span className="text-right text-[10px] font-bold text-zinc-400">{slot.samples || "–"}</span></div>)}</div><div className="mt-4 rounded-xl border border-white/[0.07] bg-black/15 px-3 py-2.5"><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Best time to visit</p><p className={`mt-1 text-xs font-semibold ${calmest ? "text-emerald-200" : "text-zinc-400"}`}>{calmest ? `${calmest.label} is the calmest reliable time slot.` : "More reports are needed before we suggest a quiet time."}</p></div></div>;
}

function Insight({ text, positive }) { return <p className={`mt-5 rounded-xl border px-3 py-2.5 text-xs leading-5 ${positive ? "border-emerald-400/15 bg-emerald-500/[0.06] text-emerald-100" : "border-white/[0.07] bg-black/15 text-zinc-500"}`}>{text}</p>; }
function levelText(level) { return level ? `${level[0]}${level.slice(1).toLowerCase()} crowd` : "No reports"; }
function barColour(level) { return level === "LOW" ? "bg-emerald-400" : level === "MEDIUM" ? "bg-amber-300" : "bg-rose-400"; }
function defaultDays() { return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({ label, samples: 0, crowdPercent: null, averageLevel: null })); }
function defaultTimes() { return ["12–6 AM", "6–9 AM", "9 AM–12 PM", "12–3 PM", "3–6 PM", "6–9 PM", "9 PM–12 AM"].map((label) => ({ label, samples: 0, crowdPercent: null, averageLevel: null })); }

export default CrowdLevelCard;
