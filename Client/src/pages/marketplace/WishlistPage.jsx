import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import MarketplaceSidebar from "../../components/marketplace/MarketplaceSidebar";
import ListingCard from "../../components/marketplace/cards/ListingCard";
import { getSavedListings } from "../../api/marketplace.api";

const WishlistPage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { const load = async () => { try { setListings(await getSavedListings()); } catch (err) { setError(err.response?.data?.message || "Unable to load saved listings."); } finally { setLoading(false); } }; void load(); }, []);
  const handleSavedChange = (listingId, saved) => { if (!saved) setListings((current) => current.filter((listing) => listing.id !== listingId)); };

  return <DashboardLayout rightSidebar={<MarketplaceSidebar />}><main className="space-y-6"><div><p className="text-sm font-medium text-violet-400">Marketplace</p><h1 className="mt-1 text-3xl font-bold text-white">Saved Listings</h1><p className="mt-2 text-sm text-zinc-400">Keep memberships you are considering in one place.</p></div>{loading ? <p className="py-16 text-center text-zinc-400">Loading saved listings…</p> : error ? <p className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p> : listings.length ? <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} isSaved onSavedChange={handleSavedChange} />)}</div> : <div className="flex min-h-[380px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#11121a] p-8 text-center"><Heart size={56} className="text-violet-400" /><h2 className="mt-5 text-xl font-semibold text-white">No saved listings</h2><p className="mt-2 text-sm text-zinc-400">Tap the heart on a membership to save it here.</p><Link to="/marketplace" className="mt-6 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">Browse marketplace</Link></div>}</main></DashboardLayout>;
};

export default WishlistPage;
