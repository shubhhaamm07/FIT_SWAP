import { motion } from "framer-motion";
import { BrainCircuit, ChevronRight, DatabaseZap, ShieldAlert, Sparkles } from "lucide-react";

const milestones = [
  { icon: DatabaseZap, title: "Dynamic policy engine", text: "Transfer rules are evaluated from the membership, gym, and listing state." },
  { icon: ShieldAlert, title: "Fraud-aware workflow", text: "Controlled status changes create a clearer record for every handover." },
  { icon: BrainCircuit, title: "Smarter pricing direction", text: "Marketplace data can guide future fair-value suggestions for sellers." },
];

function ResearchInnovationSection() {
  return <section className="relative overflow-hidden bg-[#090a10] py-24 sm:py-32"><div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_44%,rgba(124,58,237,.16),transparent_24%),radial-gradient(circle_at_28%_86%,rgba(14,165,233,.11),transparent_22%)]" /><div className="relative mx-auto max-w-7xl px-6 sm:px-8"><div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center"><motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }}><div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/15 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-200"><Sparkles size={14} /> Research direction</div><h2 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">A marketplace that learns how transfers work.</h2><p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">FitSwap is designed as more than a buying and selling interface. Its workflow is a foundation for policy controls, risk signals, and better marketplace decisions.</p></motion.div><div className="relative space-y-4 before:absolute before:bottom-8 before:left-6 before:top-8 before:w-px before:bg-gradient-to-b before:from-violet-400/80 before:via-sky-400/50 before:to-transparent">{milestones.map((milestone, index) => <motion.article key={milestone.title} initial={{ opacity: 0, x: 24 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.12 }} className="landing-glass-card relative ml-0 flex gap-5 p-5 pl-20 sm:p-6 sm:pl-20"><span className="absolute left-3 top-6 z-10 grid h-11 w-11 place-items-center rounded-2xl border border-violet-300/20 bg-[#151426] text-violet-200 shadow-lg shadow-violet-950/40"><milestone.icon size={20} /></span><div><h3 className="text-lg font-semibold text-white">{milestone.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-400">{milestone.text}</p></div><ChevronRight size={18} className="ml-auto shrink-0 self-center text-sky-300" /></motion.article>)}</div></div></div></section>;
}

export default ResearchInnovationSection;
