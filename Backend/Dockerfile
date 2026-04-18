# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (bao gồm devDependencies cho việc build nếu cần)
RUN npm install --frozen-lockfile

# Copy source code
COPY . .

# Stage 2: Production Runtime
FROM node:20-alpine

WORKDIR /app

# Copy node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app ./

# Create uploads directory
RUN mkdir -p uploads

# Cài đặt biến môi trường mặc định (có thể bị ghi đè by docker-compose hoặc env file)
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start application với lệnh chờ DB (chỉ dành cho container)
CMD ["sh", "-c", "npx wait-on tcp:db:5432 && node src/index.js"]
