import { Dumbbell, Sparkles } from "lucide-react";

function AuthHeader({ title = "Welcome back", subtitle = "Sign in to continue your fitness journey." }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="auth-form-icon grid h-12 w-12 place-items-center rounded-2xl"><Dumbbell size={22} /></span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f257b7]/20 bg-[#f257b7]/[0.08] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#f7b9df]"><Sparkles size={12} /> FitSwap</span>
      </div>
      <h1 className="mt-7 text-3xl font-black leading-none tracking-[-0.045em] text-white sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">{subtitle}</p>
    </div>
  );
}

export default AuthHeader;
