# Prisma 6 needs OpenSSL to select the Debian 12 query engine during
# generation and to load that engine when the API starts.
FROM node:22-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Install production dependencies in a separate stage so no host node_modules
# or development tools are copied into the runtime image.
FROM base AS dependencies

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

FROM base AS runtime

ENV NODE_ENV=production \
    PORT=8000

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json package-lock.json server.js ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node src ./src

USER node

EXPOSE 8000

# The API is considered ready only once it can query PostgreSQL.
HEALTHCHECK --interval=20s --timeout=5s --start-period=30s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:8000/api/health').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

# `migrate deploy` is additive and safe to run at startup. It never resets or
# seeds the database. Use a dedicated one-off migration job before scaling the
# API beyond one replica in production.
CMD ["sh", "-c", "npx prisma migrate deploy && exec node server.js"]
