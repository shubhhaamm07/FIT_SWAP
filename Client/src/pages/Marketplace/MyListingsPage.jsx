import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CirclePause, CirclePlay, PackageOpen, Trash2 } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import MarketplaceSidebar from "../../components/marketplace/MarketplaceSidebar";
import {
  activateListing,
  cancelListing,
  getMyListings,
  pauseListing,
} from "../../api/marketplace.api";
import formatPrice from "../../components/marketplace/utils/formatPrice";

const MyListingsPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

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
              />
            ))}
          </div>
        ) : (
          <EmptyListings />
        )}
      </main>
    </DashboardLayout>
  );
};

function ListingRow({ listing, onAction }) {
  const paused = listing.status === "PAUSED";
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
          {["ACTIVE", "PAUSED"].includes(listing.status) && (
            <button
              onClick={() => onAction(listing, "cancel")}
              className="inline-flex items-center gap-1 rounded-md border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
            >
              <Trash2 size={13} /> Cancel
            </button>
          )}
        </div>
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
