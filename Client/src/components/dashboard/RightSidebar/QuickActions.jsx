import { CreditCard, Store, Dumbbell, Plus } from "lucide-react";

function QuickActions() {
  const actions = [
    {
      title: "Buy Membership",
      icon: CreditCard,
      color: "text-violet-400",
    },
    {
      title: "Sell Membership",
      icon: Store,
      color: "text-green-400",
    },
    {
      title: "Find Gyms",
      icon: Dumbbell,
      color: "text-blue-400",
    },
    {
      title: "Create Listing",
      icon: Plus,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="rounded-2xl bg-[#12121A] border border-white/10 p-5">
      <h2 className="text-lg font-bold">Quick Actions</h2>

      <div className="mt-5 space-y-3">
        {actions.map((action) => (
          <button
            key={action.title}
            className="
              w-full
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-white/10
              p-3
              hover:border-violet-500/30
              hover:bg-[#18181F]
              transition
            "
          >
            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-white/5
                flex
                items-center
                justify-center
              "
            >
              <action.icon size={18} className={action.color} />
            </div>

            <span className="text-sm font-medium">{action.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
