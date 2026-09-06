import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ClipboardCheck, Dumbbell, LoaderCircle, Plus, Salad, Trash2, Utensils, X } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { archiveWorkout, createMealLog, createWorkout, getMealLogs, getWorkoutPlan, setWorkoutCompletion, updateMealLog } from "../../api/wellness.api";
import { useToast } from "../../hooks/useToast";

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
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showMealForm, setShowMealForm] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ weekday: String(weekdayNumber()), title: "", focus: "", durationMinutes: "45", notes: "" });
  const [mealForm, setMealForm] = useState({ mealDate: localDayKey(), mealType: "OTHER", label: "", description: "", estimatedCalories: "" });

  const load = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      const [workouts, meals] = await Promise.all([getWorkoutPlan(), getMealLogs()]);
      setWorkoutData(workouts);
      setMealData(meals);
    } catch (error) {
      showToast(error.response?.data?.message || "Unable to load your wellness data.", "error");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

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
