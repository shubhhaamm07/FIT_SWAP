import { useCallback, useEffect, useMemo, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Check, Dumbbell, LoaderCircle, Salad, Sparkles, UsersRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getGymCrowdLevel } from "../../../api/gym.api";
import { getMealLogs, getWorkoutPlan, setWorkoutCompletion, updateMealLog } from "../../../api/wellness.api";

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const localDayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayWeekday = () => ((new Date().getDay() + 6) % 7) + 1;
const sameDate = (value, key) => String(value || "").slice(0, 10) === key;

function MemberMomentum({ memberships = [] }) {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState({ schedules: [], summary: {} });
  const [meals, setMeals] = useState({ meals: [], summary: {} });
  const [crowd, setCrowd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const activeMembership = useMemo(() => memberships.find((membership) => membership.status === "ACTIVE" && new Date(membership.endDate) > new Date()), [memberships]);
  const today = localDayKey();

  const load = useCallback(async () => {
    try {
      const [workoutData, mealData] = await Promise.all([getWorkoutPlan(), getMealLogs()]);
      setWorkouts(workoutData);
      setMeals(mealData);
    } catch {
      // The dashboard remains useful even when an optional wellness request is temporarily unavailable.
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const gymId = activeMembership?.plan?.gym?.id;
    if (!gymId) { setCrowd(null); return undefined; }
    let active = true;
    getGymCrowdLevel(gymId).then((data) => { if (active) setCrowd(data); }).catch(() => { if (active) setCrowd(null); });
    return () => { active = false; };
  }, [activeMembership?.plan?.gym?.id]);

  const todayWorkouts = workouts.schedules.filter((workout) => workout.weekday === todayWeekday());
  const todayMeals = meals.meals.filter((meal) => sameDate(meal.mealDate, today));
  const todayItems = [...todayWorkouts.map((workout) => ({ type: "workout", data: workout, complete: workout.completions?.some((entry) => sameDate(entry.completedOn, today)) })), ...todayMeals.map((meal) => ({ type: "meal", data: meal, complete: meal.isFollowed }))];
  const completedToday = todayItems.filter((item) => item.complete).length;

  const toggleWorkout = async (workout, complete) => {
    try {
      setBusy(`workout-${workout.id}`);
      await setWorkoutCompletion(workout.id, { completedOn: today, completed: !complete });
      await load();
    } finally { setBusy(""); }
  };
  const toggleMeal = async (meal) => {
    try {
      setBusy(`meal-${meal.id}`);
      await updateMealLog(meal.id, { isFollowed: !meal.isFollowed });
      await load();
    } finally { setBusy(""); }
  };

  return <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,.65fr)]">
    <article className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_100%_0%,rgba(124,58,237,.16),transparent_33%),#11121a] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-200"><Activity size={14} /> Today’s flow</div><h2 className="mt-3 text-xl font-black tracking-tight text-white">A small plan for a stronger day.</h2><p className="mt-1 text-sm text-zinc-400">Your scheduled movement and meals in one focused view.</p></div><div className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3 text-right"><p className="text-2xl font-black text-white">{completedToday}<span className="text-zinc-600">/{todayItems.length}</span></p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Completed today</p></div></div>
      {loading ? <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-zinc-500"><LoaderCircle size={16} className="animate-spin" /> Loading your routine…</div> : todayItems.length ? <div className="mt-6 grid gap-3 lg:grid-cols-2">{todayItems.map((item) => <RoutineItem key={`${item.type}-${item.data.id}`} item={item} busy={busy} onToggle={() => item.type === "workout" ? toggleWorkout(item.data, item.complete) : toggleMeal(item.data)} />)}</div> : <div className="mt-6 rounded-2xl border border-dashed border-white/[0.12] bg-black/15 p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/10 text-violet-200"><Sparkles size={18} /></span><div><p className="font-semibold text-white">Your day is ready for a plan.</p><p className="mt-1 text-sm leading-5 text-zinc-500">Add a weekly workout or save an AI meal suggestion to make this dashboard personal.</p><button type="button" onClick={() => navigate("/wellness")} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-violet-200 hover:text-violet-100">Set up your wellness plan <ArrowUpRight size={15} /></button></div></div></div>}
      <WeekStrip schedules={workouts.schedules} today={today} />
    </article>
    <aside className="space-y-6"><CommunityPulse membership={activeMembership} crowd={crowd} onOpen={() => activeMembership?.plan?.gym?.id && navigate(`/gyms/${activeMembership.plan.gym.id}`)} /><AdherenceNote workoutSummary={workouts.summary} mealSummary={meals.summary} /></aside>
  </section>;
}

