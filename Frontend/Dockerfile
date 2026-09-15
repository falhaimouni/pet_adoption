FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests first
COPY package.json package-lock.json ./
COPY Frontend/package.json ./Frontend/package.json
COPY Backend/package.json ./Backend/package.json
COPY shared/package.json ./shared/package.json

# Install frontend dependencies using the root lock file
RUN npm ci --workspace=pet-adoption-frontend

COPY Frontend ./Frontend
ARG VITE_USE_MOCKS=true
ARG VITE_API_BASE_URL=/api

RUN npm run build --workspace=pet-adoption-frontend

FROM nginx:alpine AS runtime

RUN apk add --no-cache openssl

COPY Frontend/docker-entrypoint.d/20-generate-dev-cert.sh \
    /docker-entrypoint.d/20-generate-dev-cert.sh

RUN chmod +x /docker-entrypoint.d/20-generate-dev-cert.sh

COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/Frontend/dist /usr/share/nginx/html

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]