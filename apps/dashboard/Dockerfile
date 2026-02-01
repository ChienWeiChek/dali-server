FROM node:20-alpine AS builder

WORKDIR /app

# Copy root config
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy workspace
COPY apps/dashboard ./apps/dashboard

# Install deps
RUN npm install

# Build
WORKDIR /app/apps/dashboard
RUN npm run build

# Runtime
FROM nginx:alpine

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
