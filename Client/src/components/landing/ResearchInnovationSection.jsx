import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CircleCheckBig, Dumbbell, ShieldCheck, Sparkles } from "lucide-react";

const transferSteps = [
  { icon: Dumbbell, title: "List your pass", text: "Membership details, remaining validity and price are all visible." },
  { icon: ShieldCheck, title: "Verify the handover", text: "Requests, payment status and approvals stay tied to one record." },
  { icon: CircleCheckBig, title: "Keep moving", text: "Once complete, the membership moves to its next verified owner." },
];

function ResearchInnovationSection() {
  return (
    <section className="landing-system-section relative overflow-hidden py-20 sm:py-28">
      <div className="landing-system-aura absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[.74fr_1.26fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
          >
            <p className="landing-section-label inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em]"><Sparkles size={13} /> The FitSwap workflow</p>
            <h2 className="mt-5 text-4xl font-black leading-[.98] tracking-[-0.045em] text-white sm:text-5xl">A transfer should feel simple.</h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-400">Behind every listing is a clear record of who owns the pass, what happens next, and when the handover is complete.</p>
            <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3.5 py-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><BadgeCheck size={18} /></span>
              <span><strong className="block text-sm text-white">One visible transfer trail</strong><span className="mt-0.5 block text-xs text-zinc-500">Clear for buyers, sellers, and gym owners.</span></span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="landing-system-board relative overflow-hidden rounded-[2rem] p-5 sm:p-7"
          >
            <div className="landing-system-board-grid absolute inset-0" />
            <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.17em] text-[#f7bedf]">Transfer timeline</p><p className="mt-1 text-lg font-bold text-white">Every step stays in sync</p></div>
              <span className="rounded-full border border-emerald-300/15 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold text-emerald-200">Live status</span>
            </div>

            <div className="relative mt-6 space-y-3 before:absolute before:bottom-8 before:left-[1.35rem] before:top-8 before:w-px before:bg-gradient-to-b before:from-[#ff8c63] via-[#f257b7] to-[#a78bfa]">
              {transferSteps.map((step, index) => (
                <motion.article
                  key={step.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ delay: index * 0.1 }}
                  className="landing-system-step relative flex items-center gap-4 rounded-2xl p-4 sm:p-5"
                >
                  <span className="landing-system-icon z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl"><step.icon size={19} /></span>
                  <div><p className="text-base font-bold text-white">{step.title}</p><p className="mt-1 text-sm leading-6 text-zinc-400">{step.text}</p></div>
                  <ArrowRight size={17} className="ml-auto shrink-0 text-[#ff9671]" />
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ResearchInnovationSection;
