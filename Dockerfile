# ================================
# Stage 1 — Build
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# copia os arquivos de dependência primeiro
# Docker cacheia essa camada — só reinstala se package.json mudar
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# copia o restante do código e compila
COPY . .
RUN npm run build

# ================================
# Stage 2 — Production
# ================================
FROM node:20-alpine AS production

WORKDIR /app

# copia só o necessário do stage anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./


ENV NODE_ENV=production

# porta que a API escuta
EXPOSE 3001

# comando para iniciar a API
CMD ["node", "dist/main"]