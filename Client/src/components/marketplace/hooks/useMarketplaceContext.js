import { useContext } from "react";

import { MarketplaceContext } from "./marketplace-context";

export const useMarketplaceContext = () => {
  const context = useContext(MarketplaceContext);

  if (!context) {
    throw new Error(
      "useMarketplaceContext must be used inside MarketplaceProvider",
    );
  }

  return context;
};