function RoutineItem({ item, busy, onToggle }) {
  const workout = item.type === "workout";
  const isBusy = busy === `${item.type}-${item.data.id}`;
  const Icon = workout ? Dumbbell : Salad;
  const detail = workout ? [item.data.focus, item.data.durationMinutes ? `${item.data.durationMinutes} min` : null].filter(Boolean).join(" · ") : `${String(item.data.mealType || "MEAL").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())}${item.data.estimatedCalories !== null && item.data.estimatedCalories !== undefined ? ` · ~${item.data.estimatedCalories} kcal` : ""}`;
  return <div className={`flex items-center gap-3 rounded-2xl border p-3.5 transition ${item.complete ? "border-emerald-400/20 bg-emerald-500/[0.07]" : "border-white/[0.07] bg-black/15"}`}><button type="button" onClick={onToggle} disabled={isBusy} aria-label={item.complete ? "Mark incomplete" : "Mark complete"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${item.complete ? "border-emerald-400/35 bg-emerald-500 text-white" : "border-white/[0.12] bg-white/[0.03] text-zinc-500 hover:border-violet-400/55 hover:text-violet-200"}`}>{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={17} />}</button><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${workout ? "bg-violet-500/10 text-violet-200" : "bg-emerald-500/10 text-emerald-200"}`}><Icon size={17} /></span><div className="min-w-0"><p className={`truncate text-sm font-semibold ${item.complete ? "text-emerald-100 line-through" : "text-white"}`}>{workout ? item.data.title : item.data.label}</p><p className="mt-0.5 truncate text-xs text-zinc-500">{detail || (workout ? "Planned session" : "Saved meal")}</p></div></div>;
}

function WeekStrip({ schedules, today }) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return <div className="mt-6 border-t border-white/[0.08] pt-5"><div className="flex items-center justify-between"><div><p className="text-sm font-bold text-white">This week in motion</p><p className="mt-1 text-xs text-zinc-500">Checked sessions build your weekly rhythm.</p></div><CalendarDays size={18} className="text-violet-300" /></div><div className="mt-4 grid grid-cols-7 gap-2">{weekdays.map((label, index) => { const day = new Date(start); day.setDate(start.getDate() + index); const key = localDayKey(day); const daySchedules = schedules.filter((schedule) => schedule.weekday === index + 1); const completed = daySchedules.filter((schedule) => schedule.completions?.some((entry) => sameDate(entry.completedOn, key))).length; const isToday = key === today; return <div key={label} className={`rounded-xl border p-2 text-center ${isToday ? "border-violet-400/35 bg-violet-500/10" : "border-white/[0.06] bg-black/10"}`}><p className={`text-[10px] font-bold uppercase ${isToday ? "text-violet-200" : "text-zinc-500"}`}>{label}</p><div className="mx-auto mt-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] text-xs font-black text-white">{completed}<span className="text-zinc-600">/{daySchedules.length}</span></div></div>; })}</div></div>;
}

function CommunityPulse({ membership, crowd, onOpen }) {
  const level = crowd?.level || null;
  const tone = level === "LOW" ? "text-emerald-200 bg-emerald-500/10 border-emerald-400/20" : level === "MEDIUM" ? "text-amber-100 bg-amber-500/10 border-amber-400/20" : level === "HIGH" ? "text-rose-100 bg-rose-500/10 border-rose-400/20" : "text-zinc-300 bg-white/[0.04] border-white/[0.08]";
  return <article className="rounded-3xl border border-sky-400/15 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.14),transparent_45%),#11121a] p-5"><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-sky-500/10 text-sky-200"><UsersRound size={18} /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-300">Gym community</p><h2 className="mt-0.5 font-bold text-white">Your gym pulse</h2></div></div>{membership ? <><p className="mt-5 text-sm font-semibold text-white">{membership.plan?.gym?.name}</p><div className={`mt-3 rounded-2xl border p-4 ${tone}`}><p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">Current crowd</p><p className="mt-1 text-2xl font-black">{level ? `${level[0]}${level.slice(1).toLowerCase()}` : "No reports"}</p><p className="mt-1 text-xs opacity-75">{crowd?.reportCount ? `${crowd.reportCount} active member reports` : "Open your gym page to share the first update."}</p></div><button type="button" onClick={onOpen} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-sky-200 hover:text-sky-100">Open crowd insights <ArrowUpRight size={15} /></button></> : <p className="mt-5 text-sm leading-6 text-zinc-500">Your active gym’s community crowd signal will appear here once you have a membership.</p>}</article>;
}

function AdherenceNote({ workoutSummary = {}, mealSummary = {} }) { const workoutText = workoutSummary.activeSchedules ? `${workoutSummary.completedThisWeek || 0} sessions completed this week.` : "Set a weekly workout plan when you are ready."; const mealText = mealSummary.total ? `${mealSummary.adherencePercent || 0}% meal adherence from saved meals.` : "Save an AI meal to begin food adherence tracking."; return <article className="rounded-3xl border border-white/[0.08] bg-[#11121a] p-5"><p className="text-xs font-bold uppercase tracking-[0.13em] text-zinc-500">Momentum note</p><p className="mt-2 font-semibold leading-6 text-white">Small completed actions are more valuable than a perfect plan.</p><p className="mt-3 text-sm leading-6 text-zinc-500">{workoutText} {mealText}</p></article>; }

export default MemberMomentum;
