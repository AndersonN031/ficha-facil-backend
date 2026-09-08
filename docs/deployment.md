# Deploy e Infraestrutura

Documentação do processo de deploy, CI/CD e infraestrutura de produção do Ficha Fácil.

---

## Visão geral

```
Desenvolvimento (local)
  → Push na dev → CI roda (lint + testes + build Docker)
  → Merge dev → master → Migrations no Supabase + Deploy no Render
```

---

## Infraestrutura de produção

| Serviço        | Plataforma       | Descrição                        |
| -------------- | ---------------- | -------------------------------- |
| API            | Render           | Web Service com Docker           |
| Banco de dados | Supabase         | PostgreSQL gerenciado            |
| Cache / Filas  | Render Key Value | Redis compatível                 |
| CI/CD          | GitHub Actions   | Lint, testes e deploy automático |

---

## Dockerfile

A API usa um **multi-stage build** para gerar uma imagem de produção enxuta.

### Estágios

**Stage 1 — builder:**

- Base: `node:20-slim`
- Instala OpenSSL (necessário para o Prisma Client)
- Instala todas as dependências incluindo devDependencies
- Gera o Prisma Client com `prisma generate`
- Compila o TypeScript com `nest build`

**Stage 2 — production:**

- Base: `node:20-slim`
- Instala OpenSSL
- Copia apenas `dist/`, `node_modules/`, `prisma/` e `package.json` do stage anterior
- Imagem final sem código-fonte, sem devDependencies, sem compilador

### Por que `node:20-slim` em vez de `node:20-alpine`?

O Prisma Client precisa do OpenSSL 1.1 que não está disponível no Alpine por padrão. O `node:20-slim` (baseado em Debian) tem compatibilidade nativa com o Prisma sem configurações extras além da instalação do `openssl`.

---

## CI/CD com GitHub Actions

Dois workflows na pasta `.github/workflows/`:

### `ci.yml` — Integração contínua

Roda em todo push para `dev` e `master` e em todo PR aberto para essas branches.

**Jobs em sequência:**

```
Lint (34s) → Testes de integração (55s) → Build Docker (51s)
```

- **Lint** — verifica padrão de código com ESLint
- **Testes** — sobe Postgres e Redis em containers, roda migrations e executa os testes de integração com banco real
- **Build Docker** — confirma que a imagem builda sem erro

Se qualquer job falhar, os seguintes não executam.

### `deploy.yml` — Deploy contínuo

Roda apenas em push para `master`.

```
Push na master → prisma migrate deploy → curl deploy hook → Render inicia deploy
```

**Fluxo:**

1. Roda `prisma migrate deploy` com a URL do Supabase — aplica migrations pendentes automaticamente
2. Chama o deploy hook do Render via `curl POST`
3. O Render detecta o hook, puxa o código e builda a imagem Docker
4. API entra no ar com a nova versão

---

## Secrets do GitHub Actions

Configurados em **Settings → Secrets and variables → Actions**:

| Secret                    | Descrição                             |
| ------------------------- | ------------------------------------- |
| `RENDER_DEPLOY_HOOK`      | URL do deploy hook do Render          |
| `DATABASE_URL_PRODUCTION` | URL de conexão do Supabase com pooler |

---

## Variáveis de ambiente no Render

Configuradas em **Environment** do serviço:

| Variável                 | Descrição                                      |
| ------------------------ | ---------------------------------------------- |
| `DATABASE_URL`           | URL do Supabase com pooler (`?pgbouncer=true`) |
| `REDIS_HOST`             | Host do Render Key Value                       |
| `REDIS_PORT`             | Porta do Redis                                 |
| `REDIS_PASSWORD`         | Senha do Redis                                 |
| `JWT_SECRET`             | Secret do access token                         |
| `JWT_EXPIRES_IN`         | Expiração do access token (`30m`)              |
| `JWT_REFRESH_SECRET`     | Secret do refresh token                        |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token (`7d`)              |
| `PORT`                   | Porta da API (`3001`)                          |
| `NODE_ENV`               | Ambiente (`production`)                        |

---

## Banco de dados — Supabase

### Conexão

O Supabase oferece dois tipos de conexão:

| Tipo                 | Porta | Quando usar                      |
| -------------------- | ----- | -------------------------------- |
| Direta               | 5432  | Conexões únicas de longa duração |
| Pooler (Transaction) | 6543  | APIs com muitas conexões curtas  |

Usamos o **pooler** em produção com `?pgbouncer=true` na URL — mais eficiente para APIs REST que abrem e fecham conexões a cada request.

### Migrations

**Primeira vez** — aplicadas manualmente via SQL Editor do Supabase (necessário apenas no setup inicial).

**Próximas vezes** — o `deploy.yml` roda `prisma migrate deploy` automaticamente antes de cada deploy. Nunca precisa rodar manualmente.

### Criando uma nova migration

```bash
# 1. altera o schema.prisma
# 2. cria a migration localmente
npx prisma migrate dev --name nome_da_migration

# 3. commita e faz push na dev
# 4. merge na master → CI/CD aplica no Supabase automaticamente
```

---

## Redis — Render Key Value

Usado para cache de leitura da fila (TTL 5s) e chaves de idempotência (TTL 30s). O Render Key Value é compatível com a interface do Redis — o código usa `ioredis` normalmente.

---

## Fluxo completo de um deploy

```
1. Desenvolve na branch feat/*
2. Abre PR para dev
3. CI roda: lint + testes + build Docker
4. Merge na dev (CI roda novamente no push)
5. Quando pronto para produção: merge dev → master
6. CI roda novamente
7. deploy.yml dispara:
   a. prisma migrate deploy no Supabase
   b. curl no deploy hook do Render
8. Render builda a imagem Docker
9. API entra no ar
```
