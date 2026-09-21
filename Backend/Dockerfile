FROM node:20 AS builder

WORKDIR /app

#root workspace
COPY package.json package-lock.json ./

# Workspace manifests
COPY Backend/package.json ./Backend/package.json
COPY Frontend/package.json ./Frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci \
    --workspace=pet-adoption-backend \
    --workspace=pet-adoption-shared

# Preserve the original monorepo structure
COPY Backend/tsconfig*.json Backend/nest-cli.json ./Backend/
COPY Backend/src ./Backend/src
COPY shared ./shared

WORKDIR /app/Backend

RUN npm run build

FROM node:20-slim AS runtime

ENV NODE_ENV=production

WORKDIR /app

# Root workspace metadata
COPY package.json package-lock.json ./
COPY Backend/package.json ./Backend/package.json
COPY Frontend/package.json ./Frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci \
    --omit=dev \
    --workspace=pet-adoption-backend \
    --workspace=pet-adoption-shared \
    && npm cache clean --force

WORKDIR /app/Backend

# Copy only compiled application files from the builder
COPY --from=builder --chown=node:node /app/Backend/dist ./dist

# Create the persistent upload path with non-root ownership
RUN mkdir -p uploads && chown node:node uploads

USER node

EXPOSE 3000

CMD ["node", "dist/Backend/src/main.js"]