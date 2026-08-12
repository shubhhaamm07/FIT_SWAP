import { motion } from "framer-motion";
import { BadgeCheck, Dumbbell, ShieldCheck, Sparkles, WalletCards } from "lucide-react";

const benefits = [
  {
    icon: BadgeCheck,
    title: "Verified memberships",
    text: "Know the gym, plan, validity and transfer status before you decide.",
  },
  {
    icon: ShieldCheck,
    title: "Clear handovers",
    text: "Every request follows visible steps instead of disappearing into messages.",
  },
  {
    icon: WalletCards,
    title: "Value that stays moving",
    text: "Let unused membership time become someone else’s next training month.",
  },
];

function WhyFitSwapSection() {
  return (
    <section className="landing-value-section relative overflow-hidden py-20 sm:py-28">
      <div className="landing-value-orb landing-value-orb-left" />
      <div className="landing-value-orb landing-value-orb-right" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="landing-section-label inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Sparkles size={13} /> Built for real gym members
          </p>
          <h2 className="mt-5 text-4xl font-black leading-[.98] tracking-[-0.045em] text-white sm:text-5xl">
            More value from every membership.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-zinc-400">
            FitSwap gives unused membership time a clear next step—while making the next buyer’s choice easier and safer.
          </p>
        </motion.div>

        <div className="landing-value-layout mt-10 grid gap-5 lg:grid-cols-[1.08fr_.92fr] lg:items-stretch">
          <motion.article
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            whileHover={{ y: -4 }}
            className="landing-value-visual relative overflow-hidden rounded-[2rem] p-6 sm:p-8"
          >
            <div className="landing-value-grid absolute inset-0" />
            <div className="landing-value-ribbon landing-value-ribbon-one" />
            <div className="landing-value-ribbon landing-value-ribbon-two" />

            <div className="relative max-w-sm">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.09] text-[#f7d0e8]"><Dumbbell size={21} /></span>
              <p className="mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-[#f7bedf]">Membership value, unlocked</p>
              <h3 className="mt-3 text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">Don&apos;t let good training time go unused.</h3>
              <p className="mt-4 text-sm leading-6 text-zinc-300">List a valid pass, set a fair price, and give another member a verified way to continue their routine.</p>
            </div>

            <div className="landing-value-ticket relative mt-9 max-w-md rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Membership status</p><p className="mt-1 text-lg font-bold text-white">Ready to transfer</p></div>
                <span className="rounded-full bg-[#d9ff4b] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#151416]">Verified</span>
              </div>
            </div>
          </motion.article>

          <div className="grid gap-3">
            {benefits.map((benefit, index) => (
              <motion.article
                key={benefit.title}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ delay: index * 0.08 }}
                whileHover={{ x: 5 }}
                className="landing-benefit-row flex items-start gap-4 rounded-2xl p-5"
              >
                <span className="landing-benefit-icon grid h-11 w-11 shrink-0 place-items-center rounded-2xl"><benefit.icon size={20} /></span>
                <div><p className="text-base font-bold text-white">{benefit.title}</p><p className="mt-1.5 text-sm leading-6 text-zinc-400">{benefit.text}</p></div>
                <span className="ml-auto pt-1 text-xs font-bold text-[#ff9671]">0{index + 1}</span>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyFitSwapSection;
