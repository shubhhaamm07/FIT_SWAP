import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { publicPages, siteUrl } from "../dist-ssr/entry-prerender.js";

const read = (file) => readFile(new URL(`../dist/${file}`, import.meta.url), "utf8");
for (const [route, metadata] of Object.entries(publicPages)) {
  const document = new JSDOM(await read(route === "/" ? "index.html" : `${route.slice(1)}.html`)).window.document;
  assert.equal(document.title, metadata.title, route);
  assert.equal(document.querySelectorAll("h1").length, 1, `${route}: one page heading in raw HTML`);
  assert.equal(document.querySelectorAll('meta[name="description"]').length, 1, route);
  assert.equal(document.querySelector('link[rel="canonical"]').href, `${siteUrl}${route}`);
  assert.equal(document.querySelector('meta[name="robots"]').content, metadata.noindex ? "noindex, follow" : "index, follow");
  for (const element of document.querySelectorAll('[src^="/assets/"], link[href^="/assets/"]')) {
    const file = element.getAttribute("src") || element.getAttribute("href");
    await access(new URL(`../dist${file}`, import.meta.url));
  }
}
const home = new JSDOM(await read("index.html")).window.document;
assert.ok(home.querySelector('a[href="/marketplace"]'));
assert.ok(home.querySelector('a[href="/gyms"]'));
assert.equal(home.querySelectorAll('script[type="application/ld+json"]').length, 1);
assert.deepEqual(JSON.parse(home.querySelector('script[type="application/ld+json"]').textContent)["@graph"].map((entity) => entity["@type"]), ["Organization", "WebSite"]);
const sitemap = new JSDOM(await read("sitemap.xml"), { contentType: "application/xml" }).window.document;
assert.equal(sitemap.querySelectorAll("url").length, Object.values(publicPages).filter((page) => !page.noindex).length);
assert.ok([...sitemap.querySelectorAll("loc")].every((node) => node.textContent.startsWith(`${siteUrl}/`)));
assert.ok((await read("robots.txt")).includes(`Sitemap: ${siteUrl}/sitemap.xml`));
for (const file of ["login.html", "register.html", "forgot-password.html", "app.html", "404.html"]) assert.equal(new JSDOM(await read(file)).window.document.querySelector('meta[name="robots"]').content, "noindex, follow", file);
for (const file of ["listing.html", "gym.html"]) {
  const document = new JSDOM(await read(file)).window.document;
  assert.equal(document.querySelector('meta[name="robots"]').content, "index, follow", file);
  assert.equal(document.querySelector('link[rel="canonical"]'), null, "detail shells must not canonicalize to an unrelated page");
}
assert.ok((await read("_redirects")).includes("/* /404.html 404"));
await access(new URL("../dist/social-card.png", import.meta.url));
console.log("SEO build checks passed: raw content, single H1s, metadata, assets, schema, sitemap, utility noindex, public detail shells and 404 routing.");
