import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Check, ChevronDown, ClipboardCheck, Dumbbell, Flame, LoaderCircle, LockKeyhole, Plus, Salad, Sparkles, Trash2, TrendingUp, Utensils } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { archiveWorkout, createMealLog, createWorkout, getMealLogs, getWellnessInsights, getWorkoutPlan, setWorkoutCompletion, updateMealLog } from "../../api/wellness.api";
import { useToast } from "../../hooks/useToast";
import { isRequestCancelled } from "../../hooks/useVisibilityPolling";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const mealTypes = ["BREAKFAST", "LUNCH", "DINNER", "SNACK", "OTHER"];

const localDayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dayLabel = (value) => String(value || "").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
const weekdayNumber = () => ((new Date().getDay() + 6) % 7) + 1;

function WellnessPage() {
  const { showToast } = useToast();
  const [workoutData, setWorkoutData] = useState({ schedules: [], summary: {} });
  const [mealData, setMealData] = useState({ meals: [], summary: {} });
  const [insights, setInsights] = useState({ status: "loading", data: null });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ weekday: String(weekdayNumber()), title: "", focus: "", durationMinutes: "45", notes: "" });
  const [mealForm, setMealForm] = useState({ mealDate: localDayKey(), mealType: "OTHER", label: "", description: "", estimatedCalories: "" });

  const load = useCallback(async (quiet = false, { signal } = {}) => {
    try {
      if (!quiet) setLoading(true);
      const [workouts, meals, insightResult] = await Promise.all([
        getWorkoutPlan({ signal }),
        getMealLogs({}, { signal }),
        getWellnessInsights({ signal }).then((data) => ({ data })).catch((error) => ({ error })),
      ]);
      if (signal?.aborted) return;
      setWorkoutData(workouts);
      setMealData(meals);
      if (insightResult.data) {
        setInsights({ status: "ready", data: insightResult.data });
      } else if (insightResult.error?.response?.status === 403) {
        setInsights({ status: "locked", data: null });
      } else if (!isRequestCancelled(insightResult.error)) {
        setInsights({ status: "unavailable", data: null });
      }
    } catch (error) {
      if (isRequestCancelled(error)) return;
      showToast(error.response?.data?.message || "Unable to load your wellness data.", "error");
    } finally {
      if (!quiet && !signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => { void load(false, { signal: controller.signal }); }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [load]);

  const today = localDayKey();
  const todayWorkoutCount = useMemo(
    () => workoutData.schedules.filter((workout) => workout.weekday === weekdayNumber()).length,
    [workoutData.schedules],
  );
  const completedToday = useMemo(
    () => workoutData.schedules.filter((workout) => workout.completions?.some((entry) => String(entry.completedOn).slice(0, 10) === today)).length,
    [workoutData.schedules, today],
  );

  const submitWorkout = async (event) => {
    event.preventDefault();
    try {
      setBusy("new-workout");
      await createWorkout({ ...workoutForm, weekday: Number(workoutForm.weekday), durationMinutes: workoutForm.durationMinutes || null });
      setWorkoutForm({ weekday: String(weekdayNumber()), title: "", focus: "", durationMinutes: "45", notes: "" });
      setShowWorkoutForm(false);
      showToast("Workout added to your weekly schedule.");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to add workout.", "error");
    } finally { setBusy(""); }
  };

  const toggleCompletion = async (workout, completed) => {
    try {
      setBusy(`workout-${workout.id}`);
      await setWorkoutCompletion(workout.id, { completedOn: today, completed: !completed });
      showToast(completed ? "Workout marked as not completed." : "Great work — session completed!");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to update workout progress.", "error");
    } finally { setBusy(""); }
  };

  const removeWorkout = async (id) => {
    try {
      setBusy(`remove-${id}`);
      await archiveWorkout(id);
      showToast("Workout removed from your schedule.");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to remove workout.", "error");
    } finally { setBusy(""); }
  };

  const submitMeal = async (event) => {
    event.preventDefault();
    try {
      setBusy("new-meal");
      await createMealLog({ ...mealForm, estimatedCalories: mealForm.estimatedCalories || null, source: "MANUAL" });
      setMealForm({ mealDate: localDayKey(), mealType: "OTHER", label: "", description: "", estimatedCalories: "" });
      setShowMealForm(false);
      showToast("Meal saved. Mark it followed when you complete it.");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to save meal.", "error");
    } finally { setBusy(""); }
  };

  const toggleMeal = async (meal) => {
    try {
      setBusy(`meal-${meal.id}`);
      await updateMealLog(meal.id, { isFollowed: !meal.isFollowed });
      showToast(meal.isFollowed ? "Meal marked as not followed." : "Meal marked as followed.");
      await load(true);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to update meal.", "error");
    } finally { setBusy(""); }
  };

  if (loading) return <DashboardLayout><LoadingState /></DashboardLayout>;

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-300">Member wellness</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Train with a plan. Eat with intent.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Build a reusable week, check off sessions, and keep a simple meal-adherence record. Only meals you explicitly save are stored.</p></div>
          <a href="/diet-planner" className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-100 transition hover:bg-violet-500/20"><Salad size={16} /> Open AI diet planner</a>
        </header>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <Metric icon={Dumbbell} label="Today’s sessions" value={`${completedToday}/${todayWorkoutCount}`} detail={todayWorkoutCount ? "Complete your planned movement" : "Add your first session"} tone="violet" />
          <Metric icon={ClipboardCheck} label="Week progress" value={String(workoutData.summary?.completedThisWeek || 0)} detail={`${workoutData.summary?.activeSchedules || 0} active weekly workouts`} tone="emerald" />
          <Metric icon={Utensils} label="Meal adherence" value={`${mealData.summary?.adherencePercent || 0}%`} detail={`${mealData.summary?.followed || 0} of ${mealData.summary?.total || 0} saved meals followed`} tone="amber" />
        </section>

        <PremiumInsights insights={insights} />

        <section className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,.75fr)]">
          <article className="rounded-3xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-white">Weekly workout schedule</h2><p className="mt-1 text-sm text-zinc-500">A weekly template you can reuse and complete each day.</p></div><button type="button" onClick={() => setShowWorkoutForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500"><Plus size={16} /> Add workout</button></div>
            {showWorkoutForm && <WorkoutForm form={workoutForm} setForm={setWorkoutForm} busy={busy === "new-workout"} onClose={() => setShowWorkoutForm(false)} onSubmit={submitWorkout} />}
            <div className="mt-6 space-y-3">
              {workoutData.schedules.length ? weekdays.map((name, index) => {
                const scheduled = workoutData.schedules.filter((workout) => workout.weekday === index + 1);
                if (!scheduled.length) return null;
                const isToday = weekdayNumber() === index + 1;
                return <div key={name}><p className={`mb-2 text-xs font-bold uppercase tracking-[0.13em] ${isToday ? "text-violet-300" : "text-zinc-500"}`}>{name}{isToday ? " · Today" : ""}</p><div className="space-y-2">{scheduled.map((workout) => {
                  const completed = workout.completions?.some((entry) => String(entry.completedOn).slice(0, 10) === today);
                  return <WorkoutRow key={workout.id} workout={workout} canComplete={isToday} completed={completed} busy={busy} onComplete={() => toggleCompletion(workout, completed)} onRemove={() => removeWorkout(workout.id)} />;
                })}</div></div>;
              }) : <Empty title="No workouts scheduled yet" detail="Add your gym, cardio, yoga, or recovery sessions for the week." icon={Dumbbell} />}
            </div>
          </article>

          <article className="rounded-3xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-white">Meal log</h2><p className="mt-1 text-sm text-zinc-500">Your saved meals from the last 14 days.</p></div><button type="button" onClick={() => setShowMealForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-white/[0.08]"><Plus size={16} /> Log meal</button></div>
            {showMealForm && <MealForm form={mealForm} setForm={setMealForm} busy={busy === "new-meal"} onClose={() => setShowMealForm(false)} onSubmit={submitMeal} />}
            <div className="mt-6 space-y-2.5">
              {mealData.meals.length ? mealData.meals.map((meal) => <MealRow key={meal.id} meal={meal} busy={busy === `meal-${meal.id}`} onToggle={() => toggleMeal(meal)} />) : <Empty title="No meals logged yet" detail="Save a suggestion from the AI Diet Planner, or add your own meal here." icon={Utensils} />}
            </div>
          </article>
        </section>
      </main>
    </DashboardLayout>
  );
}

function Metric({ icon: Icon, label, value, detail, tone }) {
  const tones = { violet: "text-violet-300 bg-violet-500/10", emerald: "text-emerald-300 bg-emerald-500/10", amber: "text-amber-300 bg-amber-500/10" };
  return <article className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p><p className="mt-1 text-3xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-zinc-500">{detail}</p></article>;
}

function PremiumInsights({ insights }) {
  if (insights.status === "unavailable") return null;
  if (insights.status !== "ready") {
    const isLoading = insights.status === "loading";
    return <section className="mt-7 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.12] via-[#11121a] to-[#11121a] p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-violet-200"><Sparkles size={13} /> FitSwap Plus</div><h2 className="mt-3 text-xl font-black text-white">See your progress patterns, not just today&apos;s log.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Unlock a private 30-day view of completed sessions, workout streaks, meal adherence, and estimated meal calories.</p></div>{isLoading ? <span className="inline-flex items-center gap-2 text-sm text-zinc-400"><LoaderCircle size={16} className="animate-spin" /> Loading insights…</span> : <Link to="/plus" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-500"><LockKeyhole size={16} /> Unlock Plus insights</Link>}</div></section>;
  }

  const { summary = {}, days = [] } = insights.data;
  const values = days.map((day) => (day.workoutsCompleted * 2) + day.mealsFollowed);
  const maxValue = Math.max(1, ...values);
  const labels = days.filter((_, index) => index % 5 === 0 || index === days.length - 1);
  return <section className="mt-7 overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/[0.10] via-[#11121a] to-[#11121a] p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-violet-200"><Sparkles size={13} /> FitSwap Plus insights</div><h2 className="mt-3 text-xl font-black text-white">Your 30-day wellness rhythm</h2><p className="mt-1 text-sm text-zinc-400">A private summary based only on the workouts and meals you log.</p></div><Link to="/plus" className="text-sm font-bold text-violet-200 hover:text-white">Manage Plus</Link></div><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(270px,.6fr)]"><div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-white">Consistency pulse</p><p className="mt-1 text-xs text-zinc-500">Each column combines sessions and meals followed.</p></div><BarChart3 size={20} className="text-violet-300" /></div><div className="mt-5 flex h-28 items-end gap-[3px]" aria-label="30-day wellness activity graph">{days.map((day, index) => { const value = values[index]; const workoutHeight = value ? Math.max(6, (day.workoutsCompleted * 2 / maxValue) * 100) : 0; const mealHeight = value ? Math.max(0, (day.mealsFollowed / maxValue) * 100) : 0; return <div key={day.date} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end gap-0.5"><span className="rounded-t bg-violet-400/90 transition group-hover:bg-violet-300" style={{ height: `${workoutHeight}%` }} /><span className="rounded-b bg-emerald-400/85 transition group-hover:bg-emerald-300" style={{ height: `${mealHeight}%` }} /><span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-40 -translate-x-1/2 rounded-lg border border-white/[0.1] bg-[#1a1b26] px-2.5 py-2 text-center text-[11px] text-zinc-300 shadow-xl group-hover:block">{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}: {day.workoutsCompleted} sessions · {day.mealsFollowed} meals followed</span></div>; })}</div><div className="mt-2 flex justify-between text-[10px] text-zinc-600">{labels.map((day) => <span key={day.date}>{new Date(`${day.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>)}</div><div className="mt-4 flex flex-wrap gap-4 text-xs text-zinc-400"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-violet-400" /> Completed workouts</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald-400" /> Meals followed</span></div></div><div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1"><InsightStat icon={Flame} label="Current streak" value={`${summary.currentWorkoutStreak || 0} days`} detail={`Best: ${summary.bestWorkoutStreak || 0} days`} tone="amber" /><InsightStat icon={TrendingUp} label="Workout completions" value={String(summary.totalWorkoutCompletions || 0)} detail={`${summary.totalWorkoutMinutes || 0} tracked minutes`} tone="violet" /><InsightStat icon={Utensils} label="Meal adherence" value={`${summary.mealAdherencePercent || 0}%`} detail={`${summary.mealsFollowed || 0} followed of ${summary.mealsLogged || 0}`} tone="emerald" /></div></div></section>;
}

function InsightStat({ icon: Icon, label, value, detail, tone }) { const styles = { amber: "text-amber-300 bg-amber-400/10", violet: "text-violet-300 bg-violet-400/10", emerald: "text-emerald-300 bg-emerald-400/10" }; return <article className="rounded-2xl border border-white/[0.08] bg-black/20 p-4"><span className={`grid h-8 w-8 place-items-center rounded-lg ${styles[tone]}`}><Icon size={16} /></span><p className="mt-3 text-[11px] font-bold uppercase tracking-[0.11em] text-zinc-500">{label}</p><p className="mt-1 text-2xl font-black text-white">{value}</p><p className="mt-1 text-xs text-zinc-500">{detail}</p></article>; }

function WorkoutForm({ form, setForm, busy, onClose, onSubmit }) {
  return <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Workout name" required value={form.title} onChange={(value) => setForm({ ...form, title: value })} placeholder="Upper body strength" /><Select label="Day" value={form.weekday} onChange={(value) => setForm({ ...form, weekday: value })} options={weekdays.map((name, index) => [String(index + 1), name])} /><Field label="Focus (optional)" value={form.focus} onChange={(value) => setForm({ ...form, focus: value })} placeholder="Back, shoulders, core" /><Field label="Minutes" type="number" min="5" max="300" value={form.durationMinutes} onChange={(value) => setForm({ ...form, durationMinutes: value })} /><label className="sm:col-span-2 text-xs font-semibold text-zinc-400">Notes<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} maxLength="500" rows="2" placeholder="Optional plan notes" className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-400 hover:text-white">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy && <LoaderCircle size={15} className="animate-spin" />}Save workout</button></div></form>;
}

function MealForm({ form, setForm, busy, onClose, onSubmit }) {
  return <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/[0.05] p-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Meal name" required value={form.label} onChange={(value) => setForm({ ...form, label: value })} placeholder="Paneer salad bowl" /><Select label="Meal type" value={form.mealType} onChange={(value) => setForm({ ...form, mealType: value })} options={mealTypes.map((name) => [name, dayLabel(name)])} /><label className="text-xs font-semibold text-zinc-400">Date<input required type="date" max={localDayKey()} value={form.mealDate} onChange={(event) => setForm({ ...form, mealDate: event.target.value })} className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/60" /></label><Field label="Est. calories" type="number" min="0" max="3000" value={form.estimatedCalories} onChange={(value) => setForm({ ...form, estimatedCalories: value })} placeholder="500" /><label className="sm:col-span-2 text-xs font-semibold text-zinc-400">Details (optional)<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} maxLength="500" rows="2" placeholder="Portion, ingredients, or note" className="mt-1.5 w-full resize-none rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/60" /></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl px-3 py-2 text-sm font-semibold text-zinc-400 hover:text-white">Cancel</button><button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{busy && <LoaderCircle size={15} className="animate-spin" />}Save meal</button></div></form>;
}

function WorkoutRow({ workout, canComplete, completed, busy, onComplete, onRemove }) {
  const isBusy = busy === `workout-${workout.id}`;
  return <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${completed ? "border-emerald-400/20 bg-emerald-500/[0.07]" : "border-white/[0.07] bg-black/15"}`}><button type="button" aria-label={completed ? "Mark workout incomplete" : "Mark workout complete"} disabled={!canComplete || isBusy} onClick={onComplete} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition disabled:cursor-not-allowed ${completed ? "border-emerald-400/30 bg-emerald-500 text-white" : canComplete ? "border-white/[0.14] text-zinc-500 hover:border-violet-400/60 hover:text-violet-200" : "border-white/[0.06] text-zinc-700"}`}>{isBusy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={17} />}</button><div className="min-w-0 flex-1"><p className={`font-semibold ${completed ? "text-emerald-100 line-through decoration-emerald-400/60" : "text-white"}`}>{workout.title}</p><p className="mt-0.5 text-xs text-zinc-500">{[workout.focus, workout.durationMinutes ? `${workout.durationMinutes} min` : null].filter(Boolean).join(" · ") || "Flexible session"}{!canComplete && " · Complete on its planned day"}</p></div><button type="button" aria-label={`Remove ${workout.title}`} disabled={busy === `remove-${workout.id}`} onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-lg text-zinc-600 transition hover:bg-red-500/10 hover:text-red-300"><Trash2 size={15} /></button></div>;
}

function MealRow({ meal, busy, onToggle }) {
  const date = new Date(meal.mealDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return <div className={`flex items-center gap-3 rounded-2xl border p-3.5 ${meal.isFollowed ? "border-emerald-400/20 bg-emerald-500/[0.07]" : "border-white/[0.07] bg-black/15"}`}><button type="button" disabled={busy} onClick={onToggle} aria-label={meal.isFollowed ? "Mark meal not followed" : "Mark meal followed"} className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition ${meal.isFollowed ? "border-emerald-400/30 bg-emerald-500 text-white" : "border-white/[0.14] text-zinc-500 hover:border-emerald-400/60 hover:text-emerald-200"}`}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : <Check size={17} />}</button><div className="min-w-0 flex-1"><p className={`truncate font-semibold ${meal.isFollowed ? "text-emerald-100" : "text-white"}`}>{meal.label}</p><p className="mt-0.5 text-xs text-zinc-500">{dayLabel(meal.mealType)} · {date}{meal.estimatedCalories !== null && meal.estimatedCalories !== undefined ? ` · ~${meal.estimatedCalories} kcal` : ""}</p></div>{meal.source === "AI_PLAN" && <span className="rounded-lg bg-violet-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-200">AI</span>}</div>;
}

function Field({ label, value, onChange, type = "text", ...props }) { return <label className="text-xs font-semibold text-zinc-400">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" {...props} /></label>; }
function Select({ label, value, onChange, options }) { return <label className="text-xs font-semibold text-zinc-400">{label}<span className="relative mt-1.5 block"><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none rounded-xl border border-white/[0.1] bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/60">{options.map(([key, text]) => <option key={key} value={key} className="bg-[#171821]">{text}</option>)}</select><ChevronDown size={15} className="pointer-events-none absolute right-3 top-3 text-zinc-500" /></span></label>; }
function Empty({ title, detail, icon: Icon }) { return <div className="grid place-items-center rounded-2xl border border-dashed border-white/[0.12] bg-black/10 px-5 py-12 text-center"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-zinc-500"><Icon size={20} /></span><p className="mt-4 font-semibold text-white">{title}</p><p className="mt-1 max-w-xs text-sm leading-5 text-zinc-500">{detail}</p></div>; }
function LoadingState() { return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin" /> Loading your wellness space…</div>; }

export default WellnessPage;
