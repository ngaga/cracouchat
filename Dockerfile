FROM node:20.19.2 AS base

# Install system dependencies
RUN apt-get update && \
  apt-get install -y vim && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20.19.2 AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (Next.js needs dev dependencies for build artifacts)
RUN npm ci

# Copy built application from base stage
COPY --from=base /app/.next ./.next
COPY --from=base /app/next.config.js ./
COPY --from=base /app/tsconfig.json ./
COPY --from=base /app/pages ./pages
COPY --from=base /app/styles ./styles
# Create public directory (Next.js requires it even if empty)
RUN mkdir -p ./public

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]

