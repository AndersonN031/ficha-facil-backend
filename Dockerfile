# ================================
# Stage 1 — Build
# ================================
FROM node:20-slim AS builder

WORKDIR /app

# Instala OpenSSL
RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

# Dependências
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Código
COPY . .

# Gera o Prisma Client dentro do Debian
RUN npx prisma generate

# Build NestJS
RUN npm run build


# ================================
# Stage 2 — Production
# ================================
FROM node:20-slim AS production

WORKDIR /app

# Instala OpenSSL
RUN apt-get update \
    && apt-get install -y openssl \
    && rm -rf /var/lib/apt/lists/*

# Arquivos compilados
COPY --from=builder /app/dist ./dist

# Dependências
COPY --from=builder /app/node_modules ./node_modules

# Prisma
COPY --from=builder /app/prisma ./prisma

# package
COPY --from=builder /app/package*.json ./

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/main.js"]