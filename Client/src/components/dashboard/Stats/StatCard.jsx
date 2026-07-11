import { TrendingUp } from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-3xl
        border
        border-white/10
        bg-[#12121A]
        p-5
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-violet-500/30
        hover:shadow-[0_20px_60px_rgba(124,58,237,.18)]
      "
    >
      {/* Glow */}

      <div
        className="
          absolute
          -right-12
          -top-12
          h-32
          w-32
          rounded-full
          bg-violet-500/10
          blur-3xl
          opacity-0
          transition
          duration-500
          group-hover:opacity-100
        "
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-bold">{value}</h2>

          <div className="mt-3 flex items-center gap-2">
            <TrendingUp size={14} className="text-green-400" />

            <span className="text-xs font-medium text-green-400">+12%</span>

            <span className="text-xs text-zinc-500">this month</span>
          </div>
        </div>

        <div
          className="
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-2xl
            bg-white/5
            transition
            duration-300
            group-hover:scale-110
          "
        >
          <Icon size={22} className={color} />
        </div>
      </div>

      <div className="relative mt-5">
        <div className="h-2 rounded-full bg-white/5">
          <div
            className="
              h-full
              w-[70%]
              rounded-full
              bg-gradient-to-r
              from-violet-500
              to-fuchsia-500
            "
          />
        </div>

        <p className="mt-3 text-xs text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default StatCard;
