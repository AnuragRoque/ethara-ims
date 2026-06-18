# syntax=docker/dockerfile:1

# ───────────────────────── Stage 1: build the Vite app ─────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install deps first for better layer caching.
COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at build time, so the API URL must be present now.
ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ─────────────────────── Stage 2: serve static files (Nginx) ───────────────────
FROM nginx:alpine AS runtime

# SPA-aware config (client-side routing fallback to index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
