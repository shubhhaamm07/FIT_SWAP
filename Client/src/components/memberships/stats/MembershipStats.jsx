import { CreditCard, Activity, Snowflake, Clock3 } from "lucide-react";

function MembershipStats({ counts }) {
  const cards = [
    {
      title: "All Memberships",
      value: counts.all,
      subtitle: "Total plans owned",
      icon: CreditCard,
      bg: "from-violet-600 to-fuchsia-700",
    },
    {
      title: "Active",
      value: counts.active,
      subtitle: "Currently in use",
      icon: Activity,
      bg: "from-emerald-500 to-green-700",
    },
    {
      title: "Frozen",
      value: counts.frozen,
      subtitle: "Temporarily paused",
      icon: Snowflake,
      bg: "from-orange-500 to-amber-700",
    },
    {
      title: "Expired",
      value: counts.expired,
      subtitle: "Need renewal",
      icon: Clock3,
      bg: "from-blue-500 to-blue-700",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="
              group
              relative
              overflow-hidden
              rounded-2xl
              border
              border-white/10
              bg-[#0D121C]
              p-5
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:border-violet-500/20
              hover:bg-[#15151E]
              hover:shadow-[0_20px_50px_rgba(0,0,0,.35)]
            "
          >
            <div
              className={`
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                ${card.bg}
              `}
            >
              <Icon size={23} className="text-white" />
            </div>

            <p className="mt-4 text-sm font-medium text-zinc-400">
              {card.title}
            </p>

            <h2 className="mt-2 text-3xl font-bold text-white">
              {card.value}
            </h2>

            <p className="mt-2 text-sm text-zinc-500">{card.subtitle}</p>

            <div
              className="
                absolute
                -right-10
                -top-10
                h-28
                w-28
                rounded-full
                bg-violet-500/10
                blur-3xl
                transition-all
                duration-500
                group-hover:scale-125
              "
            />
          </div>
        );
      })}
    </section>
  );
}

export default MembershipStats;
