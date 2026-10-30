import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { metadataForPath, organizationSchema, siteUrl } from "./site";

export default function PageMetadata({ title, description, noindex = false, path, home = false }) {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = title;
    document.head.querySelectorAll("[data-fitswap-seo]").forEach((tag) => tag.remove());
    const add = (type, attributes, content) => {
      const tag = document.createElement(type);
      tag.dataset.fitswapSeo = "";
      Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
      if (content) tag.textContent = content;
      document.head.appendChild(tag);
    };
    const canonical = siteUrl ? `${siteUrl}${path || pathname}` : "";
    add("meta", { name: "description", content: description });
    add("meta", { name: "robots", content: noindex ? "noindex, follow" : "index, follow" });
    add("meta", { property: "og:type", content: "website" });
    add("meta", { property: "og:site_name", content: "FitSwap" });
    add("meta", { property: "og:title", content: title });
    add("meta", { property: "og:description", content: description });
    add("meta", { name: "twitter:card", content: "summary_large_image" });
    add("meta", { name: "twitter:title", content: title });
    add("meta", { name: "twitter:description", content: description });
    if (canonical) {
      add("link", { rel: "canonical", href: canonical });
      add("meta", { property: "og:url", content: canonical });
      add("meta", { property: "og:image", content: `${siteUrl}/social-card.png` });
      add("meta", { property: "og:image:alt", content: "FitSwap gym membership marketplace" });
      add("meta", { name: "twitter:image", content: `${siteUrl}/social-card.png` });
    }
    if (home) add("script", { type: "application/ld+json" }, JSON.stringify(organizationSchema()).replace(/</g, "\\u003c"));
  }, [title, description, noindex, path, pathname, home]);
  return null;
}

export function RouteMetadata() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" }); }, [pathname]);
  // Detail pages own their metadata after loading their actual record.
  if (/^\/(marketplace|gyms)\/[^/]+$/.test(pathname)
    && !["wishlist", "sell", "my-listings", "nearby"].includes(pathname.split("/").at(-1))) return null;
  return <PageMetadata {...metadataForPath(pathname)} home={pathname === "/"} />;
}
