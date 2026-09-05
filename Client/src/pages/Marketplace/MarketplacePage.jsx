import { Outlet } from "react-router-dom";

import MarketplaceHero from "../../components/marketplace/hero/MarketplaceHero";
import MarketplaceFilters from "../../components/marketplace/filters/MarketplaceFilters";
import MarketplaceGrid from "../../components/marketplace/grid/MarketplaceGrid";
import MarketplaceSidebar from "../../components/marketplace/MarketplaceSidebar";
import DashboardLayout from "../../layouts/DashboardLayout";
import { MarketplaceProvider } from "../../components/marketplace/hooks/MarketplaceProvider";
import { useMarketplaceContext } from "../../components/marketplace/hooks/useMarketplaceContext";

const MarketplaceContent = () => {
  const {
    filters,
    updateFilter,
    resetFilters,
    locationOptions,
    userLocation,
    locationStatus,
    requestUserLocation,
    clearUserLocation,
  } = useMarketplaceContext();

  return (
    <>
      <MarketplaceHero />

      <div className="grid grid-cols-12 gap-4 lg:gap-5">
        <aside className="col-span-12 xl:col-span-3">
          <MarketplaceFilters
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            locationOptions={locationOptions}
            userLocation={userLocation}
            locationStatus={locationStatus}
            requestUserLocation={requestUserLocation}
            clearUserLocation={clearUserLocation}
          />
        </aside>

        <section className="col-span-12 xl:col-span-9">
          <MarketplaceGrid />
        </section>
      </div>

      <Outlet />
    </>
  );
};

const MarketplacePage = () => {
  return (
    <MarketplaceProvider>
      <DashboardLayout rightSidebar={<MarketplaceSidebar />}>
        <div className="marketplace-page flex flex-col gap-4 lg:gap-5">
          <MarketplaceContent />
        </div>
      </DashboardLayout>
    </MarketplaceProvider>
  );
};

export default MarketplacePage;
