import { createContext, useContext } from "react";
import useMarketplace from "./useMarketplace";

const MarketplaceContext = createContext(null);

export const MarketplaceProvider = ({ children }) => {
  const marketplace = useMarketplace();

  return (
    <MarketplaceContext.Provider value={marketplace}>
      {children}
    </MarketplaceContext.Provider>
  );
};

export const useMarketplaceContext = () => {
  const context = useContext(MarketplaceContext);

  if (!context) {
    throw new Error(
      "useMarketplaceContext must be used inside MarketplaceProvider",
    );
  }

  return context;
};
