import { ArrowRight, Sparkles } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";

import heroImage from "../../../assets/images/dashboard-hero.png";

function DashboardHero() {
  const { user } = useAuth();

  return (
    <section className="relative min-h-[300px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#100d1b] sm:min-h-[320px]">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#100b18] via-[#100b18]/90 to-[#100b18]/10" />
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] [background-size:40px_40px]" />
      <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="relative flex min-h-[300px] items-center px-6 py-8 sm:min-h-[320px] sm:px-9">
        <div className="max-w-[560px]">
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3.5 py-2 text-[11px] font-medium text-violet-300 backdrop-blur-xl">
            <Sparkles size={12} />
            India's #1 Gym Membership Marketplace
          </div>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
            Welcome Back
          </p>

          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
            Hey,
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {` ${user?.firstName || "there"}`}
            </span>{" "}
            👋
          </h1>

          <p className="mt-4 max-w-md text-sm leading-7 text-zinc-300">
            Buy, sell and manage transferable gym memberships with India's
            fastest-growing fitness marketplace.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button className="h-11 px-5 text-sm shadow-lg shadow-violet-950/40">
              Explore Marketplace
              <ArrowRight size={15} />
            </Button>

            <Button variant="secondary" className="h-11 px-5 text-sm">
              Find Gyms
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DashboardHero;
