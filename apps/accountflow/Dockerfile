# Nuxt.js Dockerfile for production build
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app/accountflow

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:24-alpine

# Set working directory
WORKDIR /app/accountflow

# Copy built application from builder stage
COPY --from=builder /app/accountflow/.output ./.output

# Copy node_modules from builder stage (Nuxt needs devDependencies to run)
COPY --from=builder /app/accountflow/node_modules ./node_modules

# Copy package.json for reference
COPY --from=builder /app/accountflow/package*.json ./

# Copy migration runtime files for `npm run db:migrate`
COPY --from=builder /app/accountflow/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/accountflow/src/server/db/migrations ./src/server/db/migrations

# Expose the port Nuxt runs on
EXPOSE 3000

# Start the application
CMD ["node", ".output/server/index.mjs"]
