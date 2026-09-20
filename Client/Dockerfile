FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# Install from the lock file so the Linux image receives the correct optional
# Vite/Tailwind platform package without changing dependency versions.
RUN npm ci --include=optional --no-audit --no-fund

COPY . .

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --spider -q http://127.0.0.1/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
