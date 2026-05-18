FROM node:20

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package*.json ./
RUN npm install

COPY src ./src

CMD ["npm", "run", "start:dev"]