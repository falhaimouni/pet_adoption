FROM node:20

WORKDIR /app

COPY Frontend/package*.json ./
RUN npm install

COPY Frontend/src ./src
COPY Frontend/index.html ./index.html
COPY Frontend/vite.config.js ./vite.config.js
COPY Frontend/tsconfig.json ./tsconfig.json
COPY Frontend/package.json ./package.json

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]