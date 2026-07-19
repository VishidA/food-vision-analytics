FROM node:22-alpine AS builder
WORKDIR /app_web/
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app_web/
RUN npm install -g serve
COPY --from=builder /app_web/dist ./dist
EXPOSE 8080
CMD ["serve", "-s", "dist", "-l", "8080"]
