import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom";
import { AuthContext, AppearanceContext } from "./context/contexts";
import LandingPage from "./pages/landing/LandingPage";
import GuidePage from "./pages/public/GuidePage";
import MarketplacePage from "./pages/marketplace/MarketplacePage";
import GymsPage from "./pages/gyms/GymsPage";
import NotFoundPage from "./pages/public/NotFoundPage";

export { publicPages, metadataForPath, organizationSchema, siteUrl } from "./seo/site";

export function renderPage(path) {
  const Page = path === "/" ? LandingPage : path === "/marketplace" ? MarketplacePage : path === "/gyms" ? GymsPage : path === "/404" ? NotFoundPage : GuidePage;
  return renderToString(
    <StaticRouter location={path}>
      <AuthContext.Provider value={{ user: null, isAuthenticated: false, loading: false }}>
        <AppearanceContext.Provider value={{ effectiveReducedMotion: true }}>
          <Page />
        </AppearanceContext.Provider>
      </AuthContext.Provider>
    </StaticRouter>,
  );
}
