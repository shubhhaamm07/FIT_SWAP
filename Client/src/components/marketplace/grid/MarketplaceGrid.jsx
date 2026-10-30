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
          <select
            aria-label="Sort listings"
            value={filters.sortBy}
            onChange={(e) => updateFilter("sortBy", e.target.value)}
            className="max-w-36 rounded-lg border border-white/10 bg-[#15161e] px-2 py-2 text-xs text-zinc-300"
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
