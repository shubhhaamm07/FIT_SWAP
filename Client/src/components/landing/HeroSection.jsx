import { motion } from "framer-motion";
import {
  ArrowRight,
  Dumbbell,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import membershipSculpture from "../../assets/images/fitswap-3d-membership-cutout.png";

const enter = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
};

function HeroSection({ gymCount, listingCount }) {
  const navigate = useNavigate();

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="fit-hero relative isolate overflow-hidden pt-16 sm:pt-20">
      <div className="fit-hero-noise absolute inset-0 -z-30" />
      <div className="fit-hero-glow fit-hero-glow-left absolute -z-20" />
      <div className="fit-hero-glow fit-hero-glow-right absolute -z-20" />
      <div className="fit-hero-grid absolute inset-0 -z-10" />

      <div className="fit-hero-layout mx-auto w-full max-w-[1320px] px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16 lg:px-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
          className="fit-hero-heading text-center"
        >
          <motion.p variants={enter} className="fit-hero-eyebrow inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em] sm:text-[11px]">
            <Sparkles size={13} /> India&apos;s membership marketplace
          </motion.p>
          <motion.h1 variants={enter} className="mx-auto mt-5 max-w-5xl text-[2.8rem] font-black leading-[0.91] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl xl:text-8xl">
            Fitness memberships.
            <span className="fit-hero-gradient block">Made to move.</span>
          </motion.h1>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.34, duration: 0.65 }}
          className="fit-hero-metrics mt-8 grid grid-cols-3 gap-2 sm:gap-3 lg:mt-0 lg:grid-cols-1"
        >
          <HeroMetric value={listingCount || "—"} label="Live passes" />
          <HeroMetric value={gymCount || "—"} label="Partner gyms" />
          <HeroMetric value="100%" label="Verified flow" />
        </motion.aside>

        <MembershipSculpture />

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.45, duration: 0.65 }}
          className="fit-hero-copy mt-8 text-center lg:mt-0 lg:text-left"
        >
          <p className="text-base leading-7 text-zinc-300 sm:text-lg">
            Buy verified memberships, recover unused value, and move ownership through one secure workflow.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="fit-hero-primary group inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold text-[#131116]"
            >
              Explore marketplace
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="fit-hero-secondary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white"
            >
              See how it works
            </button>
          </div>
          <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.035] px-3.5 py-3 text-left backdrop-blur-md">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck size={18} /></span>
            <span><strong className="block text-sm text-white">Ownership stays clear</strong><span className="mt-0.5 block text-xs text-zinc-500">A visible transfer status at every step.</span></span>
          </div>
        </motion.div>
      </div>

      <div className="fit-hero-marquee border-y border-white/[0.08] py-3">
        <div className="fit-hero-marquee-track" aria-hidden="true">
          {["Verified gyms", "Secure transfers", "Real membership value", "FitSwap marketplace", "Payment protected", "Verified gyms", "Secure transfers", "Real membership value", "FitSwap marketplace", "Payment protected"].map((item, index) => <span key={`${item}-${index}`}><Dumbbell size={14} /> {item}</span>)}
        </div>
      </div>
    </section>
  );
}

function MembershipSculpture() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.84, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="fit-hero-art relative mx-auto mt-7 w-full max-w-[430px] lg:mt-0 lg:max-w-[510px]"
    >
      <div className="fit-sculpture-aura" />
      <div className="fit-sculpture-orbit fit-sculpture-orbit-one" />
      <div className="fit-sculpture-orbit fit-sculpture-orbit-two" />
      <motion.img
        src={membershipSculpture}
        alt="Floating FitSwap membership card with gym equipment"
        className="fit-sculpture-image relative z-10 mx-auto block w-full"
        animate={{ y: [0, -12, 0], rotate: [-1, 1.3, -1] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="fit-sculpture-chip fit-sculpture-chip-top"><Sparkles size={13} /> Smart value</span>
      <span className="fit-sculpture-chip fit-sculpture-chip-bottom"><ShieldCheck size={13} /> Verified</span>
    </motion.div>
  );
}

function HeroMetric({ value, label }) {
  return <div className="fit-hero-metric rounded-2xl px-3 py-3 sm:px-4 sm:py-4"><p className="text-xl font-black tracking-tight text-white sm:text-2xl">{value}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 sm:text-[11px]">{label}</p></div>;
}

export default HeroSection;
