# Multi-stage Dockerfile for development and production (no nginx)

# Stage 1: Development stage (Vite dev server)
FROM node:24-alpine AS dev

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy workspace package files
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json

# Install all dependencies (including devDependencies)
RUN npm ci

# Copy source code (for image-only usage; in docker-compose dev we also mount volumes)
COPY frontend ./frontend
COPY shared ./shared

WORKDIR /app/frontend
EXPOSE 5173

# Default command (docker-compose overrides it)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# Stage 2: Build stage
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY frontend/package.json ./frontend/package.json
COPY shared/package.json ./shared/package.json

RUN npm ci

COPY frontend ./frontend
COPY shared ./shared

RUN npm run build -w frontend

# Stage 3: Production stage (serve static files with Node)
FROM node:24-alpine AS production

WORKDIR /app

RUN npm install -g serve@14.2.4

COPY --from=builder /app/frontend/dist ./dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 80

CMD ["serve", "-s", "dist", "-l", "80"]
