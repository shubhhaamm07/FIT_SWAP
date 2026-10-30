import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { robotsFor, sitemapFor } from "../src/seo/crawlers.js";
import { publicPages, renderPage, metadataForPath, organizationSchema, siteUrl } from "../dist-ssr/entry-prerender.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
const template = await readFile(path.join(output, "index.html"), "utf8");
const manifest = JSON.parse(await readFile(path.join(output, ".vite/manifest.json"), "utf8"));
const escape = (text) => String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const tag = (attributes) => `<meta data-fitswap-seo ${Object.entries(attributes).map(([key, value]) => `${key}="${escape(value)}"`).join(" ")}>`;

function headFor(route, metadata) {
  const canonical = metadata.omitCanonical ? "" : `${siteUrl}${route}`;
  return [
    `<title>${escape(metadata.title)}</title>`,
    tag({ name: "description", content: metadata.description }),
    tag({ name: "robots", content: metadata.noindex ? "noindex, follow" : "index, follow" }),
    canonical ? `<link data-fitswap-seo rel="canonical" href="${escape(canonical)}">` : "",
    ...Object.entries({ "og:type": "website", "og:site_name": "FitSwap", "og:title": metadata.title, "og:description": metadata.description, ...(canonical ? { "og:url": canonical } : {}), "og:image": `${siteUrl}/social-card.png`, "og:image:alt": "FitSwap gym membership marketplace" }).map(([property, content]) => tag({ property, content })),
    ...Object.entries({ "twitter:card": "summary_large_image", "twitter:title": metadata.title, "twitter:description": metadata.description, "twitter:image": `${siteUrl}/social-card.png` }).map(([name, content]) => tag({ name, content })),
    route === "/" ? `<script data-fitswap-seo type="application/ld+json">${JSON.stringify(organizationSchema()).replace(/</g, "\\u003c")}</script>` : "",
    // The landing CSS is otherwise loaded only when its JS chunk executes.
    ...(route === "/" ? manifest["src/pages/landing/LandingPage.jsx"]?.css || [] : []).map((css) => `<link rel="stylesheet" href="/${css}">`),
  ].join("\n");
}

function documentFor(route, metadata, body = "") {
  return template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta[^>]*data-fitswap-seo[^>]*>/g, "")
    .replace("</head>", `${headFor(route, metadata)}\n</head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

const routes = Object.keys(publicPages);
for (const route of routes) {
  await writeFile(path.join(output, route === "/" ? "index.html" : `${route.slice(1)}.html`), documentFor(route, publicPages[route], renderPage(route)));
}

const utilities = ["/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/admin/mfa"];
for (const route of utilities.filter((route) => !route.includes("/admin/"))) {
  await writeFile(path.join(output, `${route.slice(1)}.html`), documentFor(route, metadataForPath(route)));
}
await writeFile(path.join(output, "app.html"), documentFor("/dashboard", metadataForPath("/dashboard")));
// Public detail shells must not inherit noindex from the private app shell:
// crawlers may skip JS entirely when the initial HTML says noindex.
await writeFile(path.join(output, "listing.html"), documentFor("", { title: "Gym Membership Listing | FitSwap", description: "Review a gym membership pass, its asking price, expiry and transfer conditions.", omitCanonical: true }));
await writeFile(path.join(output, "gym.html"), documentFor("", { title: "Partner Gym & Membership Plans | FitSwap", description: "Explore gym details and published membership plans on FitSwap.", omitCanonical: true }));
await writeFile(path.join(output, "404.html"), documentFor("/404", { title: "Page Not Found | FitSwap", description: "This FitSwap page could not be found. Browse memberships or return home.", noindex: true }, renderPage("/404")));
await writeFile(path.join(output, "robots.txt"), robotsFor(siteUrl));
await writeFile(path.join(output, "sitemap.xml"), sitemapFor(siteUrl, publicPages));

// Explicit application routes preserve refresh/deep links without turning every
// unknown URL (including missing crawler endpoints) into the homepage with 200.
const privateRoutes = ["/dashboard", "/memberships", "/memberships/*", "/marketplace/wishlist", "/marketplace/sell", "/marketplace/my-listings", "/transfers", "/profile", "/settings", "/notifications", "/support", "/gyms/nearby", "/trials", "/diet-planner", "/wellness", "/security", "/plus", "/owner/*", "/admin/*"];
await writeFile(path.join(output, "_redirects"), [
  "/api/* https://fit-swap-1.onrender.com/api/:splat 200!",
  ...routes.filter((route) => route !== "/").flatMap((route) => [`${route}/ ${route} 301!`, `${route} ${route}.html 200`]),
  ...utilities.filter((route) => !route.includes("/admin/")).map((route) => `${route} ${route}.html 200`),
  ...privateRoutes.map((route) => `${route} /app.html 200`),
  "/marketplace/:listingId /listing.html 200",
  "/gyms/:gymId /gym.html 200",
  "/* /404.html 404",
  "",
].join("\n"));
console.log(`Prerendered ${routes.length} public pages; crawler URLs use ${siteUrl}.`);
