import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CheckCircle2, ClipboardCheck, ShoppingBag } from "lucide-react";

const steps = [
  { icon: ShoppingBag, title: "Choose a pass", text: "Browse active memberships from verified gyms and members.", accent: "violet" },
  { icon: ClipboardCheck, title: "Start the transfer", text: "Submit a request with the method that works for you.", accent: "sky" },
  { icon: BadgeCheck, title: "Verify the handover", text: "Seller and gym approval keep each transfer clear and accountable.", accent: "cyan" },
  { icon: CheckCircle2, title: "Train without delay", text: "Your membership is moved securely with its original validity intact.", accent: "emerald" },
];

function HowItWorksSection() {
  return <section id="how-it-works" className="relative overflow-hidden bg-[#090a10] py-24 sm:py-32"><div className="absolute left-1/2 top-0 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-400/40 to-transparent" /><div className="mx-auto max-w-7xl px-6 sm:px-8"><motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-300">A clearer transfer journey</p><h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">Five minutes to begin.<br /><span className="text-violet-300">A safer way to transfer.</span></h2><p className="mt-5 text-base leading-7 text-zinc-400">FitSwap keeps every step visible—from the listing to the final ownership change.</p></motion.div><div className="relative mt-14 grid gap-4 md:grid-cols-4"><div className="absolute left-[12%] right-[12%] top-10 hidden h-px bg-gradient-to-r from-violet-500/10 via-sky-400/65 to-emerald-400/10 md:block" />{steps.map((step, index) => <motion.article key={step.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.1 }} whileHover={{ y: -7 }} className="landing-glass-card relative p-6"><span className="absolute right-5 top-4 text-xs font-bold text-zinc-600">0{index + 1}</span><span className={`grid h-12 w-12 place-items-center rounded-2xl ${step.accent === "violet" ? "bg-violet-500/15 text-violet-200" : step.accent === "sky" ? "bg-sky-500/15 text-sky-200" : step.accent === "cyan" ? "bg-cyan-500/15 text-cyan-200" : "bg-emerald-500/15 text-emerald-200"}`}><step.icon size={22} /></span><h3 className="mt-6 text-lg font-semibold text-white">{step.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{step.text}</p>{index !== steps.length - 1 && <ArrowRight size={16} className="mt-5 text-sky-300 md:hidden" />}</motion.article>)}</div></div></section>;
}

export default HowItWorksSection;
