# Arquitetura do Projeto

O projeto utiliza uma arquitetura de monólito modular baseada em princípios de separação de responsabilidade e baixo acoplamento.

## Objetivo da arquitetura

A arquitetura foi definida visando:

- escalabilidade
- organização do domínio
- facilidade de manutenção
- divisão clara de responsabilidades
- evolução futura do sistema
- facilidade de onboarding para novos desenvolvedores

---

# Estrutura

```txt
src/
├── modules/
├── shared/
├── infra/
```

---

# Organização dos módulos

Cada módulo representa um domínio do sistema.

Exemplo:

```txt
appointments/
users/
auth/
queues/
notifications/
```

Cada módulo poderá conter:

```txt
├── controllers/
├── dto/
├── entities/
├── repositories/
├── use-cases/
└── *.module.ts
```

---

# Padrão arquitetural

O sistema segue um modelo de monólito modular com influência de arquitetura hexagonal e Clean Architecture, utilizando:

- Controllers → camada HTTP
- Use Cases → regras de negócio
- Repositories → acesso a dados
- Entities → representação do domínio

Fluxo principal:

```txt
Controller
   ↓
Use Case
   ↓
Repository
   ↓
Database
```

---

# Tecnologias principais

## Back-End

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- Redis
- Docker

## Front-End

- NextJS
- TailwindCSS
- ShadcnUI

---

# Objetivo do projeto

O sistema tem como objetivo digitalizar e organizar o processo de filas e distribuição de fichas em postos de saúde, reduzindo filas presenciais e melhorando a experiência dos pacientes e funcionários.
