FROM node:20

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY Backend/package*.json ./
RUN npm install

# Copy backend configuration files
COPY Backend/tsconfig*.json Backend/nest-cli.json ./

# Copy backend source
COPY Backend/src ./src

# Copy shared folder into app so imports resolve to /app/node_modules
COPY shared ./shared

CMD ["npm", "run", "start:dev"]