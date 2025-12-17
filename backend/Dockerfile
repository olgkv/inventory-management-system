FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci

COPY backend ./backend
COPY shared ./shared

EXPOSE 3000

CMD ["npm", "run", "dev", "-w", "backend"]
