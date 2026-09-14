# Ambientes

Documentação das diferenças entre os ambientes de desenvolvimento, teste e produção.

---

## Visão geral

O projeto possui três ambientes com configurações distintas:

| Ambiente    | Arquivo           | Quando é usado                     |
| ----------- | ----------------- | ---------------------------------- |
| Development | `.env`            | Desenvolvimento local no dia a dia |
| Test        | `.env.test`       | Testes de integração e e2e         |
| Production  | `.env.production` | Deploy no Render                   |

O `ConfigModule` do NestJS carrega o arquivo correto automaticamente baseado na variável `NODE_ENV`:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : process.env.NODE_ENV === 'test'
    ? '.env.test'
    : '.env',
}),
```

---

## Development

**Arquivo:** `.env`

**Banco de dados:** PostgreSQL local via Docker na porta `5433`

**Redis:** Redis local via Docker na porta `6380`

**Logs:** Formato legível com `pino-pretty` e cores no terminal

**Sentry:** Desabilitado — `SENTRY_DSN` não existe nesse arquivo para não poluir o painel com erros de desenvolvimento

**Como rodar:**

```bash
npm run dev   # sobe Docker + API
```

---

## Test

**Arquivo:** `.env.test`

**Banco de dados:** PostgreSQL dedicado para testes na porta `5434` — banco separado do desenvolvimento para não contaminar dados reais

**Redis:** Mesmo Redis local mas sem senha — simplifica a configuração dos testes

**Logs:** Suprimidos durante os testes para não poluir o output do Jest

**Sentry:** Desabilitado

**Como rodar:**

```bash
dotenv -e .env.test -- npx prisma migrate deploy  # aplica migrations no banco de teste
npm run test:integration                           # roda os testes
```

**No CI/CD:** O GitHub Actions sobe containers de Postgres e Redis automaticamente e usa as variáveis definidas diretamente no workflow `ci.yml`.

---

## Production

**Arquivo:** `.env.production` (local) e variáveis configuradas no Render dashboard

**Banco de dados:** Supabase (PostgreSQL gerenciado) com connection pooler na porta `6543`

**Redis:** Render Key Value

**Logs:** Formato JSON estruturado — cada campo separado e pesquisável nos logs do Render

**Sentry:** Ativo — captura exceptions não tratadas e envia para o painel do Sentry

**Migrations:** Aplicadas automaticamente pelo CI/CD antes de cada deploy via `prisma migrate deploy`

---

## Diferenças principais entre os ambientes

|            | Development           | Test           | Production       |
| ---------- | --------------------- | -------------- | ---------------- |
| `NODE_ENV` | `development`         | `test`         | `production`     |
| Banco      | localhost:5433        | localhost:5434 | Supabase         |
| Redis      | localhost:6380        | localhost:6380 | Render Key Value |
| Logs       | pino-pretty (legível) | suprimido      | JSON estruturado |
| Sentry     | desabilitado          | desabilitado   | ativo            |
| PORT       | `3001`                | `3001`         | `3001`           |

---

## Variáveis que mudam entre ambientes

| Variável         | Development    | Test           | Production             |
| ---------------- | -------------- | -------------- | ---------------------- |
| `DATABASE_URL`   | localhost:5433 | localhost:5434 | Supabase pooler        |
| `REDIS_HOST`     | localhost      | localhost      | Render Key Value host  |
| `REDIS_PASSWORD` | redis123       | vazio          | senha do Render        |
| `NODE_ENV`       | development    | test           | production             |
| `SENTRY_DSN`     | não existe     | não existe     | URL do Sentry          |
| `JWT_SECRET`     | valor local    | valor de teste | valor seguro no Render |

---

## Boas práticas

**Nunca commita o `.env.production`** — ele contém credenciais reais. Está no `.gitignore`.

**Nunca usa o banco de produção para testes** — o `.env.test` aponta para um banco separado exatamente por isso.

**Secrets de produção ficam no Render** — o `.env.production` local é só para rodar migrations manualmente quando necessário. Em produção as variáveis vêm do painel do Render.
