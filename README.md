# Ficha Fácil

Sistema de fila virtual para postos de saúde públicos. O projeto nasceu de um problema real: pessoas precisam sair de madrugada para garantir uma ficha no posto de saúde do bairro. O Ficha Fácil resolve isso permitindo que o paciente entre na fila pelo celular e acompanhe sua posição em tempo real, sem precisar estar presencialmente no local.

> 🚧 Projeto em desenvolvimento ativo

---

## O problema

Postos de saúde públicos distribuem fichas de atendimento por ordem de chegada presencial. Isso obriga pacientes a madrugar na fila, muitas vezes sem garantia de atendimento. O FilaSaúde digitaliza esse processo com uma fila virtual onde o posto controla a abertura e o limite de fichas do dia, e os pacientes entram e acompanham tudo pelo aplicativo.

---

## Papéis do sistema

| Role | Descrição |
|------|-----------|
| **Paciente** | Entra na fila virtual, acompanha posição em tempo real, recebe notificação quando chamado |
| **Recepcionista** | Opera o painel do dia, chama o próximo da fila, emite a ficha |
| **Médico** | Visualiza as fichas atribuídas a ele, marca início e fim do atendimento |
| **Admin** | Configura o posto, define limite de fichas, gerencia usuários e papéis |

---

## Stack

### Back-End
- **NestJS** + **TypeScript** — framework principal com arquitetura modular
- **Prisma** — ORM para acesso ao banco de dados
- **PostgreSQL** — banco de dados relacional
- **Redis** — cache e controle de idempotência
- **Socket.io** — notificações em tempo real (posição na fila, chamada da ficha)
- **BullMQ** — filas e workers para processamento assíncrono
- **JWT** — autenticação com access token (30min) e refresh token (7d)
- **RBAC** — autorização por papéis com Guards no NestJS

### Front-End
- **Next.js 14** + **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

### Infraestrutura
- **Docker** — ambiente local com Postgres e Redis em containers
- **Supabase** — hospedagem do banco em produção
- **Render** — deploy da API
- **Vercel** — deploy do front-end
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

Cada operação de negócio é um usecase independente — `RegisterUseCase`, `LoginUseCase`, `RefreshTokenUseCase` — o que facilita testes unitários e manutenção.

---

## Módulos

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Auth** | ✅ Concluído | Register, login, refresh token, logout, JWT + RBAC |
| **Users** | 🚧 Em andamento | CRUD de perfil, gerenciamento de papéis |
| **Health Units** | ⏳ Pendente | Cadastro e configuração de postos |
| **Queue** | ⏳ Pendente | Fila virtual, posição em tempo real |
| **Tickets** | ⏳ Pendente | Emissão e controle de fichas |
| **Notifications** | ⏳ Pendente | Socket.io + BullMQ workers |
| **Reports** | ⏳ Pendente | Métricas e dashboard admin |

---

## Autores

Projeto desenvolvido como portfólio pessoal com foco em boas práticas de desenvolvimento back-end e front-end.

OBS: Atualmente estou utilizando a branch dev para mergear códigos ao inves da master
