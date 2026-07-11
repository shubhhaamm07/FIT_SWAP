import { Plus, Store, CreditCard, Dumbbell } from "lucide-react";

function QuickActions() {
  const actions = [
    {
      title: "Sell Membership",
      icon: Store,
      color: "bg-violet-600 hover:bg-violet-500",
    },
    {
      title: "Buy Membership",
      icon: CreditCard,
      color: "bg-emerald-600 hover:bg-emerald-500",
    },
    {
      title: "Find Gyms",
      icon: Dumbbell,
      color: "bg-sky-600 hover:bg-sky-500",
    },
    {
      title: "Create Listing",
      icon: Plus,
      color: "bg-amber-600 hover:bg-amber-500",
    },
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-[#12121A] p-5">
      <h2 className="text-lg font-semibold">Quick Actions</h2>

      <p className="mt-1 text-sm text-zinc-500">Frequently used actions</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.title}
              className={`
                ${action.color}
                group
                flex
                h-24
                flex-col
                items-center
                justify-center
                rounded-2xl
                transition-all
                duration-300
                hover:-translate-y-1
              `}
            >
              <Icon
                size={22}
                className="mb-2 transition-transform duration-300 group-hover:scale-110"
              />

              <span className="text-xs font-medium">{action.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
export default QuickActions;
