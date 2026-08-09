import { motion } from "framer-motion";
import { Activity, Building2, ShieldCheck, Store } from "lucide-react";

const stats = [
  { label: "Active listings", icon: Store, accent: "text-violet-200" },
  { label: "Partner gyms", icon: Building2, accent: "text-sky-200" },
  { label: "Transfer workflow", icon: ShieldCheck, accent: "text-emerald-200", staticValue: "Protected" },
  { label: "Marketplace access", icon: Activity, accent: "text-cyan-200", staticValue: "24/7" },
];

function StatsSection({ gymCount, listingCount }) {
  const values = [listingCount, gymCount, null, null];
  return <section className="relative z-20 -mt-10 pb-16"><div className="mx-auto max-w-7xl px-6 sm:px-8"><div className="grid gap-3 rounded-3xl border border-white/[0.1] bg-[#11131c]/80 p-3 shadow-2xl shadow-black/25 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">{stats.map((stat, index) => <motion.article key={stat.label} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08 }} whileHover={{ y: -3 }} className="rounded-2xl border border-transparent p-5 transition hover:border-white/[0.1] hover:bg-white/[0.035]"><stat.icon size={19} className={stat.accent} /><p className={`mt-4 text-2xl font-bold ${stat.accent}`}>{stat.staticValue || Number(values[index] || 0)}</p><p className="mt-1.5 text-sm text-zinc-500">{stat.label}</p></motion.article>)}</div></div></section>;
}

export default StatsSection;
