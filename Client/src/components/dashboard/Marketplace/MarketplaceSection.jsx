import MarketplaceCard from "./MarketplaceCard";
import SkeletonMarketplace from "../Skeletons/SkeletonMarketplace";
import EmptyMarketplace from "./EmptyMarketplace";
function MarketplaceSection({ listings = [], loading = false }) {
  if (loading) {
    return <SkeletonMarketplace />;
  }

  return (
    <section className="mt-8">
      <div className="mb-5">
        <h2 className="text-2xl font-bold">Marketplace</h2>

        <p className="text-sm text-zinc-500 mt-1">
          Buy discounted transferable memberships.
        </p>
      </div>

      {listings.length === 0 ? (
        <EmptyMarketplace />
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {listings.map((listing) => (
            <MarketplaceCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </section>
  );
}

export default MarketplaceSection;
