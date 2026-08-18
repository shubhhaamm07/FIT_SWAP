import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  CircleDollarSign,
  Info,
  LoaderCircle,
  Tag,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import MarketplaceSidebar from "../../components/marketplace/MarketplaceSidebar";
import { getMyMemberships } from "../../api/membership.api";
import { createListing } from "../../api/marketplace.api";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const SellMembershipPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [memberships, setMemberships] = useState([]);
  const [membershipId, setMembershipId] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadMemberships = async () => {
      try {
        const response = await getMyMemberships();
        const membershipData = response.data || [];
        setMemberships(membershipData);
        const requestedMembershipId = searchParams.get("membershipId");
        const requestedMembership = membershipData.find(
          (membership) =>
            membership.id === requestedMembershipId &&
            membership.status === "ACTIVE" &&
            membership.plan?.transferable &&
            !membership.listing &&
            new Date(membership.endDate) > new Date(),
        );
        if (requestedMembership) {
          setMembershipId(requestedMembership.id);
          setAskingPrice(String(Math.round(requestedMembership.plan.price)));
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load your memberships.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadMemberships();
  }, [searchParams]);

  const eligibleMemberships = useMemo(
    () =>
      memberships.filter(
        (membership) =>
          membership.status === "ACTIVE" &&
          membership.plan?.transferable &&
          !membership.listing &&
          new Date(membership.endDate) > new Date(),
      ),
    [memberships],
  );
  const selectedMembership = eligibleMemberships.find(
    (membership) => membership.id === membershipId,
  );
  const minimumPrice = selectedMembership
    ? Math.ceil(selectedMembership.plan.price * 0.3)
    : 0;

  const handleMembershipChange = (id) => {
    setMembershipId(id);
    const membership = eligibleMemberships.find((item) => item.id === id);
    setAskingPrice(membership ? String(Math.round(membership.plan.price)) : "");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedMembership)
      return setError("Choose an eligible membership to list.");
    const price = Number(askingPrice);
    if (!price || price < minimumPrice || price > selectedMembership.plan.price)
      return setError(
        `Set a price between ${formatPrice(minimumPrice)} and ${formatPrice(selectedMembership.plan.price)}.`,
      );

    try {
      setSubmitting(true);
      setError("");
      await createListing(selectedMembership.id, price);
      navigate("/marketplace/my-listings", {
        state: { message: "Your membership is now listed." },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create the listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout rightSidebar={<MarketplaceSidebar />}>
      <main className="mx-auto max-w-4xl space-y-6">
        <div>
          <p className="text-sm font-medium text-violet-400">Seller centre</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Sell a membership
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            List an eligible unused membership and receive transfer requests
            from verified members.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/[0.08] bg-[#11121a] p-5 sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-white/[0.08] pb-5">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-violet-500/15 text-violet-400">
                <Tag size={20} />
              </span>
              <div>
                <h2 className="font-semibold text-white">Listing details</h2>
                <p className="mt-0.5 text-xs text-zinc-500">
                  The price is validated by the marketplace.
                </p>
              </div>
            </div>
            {loading ? (
              <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-zinc-400">
                <LoaderCircle className="animate-spin" size={18} /> Loading
                memberships…
              </div>
            ) : (
              <div className="space-y-5 pt-5">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">
                    Membership to sell
                  </span>
                  <select
                    value={membershipId}
                    onChange={(event) =>
                      handleMembershipChange(event.target.value)
                    }
                    className="w-full rounded-lg border border-white/[0.1] bg-[#171820] px-3 py-3 text-sm text-white outline-none focus:border-violet-500"
                  >
                    <option value="">Select an eligible membership</option>
                    {eligibleMemberships.map((membership) => (
                      <option key={membership.id} value={membership.id}>
                        {membership.plan.gym?.name || "Gym"} —{" "}
                        {membership.plan.name}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedMembership && (
                  <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">
                          {selectedMembership.plan.gym?.name}
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          {selectedMembership.plan.name} · Expires{" "}
                          {new Intl.DateTimeFormat("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(selectedMembership.endDate))}
                        </p>
                      </div>
                      <BadgeCheck
                        className="shrink-0 text-emerald-400"
                        size={20}
                      />
                    </div>
                  </div>
                )}
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-zinc-200">
                    Your asking price
                  </span>
                  <div className="relative">
                    <CircleDollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                    />
                    <input
                      type="number"
                      min={minimumPrice || undefined}
                      max={selectedMembership?.plan.price}
                      value={askingPrice}
                      onChange={(event) => setAskingPrice(event.target.value)}
                      placeholder="Enter an amount"
                      className="w-full rounded-lg border border-white/[0.1] bg-[#171820] py-3 pl-10 pr-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-violet-500"
                    />
                  </div>
                  {selectedMembership && (
                    <p className="mt-2 text-xs text-zinc-500">
                      You can list this membership for{" "}
                      {formatPrice(minimumPrice)} to{" "}
                      {formatPrice(selectedMembership.plan.price)}.
                    </p>
                  )}
                </label>
                {error && (
                  <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-sm text-red-300">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={
                    loading || submitting || !eligibleMemberships.length
                  }
                  className="w-full rounded-lg bg-violet-600 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Publishing listing…" : "Publish listing"}
                </button>
                {!eligibleMemberships.length && (
                  <p className="text-center text-xs text-zinc-500">
                    You do not have an active transferable membership available
                    to list.
                  </p>
                )}
              </div>
            )}
          </form>
          <aside className="rounded-xl border border-white/[0.08] bg-[#101118] p-5">
            <Info className="text-violet-400" size={22} />
            <h2 className="mt-3 font-semibold text-white">How selling works</h2>
            <ol className="mt-4 space-y-4 text-sm text-zinc-400">
              <li>
                <span className="mr-2 text-violet-400">01</span>Choose an active
                transferable membership.
              </li>
              <li>
                <span className="mr-2 text-violet-400">02</span>Set a price
                between 30% and 100% of its original price.
              </li>
              <li>
                <span className="mr-2 text-violet-400">03</span>Review transfer
                requests in your seller dashboard.
              </li>
            </ol>
            <p className="mt-6 border-t border-white/[0.08] pt-4 text-xs leading-5 text-zinc-500">
              Your listing stays active until it is sold, cancelled, or expires
              with the membership.
            </p>
          </aside>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default SellMembershipPage;
