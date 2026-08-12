import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Dumbbell, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import authBackground from "../assets/images/auth-fitness-studio.png";

function AuthLayout({ children }) {
  const { pathname } = useLocation();
  const isRegister = pathname === "/register";

  return (
    <div className="auth-shell auth-editorial-shell relative min-h-screen overflow-hidden text-white">
      <img src={authBackground} alt="" className="auth-editorial-image absolute inset-0 h-full w-full object-cover" />
      <div className="auth-editorial-wash absolute inset-0" />
      <div className="auth-editorial-grid absolute inset-0" />
      <div className="auth-editorial-glow auth-editorial-glow-one absolute" />
      <div className="auth-editorial-glow auth-editorial-glow-two absolute" />

      <header className="relative z-30 mx-auto flex w-full max-w-[1480px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link to="/" className="group flex items-center gap-3" aria-label="Go to FitSwap home page">
          <span className="auth-brand-mark grid h-10 w-10 place-items-center rounded-2xl text-white transition group-hover:rotate-6 group-hover:scale-105"><Dumbbell size={20} /></span>
          <span><strong className="block text-xl font-black tracking-tight">Fit<span className="auth-brand-accent">Swap</span></strong><small className="-mt-0.5 block text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">Membership marketplace</small></span>
        </Link>

        <Link to={isRegister ? "/login" : "/register"} className="auth-header-link hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold sm:inline-flex">
          {isRegister ? "Already a member? Sign in" : "New here? Create account"} <ArrowUpRight size={15} />
        </Link>
      </header>

      <div className="relative z-20 mx-auto grid min-h-[calc(100vh-84px)] w-full max-w-[1480px] items-center gap-10 px-5 pb-8 sm:px-8 lg:grid-cols-[1fr_minmax(420px,520px)] lg:px-12 lg:pb-12">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="auth-editorial-story hidden max-w-xl self-stretch justify-center lg:flex lg:flex-col"
        >
          <span className="auth-story-kicker inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.18em]"><BadgeCheck size={13} /> Verified membership marketplace</span>
          <h2 className="mt-6 text-5xl font-black leading-[.93] tracking-[-0.055em] text-white xl:text-6xl">Your fitness routine should never be left behind.</h2>
          <p className="mt-6 max-w-md text-base leading-7 text-zinc-300">Find a verified membership, unlock unused value, and move every gym pass through a clear transfer flow.</p>
          <div className="auth-story-proof mt-9 flex w-fit items-center gap-3 rounded-2xl px-4 py-3.5"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck size={19} /></span><span><strong className="block text-sm text-white">A secure step forward</strong><small className="mt-0.5 block text-xs text-zinc-400">Clear ownership, clear next steps.</small></span></div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="auth-panel-enter w-full justify-self-center"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
