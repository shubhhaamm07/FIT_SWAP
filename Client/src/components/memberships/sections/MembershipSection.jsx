import { CalendarClock, Settings2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

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

const REMINDER_TIME_ZONE = "Asia/Kolkata";
const DAY_MS = 24 * 60 * 60 * 1000;

const calendarDayNumber = (value) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: REMINDER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const date = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return Math.floor(Date.UTC(
    Number(date.year),
    Number(date.month) - 1,
    Number(date.day),
  ) / DAY_MS);
};

function MembershipSection() {
  const {
    memberships,
    allMemberships,

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

          <ExpiryReminderSummary memberships={allMemberships} />

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

function ExpiryReminderSummary({ memberships }) {
  const [referenceTime] = useState(() => Date.now());
  const expiring = memberships
    .filter((membership) => ["ACTIVE", "FROZEN"].includes(membership.status))
    .map((membership) => ({
      ...membership,
      daysRemaining: calendarDayNumber(membership.endDate) - calendarDayNumber(referenceTime),
    }))
    .filter((membership) => membership.daysRemaining >= 0 && membership.daysRemaining <= 30)
    .sort((first, second) => first.daysRemaining - second.daysRemaining);

  if (!expiring.length) return null;

  const next = expiring[0];
  const timing = next.daysRemaining === 0
    ? "expires today"
    : `expires in ${next.daysRemaining} day${next.daysRemaining === 1 ? "" : "s"}`;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-amber-400/20 bg-amber-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5" aria-label="Upcoming membership expiry">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><CalendarClock size={19} /></span>
        <div><p className="font-semibold text-white">{expiring.length === 1 ? "Membership expiring soon" : `${expiring.length} memberships expiring soon`}</p><p className="mt-1 text-sm leading-5 text-zinc-400">{next.plan?.gym?.name || next.plan?.name || "Your membership"} {timing}. FitSwap sends in-app reminders at 30, 7, 1, and 0 days.</p></div>
      </div>
      <Link to="/settings" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300/25 px-3 py-2.5 text-xs font-semibold text-amber-200 hover:bg-amber-400/10"><Settings2 size={15} /> Reminder settings</Link>
    </section>
  );
}

export default MembershipSection;
