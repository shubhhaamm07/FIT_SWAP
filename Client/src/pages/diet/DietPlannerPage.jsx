import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Apple,
  ArrowRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  LoaderCircle,
  RefreshCw,
  Salad,
  ShoppingBasket,
  Sparkles,
  Shuffle,
  Target,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";

import DashboardLayout from "../../layouts/DashboardLayout";
import { generateDietPlan, swapDietMeal } from "../../api/diet-planner.api";

const initialForm = {
  age: "",
  sex: "UNSPECIFIED",
  heightCm: "",
  weightKg: "",
  goal: "GENERAL_FITNESS",
  activityLevel: "MODERATE",
  diet: "VEGETARIAN",
  mealsPerDay: "4",
  budget: "BALANCED",
  weeklyBudgetInr: "",
  dietaryNotes: "",
  favouriteFoods: "",
  avoidFoods: "",
  cuisineStyle: "ANY",
  cookingStyle: "FLEXIBLE",
  workoutTime: "NOT_SCHEDULED",
  workoutDays: [],
  healthConcerns: [],
  aiConsent: false,
};

const goals = [
  { value: "LOSE_WEIGHT", label: "Lose weight", detail: "A gradual, sustainable reduction", icon: Target },
  { value: "MAINTAIN", label: "Maintain", detail: "Stay consistent at your current level", icon: Check },
  { value: "GAIN_MUSCLE", label: "Build muscle", detail: "Support training with more protein", icon: Dumbbell },
  { value: "GENERAL_FITNESS", label: "Feel fitter", detail: "Steady energy for daily movement", icon: Sparkles },
];

const selectOptions = {
  activityLevel: [
    ["LOW", "Mostly seated"],
    ["LIGHT", "Light activity (1–3 days/week)"],
    ["MODERATE", "Regular activity (3–5 days/week)"],
    ["HIGH", "Intense activity (6–7 days/week)"],
  ],
  diet: [
    ["VEGETARIAN", "Vegetarian"],
    ["EGGETARIAN", "Egg-based vegetarian"],
    ["NON_VEGETARIAN", "Non-vegetarian"],
    ["VEGAN", "Vegan"],
  ],
  mealsPerDay: [
    ["3", "3 meals"],
    ["4", "4 meals"],
    ["5", "5 meals"],
  ],
  budget: [
    ["ECONOMY", "Economical"],
    ["BALANCED", "Balanced"],
    ["FLEXIBLE", "Flexible"],
  ],
  cuisineStyle: [
    ["ANY", "Any Indian cuisine"],
    ["NORTH_INDIAN", "North Indian"],
    ["SOUTH_INDIAN", "South Indian"],
    ["PUNJABI", "Punjabi"],
    ["GUJARATI", "Gujarati"],
    ["BENGALI", "Bengali"],
    ["MAHARASHTRIAN", "Maharashtrian"],
  ],
  cookingStyle: [
    ["FLEXIBLE", "Flexible cooking"],
    ["QUICK_15_MIN", "Quick — 15 minutes"],
    ["MEAL_PREP", "Batch cook / meal prep"],
    ["MINIMAL_COOKING", "Minimal cooking"],
  ],
  workoutTime: [
    ["NOT_SCHEDULED", "No fixed workout time"],
    ["MORNING", "Morning workout"],
    ["AFTERNOON", "Afternoon workout"],
    ["EVENING", "Evening workout"],
  ],
};

const workoutDays = [
  ["MON", "Mon"], ["TUE", "Tue"], ["WED", "Wed"], ["THU", "Thu"],
  ["FRI", "Fri"], ["SAT", "Sat"], ["SUN", "Sun"],
];

const healthConcerns = [
  ["THYROID", "Thyroid condition"],
  ["PCOS", "PCOS"],
  ["DIABETES", "Diabetes"],
  ["HIGH_BLOOD_PRESSURE", "High blood pressure"],
  ["HIGH_CHOLESTEROL", "High cholesterol"],
  ["KIDNEY_DISEASE", "Kidney condition"],
  ["HEART_DISEASE", "Heart condition"],
  ["LIVER_DISEASE", "Liver condition"],
  ["PREGNANCY_POSTPARTUM", "Pregnancy / postpartum"],
  ["EATING_DISORDER", "Eating disorder"],
  ["FOOD_ALLERGY", "Food allergy"],
  ["OTHER_MEDICAL_CONDITION", "Another medical condition"],
];

