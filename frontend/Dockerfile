# --- Build stage ---
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies (cached unless lockfile changes).
COPY package*.json ./
RUN npm ci

# Build-time API URL is baked into the static bundle (Vite inlines VITE_*).
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# --- Serve stage ---
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
