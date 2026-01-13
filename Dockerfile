# =============================================================================
# Read Water API - Production Dockerfile
# Multi-stage build for NestJS with Prisma
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# Install OpenSSL for Prisma (required for Prisma Client)
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

# Install OpenSSL for Prisma generation
RUN apk add --no-cache openssl

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Prune dev dependencies after build
RUN npm prune --production

# Re-generate Prisma client for production (ensures correct binaries)
RUN npx prisma generate

# -----------------------------------------------------------------------------
# Stage 3: Production
# -----------------------------------------------------------------------------
FROM node:22-alpine AS production
WORKDIR /app

# Install OpenSSL and dumb-init for proper signal handling
RUN apk add --no-cache openssl dumb-init

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Set environment variables
ENV NODE_ENV=production
ENV API_PORT=4000

# Expose port
EXPOSE 4000

# Switch to non-root user
USER nestjs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/src/main.js"]
