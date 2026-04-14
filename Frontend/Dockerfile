# Stage 1: Build React/Vite app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (incl development for vite build)
RUN npm install

# Copy source code
COPY . .

# Khai báo ARG để nhận biến môi trường từ Render lúc Build (Vite cần cái này)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

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
