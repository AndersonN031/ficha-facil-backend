# FilaSaúde — API

Sistema de fila virtual para postos de saúde públicos. Resolve um problema real: pessoas precisam sair de madrugada para garantir uma ficha no posto de saúde do bairro. O FilaSaúde digitaliza esse processo com uma fila virtual onde o posto controla a abertura e o limite de fichas do dia, e os pacientes entram e acompanham tudo pelo aplicativo.

> 🚧 Projeto em desenvolvimento ativo

---

## O problema

Postos de saúde públicos distribuem fichas de atendimento por ordem de chegada presencial. Isso obriga pacientes a madrugar na fila, muitas vezes sem garantia de atendimento. O FilaSaúde digitaliza esse processo com uma fila virtual onde o posto controla a abertura e o limite de fichas do dia, e os pacientes entram e acompanham tudo pelo aplicativo.

---

## Papéis do sistema

| Role              | Descrição                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------- |
| **Paciente**      | Entra na fila virtual, acompanha posição em tempo real, recebe notificação quando chamado |
| **Recepcionista** | Opera o painel do dia, chama o próximo da fila, emite a ficha                             |
| **Médico**        | Visualiza as fichas atribuídas a ele, marca início e fim do atendimento                   |
| **Admin**         | Configura o posto, define limite de fichas, gerencia usuários e papéis                    |

---

## Stack

### Back-End

- **NestJS** + **TypeScript** — framework principal com arquitetura modular
- **Prisma** — ORM para acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional
- **Redis** — cache de leitura e controle de idempotência
- **Socket.io** — notificações em tempo real
- **BullMQ** — filas e workers para processamento assíncrono (Sprint 3)
- **JWT** — autenticação com access token (30min) e refresh token (7d)
- **RBAC** — autorização por papéis com Guards no NestJS

### Infraestrutura

- **Docker** — ambiente local com Postgres e Redis em containers
- **Supabase** — hospedagem do banco em produção
- **Render** — deploy da API
- **GitHub Actions** — CI/CD

### Qualidade

- **Jest** + **Supertest** — testes de integração e e2e
- **ESLint** + **Prettier** — padronização de código
- **Husky** + **lint-staged** — validação antes do commit

---

## Arquitetura

O back-end segue uma arquitetura de **monolito modular**, onde cada módulo é organizado internamente em camadas:

```
src/modules/auth/
├── controllers/     # recebe e responde requisições HTTP
├── usecases/        # lógica de negócio isolada por operação
├── repositories/    # acesso ao banco de dados
├── entities/        # modelos de domínio
└── dto/             # validação de entrada
```

Cada operação de negócio é um usecase independente — `RegisterUseCase`, `LoginUseCase`, `EnterQueueUseCase` — facilitando testes unitários e manutenção.

---

## Módulos

| Módulo            | Status       | Descrição                                                            |
| ----------------- | ------------ | -------------------------------------------------------------------- |
| **Auth**          | ✅ Concluído | Register, login, refresh token, logout, JWT + RBAC                   |
| **Users**         | ✅ Concluído | GET /me, PUT /me — perfil do usuário                                 |
| **Health Units**  | ✅ Concluído | CRUD de postos, listagem pública com filtro por cidade/estado        |
| **Queue**         | ✅ Concluído | Fila virtual, entrar, cancelar, cache Redis, Socket.io, idempotência |
| **Tickets**       | 🚧 Sprint 3  | Emissão e controle de fichas                                         |
| **Notifications** | 🚧 Sprint 3  | BullMQ workers para notificações                                     |
| **Reports**       | ⏳ Pendente  | Métricas e dashboard admin                                           |

---

## Documentação

| Arquivo                                             | Conteúdo                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| [DEVELOPMENT.md](./docs/local-development-guide.md) | Como rodar o projeto localmente                                    |
| [AUTH.md](./docs/auth-and-users.md)                 | Autenticação, JWT, RBAC, rotas de auth e usuários                  |
| [QUEUE.md](./docs/queue.md)                         | Fila virtual, postos, cache, idempotência, concorrência, Socket.io |

---

## Autores

Projeto desenvolvido como portfólio pessoal com foco em boas práticas de desenvolvimento back-end.

OBS: Atualmente estou utilizando a branch dev para mergear códigos ao inves da master
