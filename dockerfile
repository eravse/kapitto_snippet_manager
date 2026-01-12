# 1. Aşama: Bağımlılıklar
FROM node:20-alpine AS deps
# RUN apk add --no-cache libc6-compat openssl
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
# Prisma dosyalarını kopyalıyoruz ki generate çalışabilsin
COPY prisma ./prisma/ 
RUN npm install --legacy-peer-deps --verbose

# 2. Aşama: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build


# 3. Aşama: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV production

# Gerekli klasör izinleri
RUN mkdir -p /app/prisma/data && chown -R node:node /app

COPY --from=builder --chown=node:node /app/.next ./.next
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/package.json ./package.json
COPY --from=builder --chown=node:node /app/prisma ./prisma

USER node

EXPOSE 3000
ENV PORT 3000

# HEM DB Push (veya migrate), HEM Seed, HEM Start
CMD ["sh", "-c", "npx prisma db push && npx prisma db seed && npm start"]
