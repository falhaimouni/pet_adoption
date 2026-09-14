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
ARG VITE_API_BASE_URL=http://localhost:3000

RUN npm run build --workspace=pet-adoption-frontend

FROM nginx:alpine AS runtime

COPY Frontend/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/Frontend/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]