# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/assets ./assets

RUN addgroup -g 1000 nodeapp && \
    adduser -D -u 1000 -G nodeapp nodeapp && \
    chown -R nodeapp:nodeapp /app

USER nodeapp

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/main"]
