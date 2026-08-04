import MembershipHero from "../hero/MembershipHero";

import MembershipCard from "../cards/MembershipCard";

import MembershipTabs from "../filters/MembershipTabs";
import MembershipFilters from "../filters/MembershipFilters";
import MembershipGridHeader from "../filters/MembershipGridHeader";

import MembershipStats from "../stats/MembershipStats";

import MembershipEmptyState from "../states/MembershipEmptyState";
import MembershipSkeletonGrid from "../states/MembershipSkeletonGrid";

import MembershipModalProvider from "../context/MembershipModalProvider";

import useMembership from "../hooks/useMembership";

function MembershipSection() {
  const {
    memberships,

    loading,

    error,

    counts,

    search,
    setSearch,

    activeTab,
    setActiveTab,

    sortBy,
    setSortBy,

    freezeMembership,
    unfreezeMembership,
  } = useMembership();

  return (
    <MembershipModalProvider
      onFreeze={freezeMembership}
      onUnfreeze={unfreezeMembership}
    >
      {({ openFreeze, openUnfreeze }) => (
        <div className="space-y-5 lg:space-y-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                My Memberships
              </h1>
              <p className="mt-1.5 text-sm text-zinc-400 sm:text-base">
                Manage your gym memberships
              </p>
            </div>

            <button
              type="button"
              className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-[#6937ef] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-950/40 transition hover:brightness-110"
              onClick={() =>
                document
                  .getElementById("membership-list")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span className="text-xl font-normal leading-none"></span>
              <span>View Memberships</span>
            </button>
          </div>

          <MembershipHero total={counts.all} />

          <MembershipStats counts={counts} />

          <section className="overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0D121C]/90">
            <MembershipTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              counts={counts}
            />

            <MembershipFilters
              search={search}
              setSearch={setSearch}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />
          </section>

          <MembershipGridHeader total={memberships.length} />

          {loading && <MembershipSkeletonGrid />}

          {!loading && error && (
            <div
              className="
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/10
                p-6
                text-center
                text-red-400
              "
            >
              {error}
            </div>
          )}

          {!loading && !error && memberships.length === 0 && (
            <MembershipEmptyState />
          )}

          {!loading && !error && memberships.length > 0 && (
            <div id="membership-list" className="space-y-4">
              {memberships.map((membership) => (
                <MembershipCard
                  key={membership.id}
                  membership={membership}
                  onFreeze={openFreeze}
                  onUnfreeze={openUnfreeze}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </MembershipModalProvider>
  );
}

export default MembershipSection;
