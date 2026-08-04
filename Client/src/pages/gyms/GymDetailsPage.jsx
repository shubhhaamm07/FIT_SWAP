import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Check, CircleAlert, Clock3, CreditCard, Dumbbell, LoaderCircle, MapPin, Phone, Sparkles, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { getGymById } from "../../api/gym.api";
import { purchaseMembership } from "../../api/membership.api";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const fallbackImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200";

function GymDetailsPage() {
  const { gymId } = useParams();
  const navigate = useNavigate();
  const [gym, setGym] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [buying, setBuying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try { setGym(await getGymById(gymId)); }
      catch (error) { setMessage(error.response?.data?.message || "Unable to load this gym."); }
      finally { setLoading(false); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [gymId]);

  const confirmPurchase = async () => {
    if (!selectedPlan) return;
    try {
      setBuying(true);
      await purchaseMembership(selectedPlan.id);
      setMessage(`${selectedPlan.name} is now active in your memberships.`);
      setSelectedPlan(null);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to activate this membership.");
    } finally {
      setBuying(false);
    }
  };

  if (loading) return <DashboardLayout><div className="flex min-h-96 items-center justify-center gap-2 text-sm text-zinc-400"><LoaderCircle size={18} className="animate-spin" /> Loading gym…</div></DashboardLayout>;
  if (!gym) return <DashboardLayout><div className="mx-auto max-w-xl rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-red-200">{message || "Gym not found."}<button type="button" onClick={() => navigate("/gyms")} className="mt-4 block text-sm font-semibold text-white">Back to gyms</button></div></DashboardLayout>;

  const image = gym.images?.find((item) => item.isPrimary)?.imageUrl || gym.images?.[0]?.imageUrl || fallbackImage;
  const isError = message.includes("Unable") || message.includes("already");

  return <DashboardLayout>
    <main className="mx-auto w-full max-w-5xl pb-8">
      <button type="button" onClick={() => navigate("/gyms")} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"><ArrowLeft size={16} /> All gyms</button>
      {message && <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${isError ? "border-red-500/20 bg-red-500/5 text-red-300" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-300"}`}><CircleAlert size={16} />{message}{!isError && <button type="button" onClick={() => navigate("/memberships")} className="ml-auto shrink-0 text-xs font-bold text-emerald-200 underline">View memberships</button>}</div>}
      <section className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#11121a]"><div className="relative h-64 sm:h-80"><img src={image} alt="" className="h-full w-full object-cover opacity-65" /><div className="absolute inset-0 bg-gradient-to-t from-[#11121a] via-[#11121a]/15" /></div><div className="relative -mt-20 px-6 pb-7 sm:px-8"><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-xs font-bold text-white"><BadgeCheck size={14} /> Approved FitSwap gym</span><h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">{gym.name}</h1><p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-300"><MapPin size={15} /> {gym.address}, {gym.city}, {gym.state} {gym.pincode}</p><p className="mt-5 max-w-3xl text-sm leading-6 text-zinc-400">{gym.description || "An official FitSwap partner gym offering fresh memberships for your fitness journey."}</p></div></section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]"><section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/10 text-violet-300"><Dumbbell size={19} /></div><div><h2 className="font-bold text-white">Official memberships</h2><p className="mt-1 text-sm text-zinc-500">Buy a new plan directly from {gym.name}.</p></div></div><div className="mt-6 space-y-3">{gym.plans?.length ? gym.plans.map((plan) => <PlanCard key={plan.id} plan={plan} onChoose={() => setSelectedPlan(plan)} />) : <p className="rounded-xl border border-dashed border-white/[0.1] p-5 text-sm text-zinc-500">This gym has no published membership plans yet.</p>}</div></section><aside className="space-y-5"><section className="rounded-2xl border border-white/[0.08] bg-[#11121a] p-5"><h2 className="font-semibold text-white">Gym information</h2><div className="mt-4 space-y-4 text-sm text-zinc-400"><p className="flex items-center gap-2"><Phone size={15} className="text-violet-300" /> {gym.phone}</p><p className="flex items-center gap-2"><Clock3 size={15} className="text-violet-300" /> Contact gym for opening hours</p></div></section><section className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.06] p-5"><Sparkles size={20} className="text-violet-300" /><h2 className="mt-3 font-semibold text-white">Why buy direct?</h2><ul className="mt-3 space-y-2 text-sm leading-5 text-zinc-400"><li className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-300" /> Fresh membership issued by the gym</li><li className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-300" /> Full plan validity from today</li><li className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-300" /> Official FitSwap partner</li></ul></section></aside></div>
    </main>
    {selectedPlan && <PurchasePlanModal gym={gym} plan={selectedPlan} buying={buying} onClose={() => setSelectedPlan(null)} onConfirm={confirmPurchase} />}
  </DashboardLayout>;
}

function PlanCard({ plan, onChoose }) { return <article className="rounded-2xl border border-white/[0.08] bg-black/10 p-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-white">{plan.name}</p><p className="mt-1 text-sm text-zinc-500">{plan.durationInDays} days · {plan.transferable ? "Transferable" : "Non-transferable"}{plan.freezeAllowed ? " · Freeze available" : ""}</p>{plan.description && <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>}</div><div className="flex items-center justify-between gap-4 sm:block sm:text-right"><p className="text-xl font-bold text-white">{formatPrice(plan.price)}</p><button type="button" onClick={onChoose} className="mt-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">Get membership</button></div></div></article>; }

function PurchasePlanModal({ gym, plan, buying, onClose, onConfirm }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-3xl border border-white/[0.1] bg-[#15161f] p-6 shadow-2xl shadow-black/60"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-violet-300">Official membership</p><h2 className="mt-1 text-xl font-bold text-white">Confirm your plan</h2></div><button type="button" disabled={buying} onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl text-zinc-400 hover:bg-white/[0.06] hover:text-white"><X size={18} /></button></div><div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/15 p-4"><p className="font-semibold text-white">{gym.name}</p><p className="mt-1 text-sm text-zinc-400">{plan.name} · {plan.durationInDays} days</p><div className="mt-4 flex items-center justify-between border-t border-white/[0.07] pt-4"><span className="text-sm text-zinc-500">Membership price</span><span className="text-xl font-bold text-white">{formatPrice(plan.price)}</span></div></div><div className="mt-4 flex gap-3 rounded-xl border border-violet-500/15 bg-violet-500/[0.06] p-3 text-sm leading-5 text-zinc-400"><CreditCard size={18} className="mt-0.5 shrink-0 text-violet-300" /><p>Confirming activates this membership immediately for the selected plan. Online payment checkout can be connected next; this development flow records the membership directly.</p></div><button type="button" disabled={buying} onClick={onConfirm} className="mt-5 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60">{buying ? "Activating membership…" : `Confirm ${formatPrice(plan.price)} membership`}</button></section></div>; }

export default GymDetailsPage;
