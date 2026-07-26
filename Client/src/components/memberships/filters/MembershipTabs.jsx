function MembershipTabs({ activeTab, setActiveTab, counts }) {
  const tabs = [
    {
      id: "ALL",
      label: "All",
      count: counts.all,
    },
    {
      id: "ACTIVE",
      label: "Active",
      count: counts.active,
    },
    {
      id: "FROZEN",
      label: "Frozen",
      count: counts.frozen,
    },
    {
      id: "EXPIRED",
      label: "Expired",
      count: counts.expired,
    },
  ];

  return (
    <section
      className="overflow-x-auto px-4 pt-3 sm:px-6"
    >
      <div className="flex min-w-max gap-8 border-b border-white/[0.1] sm:gap-10">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="
                relative
                pb-4
                transition-all
                duration-300
              "
            >
              <div className="flex items-center gap-3">
                <span
                  className={`
                    text-sm
                    font-semibold
                    transition-colors

                    ${
                      active
                        ? "text-violet-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }
                  `}
                >
                  {tab.label}
                </span>

                <span
                  className={`
                    rounded-full
                    px-2.5
                    py-1
                    text-xs
                    font-semibold

                    ${
                      active
                        ? "bg-violet-500/15 text-violet-200"
                        : "bg-white/[0.06] text-zinc-400"
                    }
                  `}
                >
                  {tab.count}
                </span>
              </div>

              {active && (
                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    h-0.5
                    w-full
                    rounded-full
                    bg-violet-500
                  "
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default MembershipTabs;
