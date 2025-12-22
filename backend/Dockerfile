# Multi-stage Dockerfile for production

# Stage 1: Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY tsconfig.json ./

# Copy workspace package files
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY backend ./backend
COPY shared ./shared

RUN npm run build -w shared

# Build the backend
RUN npm run build -w backend

# Stage 2: Production stage
FROM node:24-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/package.json
COPY shared/package.json ./shared/package.json

# Install only production dependencies (skip prepare script which runs husky)
RUN npm ci --production --ignore-scripts && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared ./shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "backend/dist/main.js"]
