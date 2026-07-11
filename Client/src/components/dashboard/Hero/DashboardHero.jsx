import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";

import { useAuth } from "../../../context/AuthContext";
import Button from "../../ui/Button";

import heroImage from "../../../assets/images/dashboard-hero.png";

function DashboardHero({ stats = {} }) {
  const { user } = useAuth();

  return (
    <section className="relative h-[280px] overflow-hidden rounded-3xl border border-white/10">
      {/* Background Image */}
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />

      {/* Glow Effects */}
      <div className="absolute -left-24 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

      <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-indigo-500/10 blur-[120px]" />

      {/* Grid Effect */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative flex h-full items-center justify-between px-8">
        {/* Left Content */}
        <div className="max-w-xl">
          <div
            className="
              inline-flex
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
              backdrop-blur-xl
            "
          >
            <Sparkles size={12} />
            India's #1 Gym Membership Marketplace
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.25em] text-zinc-400">
            Welcome Back
          </p>

          <h1 className="mt-2 text-4xl font-bold leading-tight">
            Hey,
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              {" "}
              {user?.firstName}
            </span>{" "}
            👋
          </h1>

          <p className="mt-4 max-w-md text-[14px] leading-7 text-zinc-300">
            Buy, sell and manage transferable gym memberships with India's
            fastest growing fitness marketplace.
          </p>

          <div className="mt-7 flex gap-3">
            <Button className="h-10 px-6 text-sm">
              Explore Marketplace
              <ArrowRight size={15} />
            </Button>

            <Button variant="secondary" className="h-10 px-6 text-sm">
              Find Gyms
            </Button>
          </div>
        </div>

        {/* Dashboard Overview */}
        {/* <div className="mr-4">
          <div
            className="
              w-[210px]
              rounded-2xl
              border
              border-white/10
              bg-black/35
              p-5
              backdrop-blur-md
            "
          > */}
        {/* <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">
                Dashboard Overview
              </span>

              <TrendingUp size={16} className="text-green-400" />
            </div> */}

        <div className="mt-5 space-y-4">
          {/* Memberships */}

          {/* <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">Active Memberships</p>

                  <span className="text-sm font-semibold">
                    {stats.memberships?.active ?? 0}
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${Math.min(
                        (stats.memberships?.active ?? 0) * 20,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div> */}

          {/* Marketplace */}

          {/* <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">Marketplace Listings</p>

                  <span className="text-sm font-semibold">
                    {stats.marketplace?.total ?? 0}
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{
                      width: `${Math.min(
                        (stats.marketplace?.total ?? 0) * 20,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div> */}

          {/* Notifications */}

          {/* <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-400">Unread Notifications</p>

                  <span className="text-sm font-semibold">
                    {stats.notifications?.unread ?? 0}
                  </span>
                </div>

                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-yellow-500"
                    style={{
                      width: `${Math.min(
                        (stats.notifications?.unread ?? 0) * 20,
                        100,
                      )}%`,
                    }}
                  />
                </div>
              </div> */}
        </div>
      </div>
    </section>
  );
}

export default DashboardHero;
