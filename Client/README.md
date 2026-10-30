# FitSwap web client

React 19, React Router, Vite and Tailwind. The browser calls the same-origin `/api` path; Vite proxies local requests to `localhost:8000`, and Netlify proxies production requests to the existing backend.

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
npm run test:seo-build
```

## Public pages and SEO

- Browse `/marketplace`, `/marketplace/:listingId`, `/gyms` and `/gyms/:gymId` without signing in. Saving, purchases, transfers, trials and private account data still require authentication. Member sign-in resumes a validated local destination.
- `/how-it-works`, `/transfer-guide`, `/fees-and-payments` and `/help` describe the current product workflow. Their claims are grounded in the current transfer policy and manual UPI implementation.
- `/terms` and `/privacy` are clearly marked review drafts, excluded from the sitemap and marked `noindex`. The owner must supply/approve final legal wording, entity identity, refund/dispute rules and retention/provider details before using these as final agreements. Registration links to the readable drafts.
- `src/seo/` owns route metadata, canonical URL validation, Organization/WebSite JSON-LD and crawler documents. The user-confirmed public origin is `https://fitswapp.netlify.app`; override it with `VITE_SITE_URL` when changing domains. Never use localhost or a preview-deployment URL as the production canonical.
- The build prerenders the homepage, public browse shells and help/draft pages to HTML. Titles, descriptions, canonical/social tags and homepage schema are included in the response HTML. A `noscript` style keeps animated content visible when JavaScript is disabled. The client replaces the snapshot and loads live data after startup.
- Live marketplace results and individual listing/gym records are still fetched in the browser. They are not build-time snapshots, and their individual URLs are not yet included in the sitemap. SSR or a backend-generated sitemap is the next step for full inventory indexing.
- Utility/authentication pages and the private application shell are `noindex`. Public detail shells use a separate indexable document and set record-specific metadata after fetching. An unavailable record becomes `noindex` in the rendered page.
- `robots.txt` and `sitemap.xml` are generated during build and served with real text/XML responses by the dev server. Netlify routing is generated in `dist/_redirects`; unknown routes return the 404 document with a 404 status. Valid public detail patterns are SPA rewrites: unknown IDs within those patterns still require server/edge resolution for an HTTP 404 (the client already shows an unavailable/noindex page).
- The original blanket SPA fallback was removed. Keep the generated `_redirects` with the `dist` deployment. Other hosting providers need equivalent rewrites and a genuine unknown-route 404.

## Images

`src/assets/images/optimized/` contains WebP derivatives of existing FitSwap artwork. The mobile hero selects size-appropriate variants; `GymPhoto` uses width variants for Unsplash sources, lazy loading and reserved dimensions. `public/social-card.png` is a 1200 × 630 sharing image. Originals remain available. To regenerate these derivatives, run `scripts/create-marketing-assets.py` with a Python environment containing Pillow and the referenced macOS fonts. Image generation is not required during a normal Node build.

## Validation and deployment follow-up

`npm run test:seo-build` checks the generated raw HTML, one H1 per public page, unique metadata, correct canonical URLs, referenced assets, JSON-LD, sitemap contents, noindex utility/draft pages, separate public detail shells and 404 routing.

After deploying, verify actual production responses for `/robots.txt`, `/sitemap.xml`, public pages, a nonexistent route and a nonexistent listing ID. Confirm the live backend is available, use the correct `VITE_SITE_URL`, review the legal drafts and submit the production sitemap in Search Console. No deployment or Search Console changes are performed by this build.

Measure mobile/desktop Lighthouse against the production build and collect field CWV after launch. No Lighthouse score, LCP, INP, CLS, indexing outcome or new SEO readiness score is claimed by these implementation checks. The existing Three.js scene remains a separately loaded large chunk; image byte reductions do not establish a CWV improvement on their own.
