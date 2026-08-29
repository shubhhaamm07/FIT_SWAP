import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CirclePause, CirclePlay, PackageOpen, Sparkles, Trash2, X } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import MarketplaceSidebar from "../../components/marketplace/MarketplaceSidebar";
import {
  activateListing,
  cancelListing,
  getMyListings,
  pauseListing,
} from "../../api/marketplace.api";
import {
  cancelPlatformPayment,
  createListingBoostPayment,
  markPlatformPaymentPaid,
} from "../../api/platform-billing.api";
import UpiPaymentCheckout from "../../components/payments/UpiPaymentCheckout";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [boostRequest, setBoostRequest] = useState(null);
  const [boostingId, setBoostingId] = useState("");

  const loadListings = async () => {
    try {
      setLoading(true);
      setListings(await getMyListings());
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load your listings.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await loadListings();
    };

    void load();
  }, []);

  const handleAction = async (listing, action) => {
    try {
      if (action === "pause") await pauseListing(listing.id);
      if (action === "activate") await activateListing(listing.id);
      if (action === "cancel") await cancelListing(listing.id);
      setMessage(
        `Listing ${action === "cancel" ? "cancelled" : `${action}d`} successfully.`,
      );
      await loadListings();
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to update this listing.",
      );
    }
  };

  const handleCreateBoost = async (listing) => {
    try {
      setBoostingId(listing.id);
      const request = await createListingBoostPayment(listing.id);
      setBoostRequest(request);
      setMessage("Your listing-boost UPI QR is ready. Pay the exact amount, then submit the UTR.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to create this listing boost.");
    } finally {
      setBoostingId("");
    }
  };

  const handleMarkBoostPaid = async (utr) => {
    if (!boostRequest) return;
    try {
      setBoostingId(boostRequest.id);
      setBoostRequest(await markPlatformPaymentPaid(boostRequest.id, utr));
      setMessage("Your UTR was recorded. A FitSwap administrator will verify it before the boost starts.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to record the UPI reference.");
    } finally {
      setBoostingId("");
    }
  };

  const handleCancelBoost = async () => {
    if (!boostRequest) return;
    try {
      setBoostingId(boostRequest.id);
      await cancelPlatformPayment(boostRequest.id);
      setBoostRequest(null);
      setMessage("Listing boost payment request cancelled.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to cancel this listing boost request.");
    } finally {
      setBoostingId("");
    }
  };

  return (
    <DashboardLayout rightSidebar={<MarketplaceSidebar />}>
      <main className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-violet-400">Seller centre</p>
            <h1 className="mt-1 text-3xl font-bold text-white">My Listings</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Manage your active, paused, and completed membership listings.
            </p>
          </div>
          <Link
            to="/marketplace/sell"
            className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Create Listing
          </Link>
        </div>
        {message && (
          <p className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-zinc-300">
            {message}
          </p>
        )}
        {loading ? (
          <p className="py-16 text-center text-zinc-400">
            Loading your listings…
          </p>
        ) : listings.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {listings.map((listing) => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onAction={handleAction}
                onBoost={handleCreateBoost}
                boosting={boostingId === listing.id}
              />
            ))}
          </div>
        ) : (
          <EmptyListings />
        )}
      </main>
      {boostRequest && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Boost this listing"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/75 p-4 backdrop-blur-sm sm:p-8"
        >
          <div className="mx-auto my-4 max-w-2xl rounded-3xl border border-violet-400/20 bg-[#11121a] p-5 shadow-2xl sm:my-8 sm:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">FitSwap listing boost</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Move this listing higher for 7 days</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">This optional fee goes to FitSwap&apos;s business UPI only. Your membership sale payment still goes directly between buyer and seller.</p>
              </div>
              <button
                type="button"
                onClick={() => setBoostRequest(null)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 transition hover:bg-white/[0.08] hover:text-white"
                aria-label="Close listing boost"
              >
                <X size={19} />
              </button>
            </div>
            <div className="mt-6">
              <UpiPaymentCheckout
                request={boostRequest}
                busy={boostingId === boostRequest.id}
                onMarkPaid={handleMarkBoostPaid}
                onCancel={boostRequest.status === "AWAITING_PAYMENT" ? handleCancelBoost : undefined}
                verificationNotice="FitSwap cannot read your bank balance. A FitSwap administrator checks the business UPI/bank account and activates the 7-day boost only after the payment and UTR match."
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

function ListingRow({ listing, onAction, onBoost, boosting }) {
  const paused = listing.status === "PAUSED";
  const boostEndsAt = listing.boostedUntil ? new Date(listing.boostedUntil) : null;
  return (
    <article className="overflow-hidden rounded-xl border border-white/[0.08] bg-[#11121a] sm:flex">
      <img
        src={listing.image}
        alt=""
        className="h-36 w-full object-cover sm:h-auto sm:w-40"
      />
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded bg-violet-500/15 px-2 py-1 text-[10px] font-semibold text-violet-300">
              {listing.status}
            </span>
            {listing.featured && (
              <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-200">
                <Sparkles size={11} /> Boosted
              </span>
            )}
            <h2 className="mt-2 truncate text-sm font-semibold text-white">
              {listing.gym}
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              {listing.membership} · {listing.location}
            </p>
          </div>
          <p className="text-lg font-bold text-white">
            {formatPrice(listing.price)}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to={`/marketplace/${listing.id}`}
            className="rounded-md border border-white/[0.1] px-3 py-1.5 text-xs text-zinc-300 hover:bg-white/5"
          >
            View
          </Link>
          {listing.status === "ACTIVE" && (
            <button
              onClick={() => onAction(listing, "pause")}
              className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10"
            >
              <CirclePause size={13} /> Pause
            </button>
          )}
          {paused && (
            <button
              onClick={() => onAction(listing, "activate")}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10"
            >
              <CirclePlay size={13} /> Activate
            </button>
          )}
          {listing.status === "ACTIVE" && (
            <button
              type="button"
              onClick={() => onBoost(listing)}
              disabled={boosting}
              className="inline-flex items-center gap-1 rounded-md border border-violet-400/30 px-3 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/10 disabled:opacity-50"
            >
              <Sparkles size={13} /> {boosting ? "Preparing…" : listing.featured ? "Extend boost" : "Boost · ₹79"}
            </button>
          )}
          {["ACTIVE", "PAUSED"].includes(listing.status) && (
            <button
              onClick={() => onAction(listing, "cancel")}
              className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
            >
              <Trash2 size={13} /> Cancel
            </button>
          )}
        </div>
        {listing.featured && boostEndsAt && (
          <p className="mt-3 text-[11px] text-amber-200/80">
            Priority placement until {new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(boostEndsAt)}
          </p>
        )}
      </div>
    </article>
  );
}
function EmptyListings() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#11121a] p-8 text-center">
      <PackageOpen size={56} className="text-violet-400" />
      <h2 className="mt-5 text-xl font-semibold text-white">No listings yet</h2>
      <p className="mt-2 max-w-md text-sm text-zinc-400">
        Choose one of your active memberships and set a price to start selling.
      </p>
      <Link
        to="/marketplace/sell"
        className="mt-6 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        List a membership
      </Link>
    </div>
  );
}

export default MyListingsPage;
