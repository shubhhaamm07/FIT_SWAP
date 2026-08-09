import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CreditCard,
  Dumbbell,
  MapPin,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "../../assets/images/hero.png";

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
    <section className="landing-hero relative isolate flex min-h-[680px] items-center overflow-hidden pt-16 sm:min-h-screen sm:pt-20">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 -z-30 h-full w-full scale-105 object-cover opacity-[0.1]"
      />
      <div className="landing-grid absolute inset-0 -z-20" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_40%,rgba(14,165,233,.17),transparent_21%),radial-gradient(circle_at_26%_25%,rgba(139,92,246,.22),transparent_28%),linear-gradient(90deg,#08090d_5%,rgba(8,9,13,.95)_47%,rgba(8,9,13,.62))]" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:px-12">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
          className="relative z-10 max-w-2xl"
        >
          <motion.div
            variants={enter}
            className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-white/[0.055] px-3.5 py-2 text-xs font-semibold text-sky-100 shadow-lg shadow-sky-950/20 backdrop-blur-xl"
          >
            <Sparkles size={14} className="text-cyan-300" />
            India’s membership marketplace
          </motion.div>

          <motion.h1
            variants={enter}
            className="mt-7 text-[2.7rem] font-black leading-[1.02] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl"
          >
            Your next gym membership,
            <span className="block bg-gradient-to-r from-violet-300 via-sky-200 to-cyan-300 bg-clip-text text-transparent">
              at a smarter price.
            </span>
          </motion.h1>

          <motion.p variants={enter} className="mt-7 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
            Buy verified memberships, recover value from unused time, and move ownership through a secure transfer workflow built for real gym members.
          </motion.p>

          <motion.div variants={enter} className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="landing-primary-button group inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white sm:w-auto"
            >
              <span>Explore marketplace</span>
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={scrollToHowItWorks}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.13] bg-white/[0.045] px-5 py-3.5 text-sm font-semibold text-zinc-100 backdrop-blur-md transition hover:border-sky-300/35 hover:bg-white/[0.09] sm:w-auto"
            >
              <PlayCircle size={17} className="text-sky-300" />
              How it works
            </button>
          </motion.div>

          <motion.div variants={enter} className="mt-10 grid max-w-xl grid-cols-3 gap-2 border-t border-white/[0.1] pt-6 sm:mt-12 sm:gap-3">
            <HeroMetric value={listingCount || "—"} label="Active listings" />
            <HeroMetric value={gymCount || "—"} label="Partner gyms" />
            <div>
              <p className="text-xl font-bold text-cyan-200">Protected</p>
              <p className="mt-1 text-xs text-zinc-500">Transfer flow</p>
            </div>
          </motion.div>
        </motion.div>

        <MembershipWorld />
      </div>
    </section>
  );
}

function MembershipWorld() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 28 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="hero-3d-world relative mx-auto hidden h-[500px] w-full max-w-[560px] lg:block"
      aria-hidden="true"
    >
      <div className="hero-3d-aura" />
      <div className="hero-3d-floor" />
      <div className="hero-3d-orbit hero-3d-orbit-one" />
      <div className="hero-3d-orbit hero-3d-orbit-two" />

      <div className="hero-3d-gym">
        <div className="hero-3d-gym-sign"><Dumbbell size={17} /> FITSWAP GYM</div>
        <div className="hero-3d-gym-windows"><i /><i /><i /></div>
      </div>

      <div className="hero-3d-pass">
        <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.16em] text-violet-100/80">
          <span className="flex items-center gap-1.5"><Dumbbell size={13} /> FITSWAP</span>
          <CreditCard size={15} />
        </div>
        <div className="mt-10 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-sky-100/70">Membership pass</p>
            <p className="mt-1 text-xl font-black tracking-tight text-white">Cult Fit</p>
          </div>
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/12 text-cyan-100"><Check size={18} /></div>
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-white/15 pt-3 text-[10px] text-violet-100/75">
          <span>KORAMANGALA</span><span>VALID • 84 DAYS</span>
        </div>
      </div>

      <div className="hero-3d-mini hero-3d-mini-price">
        <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">Resale value</p>
        <p className="mt-1 text-lg font-bold text-white">₹15,500</p>
        <span className="mt-2 inline-flex rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-200">38% OFF</span>
      </div>

      <div className="hero-3d-mini hero-3d-mini-location">
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-sky-400/15 text-sky-200"><MapPin size={16} /></div>
        <div><p className="text-xs font-semibold text-white">Koramangala</p><p className="mt-0.5 text-[10px] text-zinc-400">Bengaluru</p></div>
      </div>

      <div className="hero-3d-mini hero-3d-mini-secure">
        <ShieldCheck size={17} className="text-emerald-300" />
        <span>Verified transfer</span>
      </div>

      <span className="hero-3d-particle hero-3d-particle-one" />
      <span className="hero-3d-particle hero-3d-particle-two" />
      <span className="hero-3d-particle hero-3d-particle-three" />
    </motion.div>
  );
}

function HeroMetric({ value, label }) {
  return <div><p className="text-lg font-bold text-violet-200 sm:text-xl">{value}</p><p className="mt-1 text-[11px] leading-4 text-zinc-500 sm:text-xs">{label}</p></div>;
}

export default HeroSection;
