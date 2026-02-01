FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace
COPY services/api ./services/api

# Install deps
RUN npm install

# Build
WORKDIR /app/services/api
RUN npm run build

# Runtime
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/services/api/dist ./dist
COPY --from=builder /app/services/api/package*.json ./

RUN npm install --production

EXPOSE 3000
CMD ["npm", "start"]
