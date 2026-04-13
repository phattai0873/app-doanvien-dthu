# Stage 1: Build React/Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (incl development for vite build)
RUN npm install

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy build result from stage 1 to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Chạy Nginx ở foreground (mặc định)
CMD ["nginx", "-g", "daemon off;"]
