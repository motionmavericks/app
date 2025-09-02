# syntax=docker/dockerfile:1.4

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG BUILD_SHA="dev"
# Use BuildKit secret for Sentry auth token during build (not persisted in image)
RUN --mount=type=secret,id=SENTRY_AUTH_TOKEN \
    sh -lc 'echo "BUILD_SHA=$BUILD_SHA" \
      && export SENTRY_AUTH_TOKEN=$(cat /run/secrets/SENTRY_AUTH_TOKEN 2>/dev/null || true) \
      && npm run build \
      && echo "== dist listing ==" && ls -la dist \
      && echo "== dist/index.js (head) ==" && sed -n "1,80p" dist/index.js \
      && echo "== dist/sign.js ==" && sed -n "1,80p" dist/sign.js' || true

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node","dist/index.js"]
