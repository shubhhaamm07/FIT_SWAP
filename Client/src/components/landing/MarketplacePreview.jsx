import { ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import formatPrice from "../marketplace/utils/formatPrice";

function MarketplacePreview({ listings }) {
  const navigate = useNavigate();
  const featuredListings = listings.slice(0, 3);

  return (
    <section id="marketplace-preview" className="bg-[#0B0B0F] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Featured<span className="text-violet-400"> Marketplace Listings</span></h2>
            <p className="mt-5 text-zinc-400">Live memberships currently available from verified FitSwap partners.</p>
          </div>
          <button type="button" onClick={() => navigate("/login")} className="inline-flex items-center justify-center gap-2 self-center rounded-xl border border-violet-500/40 px-4 py-2.5 text-sm font-semibold text-violet-300 transition hover:bg-violet-500 hover:text-white sm:self-auto">Explore all <ArrowRight size={16} /></button>
        </div>

        {featuredListings.length ? (
          <div className="mt-10 grid gap-5 sm:mt-12 md:grid-cols-3 sm:gap-6">
            {featuredListings.map((listing) => (
              <motion.article key={listing.id} whileHover={{ y: -8 }} className="group overflow-hidden rounded-3xl border border-zinc-800 bg-[#16161D] transition hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-500/10">
                <img src={listing.image} alt={listing.gym} className="h-48 w-full object-cover transition duration-700 group-hover:scale-105 sm:h-52" />
                <div className="p-5 sm:p-6">
                  <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">{listing.membership}</span>
                  <h3 className="mt-4 truncate text-xl font-bold text-white">{listing.gym}</h3>
                  <p className="mt-2 flex min-h-5 items-start gap-1 text-sm leading-5 text-zinc-400"><MapPin size={14} className="mt-0.5 shrink-0" /> <span className="line-clamp-1">{listing.location} · {listing.remainingDays} days left</span></p>
                  <div className="mt-6 flex items-end justify-between gap-3"><div className="min-w-0"><p className="text-xs text-zinc-500">Asking price</p><p className="mt-1 truncate text-xl font-bold text-violet-400 sm:text-2xl">{formatPrice(listing.price)}</p></div><button type="button" onClick={() => navigate("/login")} className="shrink-0 rounded-xl bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 sm:px-4">View listing</button></div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-violet-500/25 bg-violet-500/5 p-7 text-center sm:mt-12 sm:p-12"><h3 className="text-xl font-semibold">New listings are on the way</h3><p className="mt-2 text-zinc-400">Join FitSwap to browse memberships as soon as they are published.</p><button type="button" onClick={() => navigate("/login")} className="mt-6 w-full rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold hover:bg-violet-500 sm:w-auto">Go to login</button></div>
        )}
      </div>
    </section>
  );
}

export default MarketplacePreview;
