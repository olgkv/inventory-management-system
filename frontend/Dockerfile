FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci

COPY frontend ./frontend
COPY shared ./shared

EXPOSE 5173

CMD ["npm", "run", "dev", "-w", "frontend", "--", "--host", "0.0.0.0", "--port", "5173"]
