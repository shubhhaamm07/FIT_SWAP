FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY server.js ./
COPY src ./src

ENV NODE_ENV=production
EXPOSE 8000

# Applies only pending migrations; it does not reset or seed the database.
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