function DietPlannerPage() {
  const [form, setForm] = useState(initialForm);
  const [plan, setPlan] = useState(null);
  const [planInput, setPlanInput] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);
  const [loading, setLoading] = useState(false);
  const [swappingMeal, setSwappingMeal] = useState("");
  const [error, setError] = useState("");

  const selectedDayPlan = plan?.weeklyPlan?.[selectedDay] || null;
  const profileSummary = useMemo(() => {
    if (!plan) return null;
    return `${plan.profile.goalLabel} · ${formatDiet(plan.profile.diet)} · ${formatActivity(plan.profile.activityLevel)}`;
  }, [plan]);

  const updateForm = (field, value) => {
    setError("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleHealthConcern = (concern) => {
    setError("");
    setForm((current) => ({
      ...current,
      healthConcerns: current.healthConcerns.includes(concern)
        ? current.healthConcerns.filter((item) => item !== concern)
        : [...current.healthConcerns, concern].slice(0, 4),
    }));
  };

  const toggleWorkoutDay = (day) => {
    setForm((current) => ({
      ...current,
      workoutDays: current.workoutDays.includes(day)
        ? current.workoutDays.filter((item) => item !== day)
        : [...current.workoutDays, day],
    }));
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const profile = {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        mealsPerDay: Number(form.mealsPerDay),
      };
      const nextPlan = await generateDietPlan(profile);
      setPlan(nextPlan);
      setPlanInput(profile);
      setSelectedDay(0);
      window.setTimeout(() => {
        document.getElementById("your-diet-plan")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not create your plan. Please check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async (meal, mealIndex) => {
    if (!planInput || !selectedDayPlan) return;

    const key = `${selectedDayPlan.day}-${mealIndex}`;
    setError("");
    setSwappingMeal(key);

    try {
      const replacement = await swapDietMeal({
        profile: planInput,
        day: selectedDayPlan.day,
        mealLabel: meal.label,
        targetCalories: meal.targetCalories,
        currentSuggestion: meal.suggestion,
      });
      setPlan((current) => ({
        ...current,
        weeklyPlan: current.weeklyPlan.map((day) => day.day !== selectedDayPlan.day
          ? day
          : {
            ...day,
            meals: day.meals.map((currentMeal, index) => index === mealIndex
              ? { ...currentMeal, suggestion: replacement.suggestion, swapNote: replacement.note }
              : currentMeal),
          }),
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "We could not swap that meal. Please try again.");
    } finally {
      setSwappingMeal("");
    }
  };

  return (
    <DashboardLayout>
      <main className="mx-auto w-full max-w-6xl pb-10">
        <section className="relative overflow-hidden rounded-[28px] border border-violet-400/15 bg-[radial-gradient(circle_at_88%_20%,rgba(167,139,250,.24),transparent_28%),radial-gradient(circle_at_4%_100%,rgba(16,185,129,.13),transparent_30%),#11121a] p-6 sm:p-8 lg:p-10">
          <div className="absolute -right-20 -top-16 h-56 w-56 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/[0.08] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-violet-200">
              <BrainCircuit size={15} /> FitSwap AI Diet Planner · Beta
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">Eat with a plan. Train with purpose.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-300 sm:text-base">FitSwap AI creates a practical Indian-food meal structure from your goal, movement, diet, preferences, and budget. FitSwap does not store the details you enter here.</p>
          </div>
          <div className="relative mt-6 flex flex-wrap gap-3 text-xs text-zinc-300">
            <FeatureChip icon={Sparkles} text="Goal-based calories" />
            <FeatureChip icon={UtensilsCrossed} text="7-day meal structure" />
            <FeatureChip icon={Salad} text="Indian food options" />
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form id="diet-profile-form" onSubmit={handleGenerate} className="rounded-3xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-7">
            <div className="flex flex-col gap-3 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-violet-300">Your wellness profile</p>
                <h2 className="mt-1 text-xl font-bold text-white">Tell us what fits your routine.</h2>
                <p className="mt-1 text-sm leading-5 text-zinc-500">Use realistic details for a more useful starting point.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/15 px-3 py-1.5 text-xs text-zinc-400"><Apple size={14} className="text-emerald-300" /> General wellness only</span>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-white">What is your goal?</legend>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {goals.map(({ value, label, detail, icon: Icon }) => {
                  const selected = form.goal === value;
                  return <button key={value} type="button" onClick={() => updateForm("goal", value)} className={`flex min-h-24 items-start gap-3 rounded-2xl border p-4 text-left transition ${selected ? "border-violet-400/50 bg-violet-500/[0.11] shadow-[0_10px_24px_rgba(76,29,149,.16)]" : "border-white/[0.08] bg-black/10 hover:border-white/[0.16] hover:bg-white/[0.035]"}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${selected ? "bg-violet-500 text-white" : "bg-white/[0.06] text-zinc-300"}`}><Icon size={17} /></span>
                    <span><span className="block text-sm font-semibold text-white">{label}</span><span className="mt-1 block text-xs leading-5 text-zinc-500">{detail}</span></span>
                  </button>;
                })}
              </div>
            </fieldset>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <NumberField label="Age" value={form.age} onChange={(value) => updateForm("age", value)} placeholder="e.g. 22" min="18" max="85" suffix="years" />
              <SelectField label="Body profile (optional)" value={form.sex} onChange={(value) => updateForm("sex", value)} options={[["UNSPECIFIED", "Prefer not to say"], ["FEMALE", "Female"], ["MALE", "Male"]]} />
              <NumberField label="Height" value={form.heightCm} onChange={(value) => updateForm("heightCm", value)} placeholder="e.g. 175" min="130" max="230" suffix="cm" />
              <NumberField label="Weight" value={form.weightKg} onChange={(value) => updateForm("weightKg", value)} placeholder="e.g. 70" min="35" max="250" suffix="kg" step="0.1" />
              <SelectField label="Activity level" value={form.activityLevel} onChange={(value) => updateForm("activityLevel", value)} options={selectOptions.activityLevel} />
              <SelectField label="Diet preference" value={form.diet} onChange={(value) => updateForm("diet", value)} options={selectOptions.diet} />
              <SelectField label="Meals in a day" value={form.mealsPerDay} onChange={(value) => updateForm("mealsPerDay", value)} options={selectOptions.mealsPerDay} />
              <SelectField label="Food budget" value={form.budget} onChange={(value) => updateForm("budget", value)} options={selectOptions.budget} />
              <NumberField label="Weekly food budget (optional)" required={false} value={form.weeklyBudgetInr} onChange={(value) => updateForm("weeklyBudgetInr", value)} placeholder="e.g. 1500" min="250" max="100000" suffix="₹ / week" />
              <SelectField label="Cuisine style" value={form.cuisineStyle} onChange={(value) => updateForm("cuisineStyle", value)} options={selectOptions.cuisineStyle} />
              <SelectField label="Cooking routine" value={form.cookingStyle} onChange={(value) => updateForm("cookingStyle", value)} options={selectOptions.cookingStyle} />
              <SelectField label="Workout time" value={form.workoutTime} onChange={(value) => updateForm("workoutTime", value)} options={selectOptions.workoutTime} />
            </div>

            <fieldset className="mt-5 rounded-2xl border border-white/[0.08] bg-black/10 p-4">
              <legend className="px-1 text-sm font-semibold text-white">Food and routine preferences <span className="font-normal text-zinc-600">(optional)</span></legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {workoutDays.map(([value, label]) => {
                  const selected = form.workoutDays.includes(value);
                  return <button key={value} type="button" onClick={() => toggleWorkoutDay(value)} aria-pressed={selected} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${selected ? "border-violet-400/50 bg-violet-500/15 text-violet-100" : "border-white/[0.09] bg-black/10 text-zinc-400 hover:border-white/[0.2] hover:text-zinc-200"}`}>{label}</button>;
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">Choose your usual workout days so meal timing can fit your routine.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-zinc-300">Favourite foods
                  <input value={form.favouriteFoods} onChange={(event) => updateForm("favouriteFoods", event.target.value)} maxLength={100} placeholder="e.g. paneer, poha, dal" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" />
                </label>
                <label className="block text-sm font-medium text-zinc-300">Foods to avoid
                  <input value={form.avoidFoods} onChange={(event) => updateForm("avoidFoods", event.target.value)} maxLength={100} placeholder="e.g. mushrooms, bitter gourd" className="mt-2 w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" />
                </label>
              </div>
              <label className="mt-4 block text-sm font-medium text-zinc-300">Food notes
                <textarea value={form.dietaryNotes} onChange={(event) => updateForm("dietaryNotes", event.target.value)} maxLength={180} rows={3} placeholder="For example: avoid very spicy food, prefer home-cooked meals… Do not use this field for allergies or medical conditions." className="mt-2 w-full resize-none rounded-2xl border border-white/[0.1] bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" />
              </label>
            </fieldset>

            <fieldset className="mt-5 rounded-2xl border border-amber-400/15 bg-amber-500/[0.045] p-4">
              <legend className="px-1 text-sm font-semibold text-amber-100">Health considerations <span className="font-normal text-amber-100/60">(optional)</span></legend>
              <p className="mt-1 text-xs leading-5 text-amber-100/65">Select only if relevant. FitSwap will not generate a disease-specific or allergy-safe plan; it will guide you to a qualified dietitian or doctor instead.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {healthConcerns.map(([value, label]) => {
                  const selected = form.healthConcerns.includes(value);
                  return <button key={value} type="button" onClick={() => toggleHealthConcern(value)} aria-pressed={selected} className={`rounded-full border px-3 py-2 text-xs font-semibold transition ${selected ? "border-amber-300/55 bg-amber-400/15 text-amber-100" : "border-white/[0.09] bg-black/10 text-zinc-400 hover:border-amber-300/30 hover:text-amber-100"}`}>{label}</button>;
                })}
              </div>
              {form.healthConcerns.length > 0 && <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-amber-100"><AlertTriangle size={15} className="mt-0.5 shrink-0" /> Automatic AI meal generation will pause for this profile. A professional-review guide will be shown instead.</p>}
            </fieldset>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/15 p-4 text-sm text-zinc-400">
              <input required type="checkbox" checked={form.aiConsent} onChange={(event) => updateForm("aiConsent", event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/30 accent-violet-500" />
              <span>I understand that FitSwap will send these plan preferences—not my name or account details—to its AI service to create this one-time plan. They are not saved in my FitSwap profile.</span>
            </label>

            {error && <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm leading-5 text-red-200"><AlertTriangle size={17} className="mt-0.5 shrink-0" />{error}</div>}

            <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-md text-xs leading-5 text-zinc-500">By continuing, you understand that this is general fitness guidance—not medical, allergy-safe, or therapeutic nutrition advice.</p>
              <button disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/40 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? <><LoaderCircle size={17} className="animate-spin" /> Creating your plan…</> : form.healthConcerns.length > 0 ? <><AlertTriangle size={17} /> Show health guidance <ArrowRight size={16} /></> : <><Sparkles size={17} /> Generate my plan <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>

          <aside className="h-fit rounded-3xl border border-amber-400/15 bg-[linear-gradient(150deg,rgba(245,158,11,.09),rgba(17,18,26,.95)_38%)] p-5 sm:p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-200"><AlertTriangle size={19} /></div>
            <h2 className="mt-4 font-bold text-white">Your safety comes first.</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">This planner is designed for healthy adults seeking general fitness guidance. It cannot diagnose health conditions or create a medical diet.</p>
            <ul className="mt-5 space-y-3 text-sm leading-5 text-zinc-300">
              <SafetyPoint text="Do not use it for food allergies or medical conditions without professional advice." />
              <SafetyPoint text="Speak with a doctor or dietitian for pregnancy, eating disorders, diabetes, kidney conditions, or a therapeutic diet." />
              <SafetyPoint text="No body measurements are stored when you generate a plan." />
            </ul>
          </aside>
        </section>

        {plan?.requiresProfessionalReview ? <ProfessionalReview plan={plan} /> : plan && <section id="your-diet-plan" className="mt-8 scroll-mt-28">
          <div className="rounded-3xl border border-violet-400/20 bg-[radial-gradient(circle_at_top_right,rgba(124,58,237,.18),transparent_32%),#11121a] p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-200"><Sparkles size={14} /> Generated with FitSwap AI</div>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">{plan.headline || "Your AI-created nutrition rhythm."}</h2>
                <p className="mt-2 text-sm text-zinc-400">{plan.summary || profileSummary}</p>
                <p className="mt-1 text-xs text-zinc-600">{profileSummary} · {plan.model}</p>
              </div>
              <button type="button" onClick={() => document.getElementById("diet-profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06]"><RefreshCw size={16} /> Update details</button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <TargetCard icon={Flame} label="Daily energy" value={`${plan.dailyTargets.calories} kcal`} detail={`${plan.dailyTargets.calorieRange.min}–${plan.dailyTargets.calorieRange.max} kcal`} tone="violet" />
              <TargetCard icon={Dumbbell} label="Protein" value={`${plan.dailyTargets.proteinGrams} g`} detail="Daily target" tone="emerald" />
              <TargetCard icon={Wheat} label="Carbohydrates" value={`${plan.dailyTargets.carbohydrateGrams} g`} detail="Daily target" tone="amber" />
              <TargetCard icon={Salad} label="Healthy fats" value={`${plan.dailyTargets.fatGrams} g`} detail="Daily target" tone="rose" />
            </div>

            <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
              <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold text-white">Your meal chart</p><p className="mt-1 text-sm text-zinc-500">Simple meal ideas—adjust portions to reach the shown target.</p></div><span className="text-xs font-semibold text-violet-200">{plan.profile.mealsPerDay} meals/day</span></div>
                <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                  {plan.weeklyPlan.map((day, index) => <button type="button" key={day.day} onClick={() => setSelectedDay(index)} className={`min-w-[72px] rounded-xl border px-3 py-2.5 text-center text-xs font-bold transition ${selectedDay === index ? "border-violet-400/50 bg-violet-500 text-white shadow-lg shadow-violet-950/35" : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-white"}`}><span className="block text-[10px] uppercase tracking-wide opacity-70">Day</span><span className="mt-0.5 block text-sm">{day.day}</span></button>)}
                </div>
                {selectedDayPlan && <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {selectedDayPlan.meals.map((meal, index) => {
                    const swapKey = `${selectedDayPlan.day}-${index}`;
                    const isSwapping = swappingMeal === swapKey;
                    return <article key={`${selectedDayPlan.day}-${meal.label}-${index}`} className="rounded-2xl border border-white/[0.08] bg-[#14151e] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-violet-300">{meal.label}</p><p className="mt-2 font-semibold leading-6 text-white">{meal.suggestion}</p></div><span className="shrink-0 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-bold text-zinc-300">~{meal.targetCalories} kcal</span></div>{meal.swapNote && <p className="mt-3 text-xs leading-5 text-emerald-200/80">{meal.swapNote}</p>}<button type="button" onClick={() => handleSwapMeal(meal, index)} disabled={Boolean(swappingMeal)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-200 transition hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-60">{isSwapping ? <><LoaderCircle size={14} className="animate-spin" /> Finding an alternative…</> : <><Shuffle size={14} /> Swap this meal</>}</button></article>;
                  })}
                </div>}
              </div>

              <div className="space-y-4">
                <InfoCard icon={BrainCircuit} title="Why this plan" items={plan.reasons} />
                <InfoCard icon={UtensilsCrossed} title="Make it practical" items={[plan.guidance.budgetTip, plan.guidance.mealTiming, plan.guidance.preparationTip]} />
                {plan.groceryList?.length > 0 && <GroceryList groups={plan.groceryList} />}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5"><div className="flex gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-200" /><div><p className="font-semibold text-amber-100">Before you begin</p><ul className="mt-2 space-y-1.5 text-sm leading-6 text-amber-100/75">{plan.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></div></div></div>
        </section>}
      </main>
    </DashboardLayout>
  );
}

function FeatureChip({ icon: Icon, text }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-black/15 px-3 py-1.5"><Icon size={14} className="text-violet-300" />{text}</span>;
}

function SafetyPoint({ text }) {
  return <li className="flex gap-2"><ChevronRight size={16} className="mt-0.5 shrink-0 text-amber-300" />{text}</li>;
}

function NumberField({ label, value, onChange, placeholder, min, max, suffix, step = "1", required = true }) {
  return <label className="block text-sm font-medium text-zinc-300">{label}<div className="relative mt-2"><input required={required} type="number" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={min} max={max} step={step} className="w-full rounded-xl border border-white/[0.1] bg-black/20 px-3 py-3 pr-14 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-400/60" /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-zinc-500">{suffix}</span></div></label>;
}

function SelectField({ label, value, onChange, options }) {
  return <label className="block text-sm font-medium text-zinc-300">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full appearance-none rounded-xl border border-white/[0.1] bg-black/20 px-3 py-3 text-sm text-white outline-none focus:border-violet-400/60">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue} className="bg-[#171821]">{optionLabel}</option>)}</select></label>;
}

function TargetCard({ icon: Icon, label, value, detail, tone }) {
  const tones = {
    violet: "bg-violet-500/12 text-violet-200",
    emerald: "bg-emerald-500/12 text-emerald-200",
    amber: "bg-amber-500/12 text-amber-200",
    rose: "bg-rose-500/12 text-rose-200",
  };
  return <article className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tones[tone]}`}><Icon size={17} /></span><p className="mt-4 text-xs font-bold uppercase tracking-[0.11em] text-zinc-500">{label}</p><p className="mt-1 text-2xl font-black tracking-tight text-white">{value}</p><p className="mt-1 text-xs text-zinc-500">{detail}</p></article>;
}

function InfoCard({ icon: Icon, title, items }) {
  return <article className="rounded-2xl border border-white/[0.08] bg-black/15 p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-200"><Icon size={16} /></span><h3 className="font-semibold text-white">{title}</h3></div><ul className="mt-4 space-y-3 text-sm leading-5 text-zinc-400">{items.filter(Boolean).map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" />{item}</li>)}</ul></article>;
}

function GroceryList({ groups }) {
  return <article className="rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.045] p-4"><div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-200"><ShoppingBasket size={16} /></span><div><h3 className="font-semibold text-white">Weekly grocery list</h3><p className="text-xs text-zinc-500">Approximate household quantities</p></div></div><div className="mt-4 space-y-4">{groups.map((group) => <div key={group.category}><p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-200">{group.category}</p><ul className="mt-2 space-y-1.5 text-sm leading-5 text-zinc-300">{group.items.map((item) => <li key={`${item.name}-${item.quantity}`} className="flex justify-between gap-3"><span>{item.name}</span><span className="shrink-0 text-zinc-500">{item.quantity}</span></li>)}</ul></div>)}</div></article>;
}

function ProfessionalReview({ plan }) {
  const concerns = plan.healthConcerns?.map(formatHealthConcern).join(", ") || "Your health notes";
  return <section id="your-diet-plan" className="mt-8 scroll-mt-28 rounded-3xl border border-amber-400/20 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,.12),transparent_32%),#11121a] p-5 sm:p-7"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1.5 text-xs font-bold text-amber-100"><AlertTriangle size={14} /> Professional review recommended</div><h2 className="mt-4 text-2xl font-black tracking-tight text-white">Health-aware mode is protecting you.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">You selected: <span className="font-semibold text-amber-100">{concerns}</span>. FitSwap will not create a disease-specific or allergy-safe diet from limited information.</p></div><button type="button" onClick={() => document.getElementById("diet-profile-form")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-black/15 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/[0.06]"><RefreshCw size={16} /> Update details</button></div><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><TargetCard icon={Flame} label="General energy estimate" value={`${plan.dailyTargets.calories} kcal`} detail="Share with a professional" tone="violet" /><TargetCard icon={Dumbbell} label="Protein estimate" value={`${plan.dailyTargets.proteinGrams} g`} detail="Share with a professional" tone="emerald" /><TargetCard icon={Wheat} label="Carbohydrate estimate" value={`${plan.dailyTargets.carbohydrateGrams} g`} detail="Share with a professional" tone="amber" /><TargetCard icon={Salad} label="Healthy-fat estimate" value={`${plan.dailyTargets.fatGrams} g`} detail="Share with a professional" tone="rose" /></div><div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-5"><p className="font-semibold text-amber-100">What to do next</p><ul className="mt-3 space-y-2 text-sm leading-6 text-amber-100/75">{plan.warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></div></section>;
}

function formatDiet(value) {
  return String(value || "").toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatActivity(value) {
  const label = selectOptions.activityLevel.find(([key]) => key === value)?.[1] || value;
  return String(label).replace(/\s*\(.+\)/, "");
}

function formatHealthConcern(value) {
  return healthConcerns.find(([key]) => key === value)?.[1] || formatDiet(value);
}

export default DietPlannerPage;
