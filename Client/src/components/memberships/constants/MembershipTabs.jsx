import { MEMBERSHIP_TABS } from "../constants/membershipTabs";

function MembershipTabs({ activeTab, setActiveTab, counts }) {
  const getCount = (id) => {
    switch (id) {
      case "ALL":
        return counts.all;

      case "ACTIVE":
        return counts.active;

      case "FROZEN":
        return counts.frozen;

      case "EXPIRED":
        return counts.expired;

      default:
        return 0;
    }
  };

  return (
    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
      {MEMBERSHIP_TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            px-5
            py-2.5
            rounded-xl
            text-sm
            font-medium
            transition-all
            duration-300

            ${
              activeTab === tab.id
                ? "bg-violet-600 text-white shadow-lg shadow-violet-600/30"
                : "bg-[#15151D] text-zinc-400 hover:bg-[#1C1C26] hover:text-white"
            }
          `}
        >
          {tab.label}

          <span className="ml-2 text-xs opacity-80">({getCount(tab.id)})</span>
        </button>
      ))}
    </div>
  );
}

export default MembershipTabs;
