import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { robotsFor, sitemapFor } from './src/seo/crawlers.js'
import { normalizeSiteUrl, publicPages } from './src/seo/site.js'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'fitswap-crawler-files',
      configureServer(server) {
        const origin = normalizeSiteUrl(loadEnv(mode, '.', 'VITE_').VITE_SITE_URL || 'https://fitswapp.netlify.app');
        server.middlewares.use((req, res, next) => {
          const pathname = req.url?.split('?')[0];
          if (!['/robots.txt', '/sitemap.xml'].includes(pathname)) return next();
          res.setHeader('Content-Type', pathname === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8');
          res.end(pathname === '/robots.txt' ? robotsFor(origin) : sitemapFor(origin, publicPages));
        });
      },
    },
  ],
  build: { manifest: true },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
}))
