FROM node:22.13.0-alpine AS build

WORKDIR /app

# Install the pinned package manager directly. The Corepack bundled with this
# Node image can have stale registry signing keys and reject newer pnpm releases.
RUN npm install --global pnpm@10.15.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build && pnpm prune --prod

FROM node:22.13.0-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3005

WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD wget -qO- "http://127.0.0.1:${PORT}/health" || exit 1

CMD ["node", "dist/main.js"]