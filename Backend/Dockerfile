FROM node:20

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY Backend/package*.json ./
RUN npm install

COPY Backend/tsconfig*.json Backend/nest-cli.json ./
COPY Backend/src ./src

CMD ["npm", "run", "start:dev"]
