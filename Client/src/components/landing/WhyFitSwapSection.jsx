import { motion } from "framer-motion";
import { BadgeCheck, BrainCircuit, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "Secure transfers", text: "Membership ownership moves through controlled, auditable steps.", color: "text-sky-200 bg-sky-500/12" },
  { icon: BadgeCheck, title: "Verified gyms", text: "Gym profiles and plans are reviewed before appearing in FitSwap.", color: "text-emerald-200 bg-emerald-500/12" },
  { icon: WalletCards, title: "Better value", text: "Sell unused time or discover premium plans at a fairer price.", color: "text-violet-200 bg-violet-500/12" },
  { icon: BrainCircuit, title: "Built for smarter policy", text: "A growing system for transfer rules, insights, and risk signals.", color: "text-fuchsia-200 bg-fuchsia-500/12" },
];

function WhyFitSwapSection() {
  return <section className="relative bg-[#0b0b10] py-24 sm:py-32"><div className="landing-orb landing-orb-left" /><div className="mx-auto max-w-7xl px-6 sm:px-8"><div className="grid items-end gap-8 lg:grid-cols-[.75fr_1.25fr]"><motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }}><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Designed for confidence</p><h2 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">More useful than a listing board.</h2><p className="mt-5 max-w-md text-base leading-7 text-zinc-400">A purpose-built marketplace for memberships that need a secure ownership handover—not just another classifieds page.</p><div className="mt-8 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200"><Sparkles size={14} /> Built around real transfer logic</div></motion.div><div className="grid gap-4 sm:grid-cols-2">{features.map((feature, index) => <motion.article key={feature.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -6, rotateX: 2, rotateY: index % 2 ? -2 : 2 }} className="landing-glass-card min-h-[190px] p-6 [transform-style:preserve-3d]"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${feature.color}`}><feature.icon size={21} /></span><h3 className="mt-6 text-lg font-semibold text-white">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-zinc-400">{feature.text}</p></motion.article>)}</div></div></div></section>;
}

export default WhyFitSwapSection;
