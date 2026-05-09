# Guia de desenvolvimento local

Tudo que você precisa para rodar o projeto FilaSaúde na sua máquina.

## Pré-requisitos

- [Node.js 20+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Git](https://git-scm.com)

## Configuração inicial (apenas na primeira vez)

### 1. Clone o repositório e instale as dependências

```bash
git clone https://github.com/seu-usuario/filasaude.git
cd filasaude/api
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

O `.env.example` contém todas as variáveis necessárias. Para desenvolvimento local os valores padrão já funcionam — só troque os secrets do JWT.

### 3. Suba os serviços com Docker

```bash
docker compose up -d
```

Na primeira vez o Docker vai baixar as imagens do Postgres e Redis. Aguarde até os dois aparecerem como `healthy`:

```bash
docker compose ps
```

```
NAME                   STATUS          PORTS
filasaude_postgres     healthy         0.0.0.0:5433->5432/tcp
filasaude_redis        healthy         0.0.0.0:6380->6379/tcp
```

### 4. Rode as migrations do banco

```bash
npx prisma migrate dev
```

### 5. Suba a API

```bash
npm run start:dev
```

A API estará disponível em `http://localhost:3000`.

---

## Rodando no dia a dia

```bash
npm run dev        # sobe o Docker + a API em um comando só
npm run dev:down   # para os containers ao final do dia
```
---

## Conexões

| Serviço  | URL de conexão                                                    |
| -------- | ----------------------------------------------------------------- |
| API      | `http://localhost:3000`                                           |
| Postgres | `postgresql://filasaude:filasaude123@localhost:5433/filasaude_db` |
| Redis    | `redis://:redis123@localhost:6380`                                |
| Swagger  | `http://localhost:3000/api/docs`                                  |

---

## Comandos Docker úteis

```bash
# Ver status dos containers
docker compose ps

# Ver logs de um serviço
docker compose logs postgres
docker compose logs redis

# Acessar o banco pelo terminal
docker exec -it filasaude_postgres psql -U filasaude -d filasaude_db

# Testar conexão com o Redis
docker exec -it filasaude_redis redis-cli -a redis123 ping

# Parar os containers (mantém os dados)
docker compose down

# Parar e apagar todos os dados (reset completo)
docker compose down -v
```

---

## Comandos Prisma úteis

```bash
# Criar uma nova migration após alterar o schema
npx prisma migrate dev --name nome_da_migration

# Aplicar migrations pendentes (usado no CI/CD)
npx prisma migrate deploy

# Abrir o Prisma Studio para inspecionar o banco visualmente
npx prisma studio

# Resetar o banco de dados (apaga tudo e reaplica as migrations)
npx prisma migrate reset
```

---

## Fluxo de trabalho com Git

Nunca commite direto em `main` ou `dev`. O fluxo correto é:

```bash
# 1. Sempre parta da dev atualizada
git checkout dev
git pull origin dev

# 2. Crie a branch da task
git checkout -b feat/nome-da-task

# 3. Desenvolva e commite
git add .
git commit -m "feat: descrição do que foi feito"

# 4. Antes de abrir o PR, sincronize com a dev
git fetch origin
git rebase origin/dev

# 5. Suba a branch e abra o PR para dev
git push origin feat/nome-da-task
```

### Prefixos de branch

| Prefixo     | Quando usar                                |
| ----------- | ------------------------------------------ |
| `feat/`     | Nova funcionalidade                        |
| `fix/`      | Correção de bug                            |
| `chore/`    | Configuração, infra, sem código de produto |
| `test/`     | Apenas testes                              |
| `docs/`     | Documentação                               |
| `refactor/` | Refatoração sem mudança de comportamento   |

### Convenção de commits

```
feat: add queue entry endpoint with idempotency check
fix: correct ticket sequence on same-day reset
chore: configure eslint and prettier
test: add integration tests for auth module
docs: update readme with local setup steps
refactor: extract queue position logic to service layer
```

---

## Variáveis de ambiente

| Variável                 | Descrição                              | Exemplo                |
| ------------------------ | -------------------------------------- | ---------------------- |
| `DATABASE_URL`           | URL completa de conexão com o Postgres | `postgresql://...`     |
| `DB_HOST`                | Host do banco                          | `localhost`            |
| `DB_PORT`                | Porta do banco                         | `5433`                 |
| `DB_USER`                | Usuário do banco                       | `filasaude`            |
| `DB_PASSWORD`            | Senha do banco                         | `filasaude123`         |
| `DB_NAME`                | Nome do banco                          | `filasaude_db`         |
| `REDIS_HOST`             | Host do Redis                          | `localhost`            |
| `REDIS_PORT`             | Porta do Redis                         | `6380`                 |
| `REDIS_PASSWORD`         | Senha do Redis                         | `redis123`             |
| `JWT_SECRET`             | Secret do access token                 | string aleatória longa |
| `JWT_EXPIRES_IN`         | Expiração do access token              | `15m`                  |
| `JWT_REFRESH_SECRET`     | Secret do refresh token                | string aleatória longa |
| `JWT_REFRESH_EXPIRES_IN` | Expiração do refresh token             | `7d`                   |
| `PORT`                   | Porta da API                           | `3000`                 |
| `NODE_ENV`               | Ambiente                               | `development`          |

---

## Estrutura do projeto

```
api/
├── src/
│   ├── modules/          # módulos da aplicação (auth, users, queue, tickets...)
│   ├── common/           # guards, decorators, filters, interceptors compartilhados
│   ├── config/           # configuração de envs e serviços externos
│   └── main.ts           # entry point
├── prisma/
│   ├── schema.prisma     # schema do banco
│   └── migrations/       # histórico de migrations
├── test/                 # testes e2e
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## Problemas comuns

**Porta já em uso**

Se aparecer erro de porta ocupada, é porque seu Postgres ou Redis local está rodando na mesma porta. O compose já usa `5433` e `6380` para evitar conflito — verifique se não tem outro processo nessas portas:

```bash
# Windows
netstat -ano | findstr :5433

# Mac/Linux
lsof -i :5433
```

**Container não sobe como healthy**

```bash
docker compose logs postgres
docker compose logs redis
```

Leia os logs para entender o erro. Geralmente é senha errada no `.env` ou volume corrompido — nesse caso rode `docker compose down -v` e suba novamente.

**Prisma não encontra o banco**

Confirme que o container está `healthy` antes de rodar as migrations e que o `DATABASE_URL` no `.env` está correto.
