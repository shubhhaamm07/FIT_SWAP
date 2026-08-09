import { MarketplaceContext } from "./marketplace-context";
import useMarketplace from "./useMarketplace";

export const MarketplaceProvider = ({ children }) => {
  const marketplace = useMarketplace();

  return (
    <MarketplaceContext.Provider value={marketplace}>
      {children}
    </MarketplaceContext.Provider>
  );
};
