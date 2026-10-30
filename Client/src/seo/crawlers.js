const xmlEscape = (value) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function robotsFor(origin) {
  // Public detail pages fetch /api/listings and /api/gyms while rendering.
  // Do not block those dependencies; private endpoints enforce authentication.
  return `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`;
}

export function sitemapFor(origin, pages) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.entries(pages).filter(([, page]) => !page.noindex).map(([route]) => `  <url><loc>${xmlEscape(`${origin}${route}`)}</loc></url>`).join("\n")}\n</urlset>\n`;
}
