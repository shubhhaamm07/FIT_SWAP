import { ArrowRight, Sparkles } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

import Button from "../../ui/Button";

import heroImage from "../../../assets/images/dashboard-hero.png";

function DashboardHero() {
  const { user } = useAuth();

  return (
    <section className="relative h-[280px] overflow-hidden rounded-3xl">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

      <div className="relative flex h-full max-w-xl flex-col justify-center px-7">
        <div
          className="
            inline-flex
            w-fit
            items-center
            gap-2
            rounded-full
            border
            border-violet-500/30
            bg-violet-500/10
            px-3
            py-1.5
            text-[11px]
            font-medium
            text-violet-300
          "
        >
          <Sparkles size={12} />
          India's #1 Gym Membership Marketplace
        </div>

        <p className="mt-4 text-xs uppercase tracking-wider text-zinc-400">
          Welcome Back
        </p>

        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Hey, {user?.firstName} 👋
        </h1>

        <p className="mt-3 max-w-md text-[13px] leading-6 text-zinc-300">
          Buy, sell and manage transferable gym memberships with India's fastest
          growing fitness marketplace.
        </p>

        <div className="mt-6 flex gap-3">
          <Button className="h-9 px-5 text-sm">
            Explore Marketplace
            <ArrowRight size={15} />
          </Button>

          <Button variant="secondary" className="h-9 px-5 text-sm">
            Find Gyms
          </Button>
        </div>
      </div>
    </section>
  );
}

export default DashboardHero;
