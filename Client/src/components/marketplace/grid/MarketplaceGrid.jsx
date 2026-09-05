import { Grid2X2, List } from "lucide-react";
import ListingCard from "../cards/ListingCard";
import EmptyState from "../states/EmptyState";
import ErrorState from "../states/ErrorState";
import GridSkeleton from "../skeletons/GridSkeleton";
import { useMarketplaceContext } from "../hooks/useMarketplaceContext";
import Pagination from "../pagination/Pagination";

const MarketplaceGrid = () => {
  const {
    listings,
    totalListings,
    currentPage,
    totalPages,
    setCurrentPage,
    filters,
    updateFilter,
    loading,
    error,
    refreshListings,
    userLocation,
  } = useMarketplaceContext();

  const resultLabel = userLocation && filters.distance !== "all"
    ? `${totalListings} memberships within ${filters.distance} km`
    : `${totalListings} matching memberships`;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400">{resultLabel}</p>
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400"><Grid2X2 size={15} /></button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#11121a] text-zinc-400"><List size={16} /></button>
          <select
            aria-label="Sort listings"
            value={filters.sortBy}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="sr-only"
          >
            <option value="newest">Newest First</option>
            <option value="nearest">Nearest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="remaining-days">Remaining Days</option>
          </select>
        </div>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={refreshListings} />
      ) : listings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </section>
  );
};

export default MarketplaceGrid;
