# Tickets, Médico e Notificações

Documentação do módulo de tickets, painel da recepcionista, painel do médico, notificações com BullMQ e testes de integração do FilaSaúde.

---

## Visão geral

O ticket é a ficha emitida quando a recepcionista chama o próximo paciente da fila virtual. Ele representa o atendimento do início ao fim:

```
QueueEntry (WAITING)
  → recepcionista chama
  → Ticket criado (WAITING) + QueueEntry (CALLED)
  → médico inicia
  → Ticket (IN_PROGRESS)
  → médico conclui
  → Ticket (DONE) + QueueEntry (DONE)
```

O fluxo de status do ticket é **unidirecional** — uma vez `DONE`, o ticket não pode voltar para `IN_PROGRESS` ou `WAITING`. Essa regra é validada no usecase, não no banco.

---

## Schema do banco

```prisma
enum TicketStatus {
  WAITING      // ficha emitida, aguardando atendimento
  IN_PROGRESS  // médico iniciou o atendimento
  DONE         // atendimento concluído
}

model Ticket {
  id           String       @id @default(uuid())
  ticketNumber Int
  status       TicketStatus @default(WAITING)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  queueEntryId String       @unique
  queueEntry   QueueEntry   @relation(fields: [queueEntryId], references: [id])
  doctorId     String?
  doctor       User?        @relation("DoctorTickets", fields: [doctorId], references: [id])
  healthUnitId String
  healthUnit   HealthUnit   @relation(fields: [healthUnitId], references: [id])

  @@unique([healthUnitId, ticketNumber, createdAt])
  @@map("tickets")
}
```

**Decisões de schema:**

`queueEntryId @unique` — uma `QueueEntry` só pode gerar um `Ticket`. Impede chamar o mesmo paciente duas vezes.

`ticketNumber` — número sequencial do dia por posto. Calculado contando os tickets do dia antes de criar.

`doctorId` opcional — médico pode ser atribuído na emissão ou depois.

`healthUnitId` direto no `Ticket` — facilita queries de relatório sem navegar `Ticket → QueueEntry → Queue → HealthUnit`.

---

## Mudança no schema User

Foi adicionado `healthUnitId` no `User` para vincular recepcionistas e médicos ao posto:

```prisma
model User {
  // ... campos existentes
  healthUnitId String?
  healthUnit   HealthUnit? @relation(fields: [healthUnitId], references: [id])
}
```

Um posto pode ter várias recepcionistas, mas cada recepcionista pertence a um único posto. Por enquanto médicos também seguem a mesma regra — suporte a múltiplos postos por médico está planejado para o Sprint 6 via tabela pivot `UserHealthUnit`.

---

## Rotas — Recepcionista

### `POST /tickets/call-next`

Recepcionista chama o próximo paciente da fila. Restrito a `RECEPTIONIST`.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Fluxo interno:**

1. Busca `healthUnitId` da recepcionista logada
2. Busca o primeiro `QueueEntry` com status `WAITING` ordenado por posição
3. Gera número sequencial do dia
4. Cria o `Ticket` e muda `QueueEntry` para `CALLED` atomicamente
5. Invalida o cache Redis da fila
6. Emite `queue:update` via Socket.io para todos do posto
7. Enfileira notificação no BullMQ para entrega com retry

**Resposta `200`:**

```json
{
  "id": "uuid",
  "ticketNumber": 1,
  "status": "WAITING",
  "queueEntryId": "uuid",
  "healthUnitId": "uuid",
  "doctorId": null,
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token ausente ou inválido |
| `403` | Usuário não é RECEPTIONIST ou não está vinculado a um posto |
| `404` | Nenhum paciente aguardando na fila |

---

### `GET /tickets/today`

Lista fichas emitidas hoje no posto da recepcionista logada. Restrito a `RECEPTIONIST`.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `200`:**

```json
[
  {
    "id": "uuid",
    "ticketNumber": 1,
    "status": "WAITING",
    "createdAt": "...",
    "queueEntry": {
      "position": 1,
      "user": {
        "id": "uuid",
        "name": "João Silva",
        "cpf": "04512345678"
      }
    }
  }
]
```

---

## Rotas — Médico

Todas as rotas do médico exigem que o usuário tenha `role: DOCTOR` e estejam vinculadas ao `healthUnitId` do médico logado. Tentar acessar ou alterar um ticket de outro posto retorna `403`.

### `GET /tickets/doctor/today`

Lista as fichas do dia do posto do médico logado, ordenadas por `ticketNumber`.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Fluxo interno:**

1. Busca `healthUnitId` do médico via `GET /users/me`
2. Busca tickets do dia (`createdAt` entre meia-noite UTC de hoje e meia-noite UTC de amanhã) filtrados por `healthUnitId`
3. Inclui dados do paciente (`queueEntry.user`) e horário de chegada na fila (`queueEntry.createdAt`)

**Resposta `200`:**

```json
[
  {
    "id": "uuid",
    "ticketNumber": 1,
    "status": "WAITING",
    "createdAt": "...",
    "queueEntry": {
      "id": "uuid",
      "createdAt": "...",
      "user": {
        "id": "uuid",
        "name": "João Silva",
        "cpf": "04512345678"
      }
    }
  }
]
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token ausente ou inválido |
| `403` | Usuário não é DOCTOR |

> **Nota de fuso horário:** a janela "hoje" é calculada em UTC, não em UTC-3 (horário de Brasília). Um ticket criado após 21h no horário local já pode contar como "amanhã" em UTC. Aceitável para o estágio atual do projeto, mas documentado aqui como dívida técnica conhecida.

---

### `PATCH /tickets/:id/start`

Inicia o atendimento de um ticket. Restrito a `DOCTOR`.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Fluxo interno:**

1. Busca o médico logado e o ticket pelo `id`
2. Verifica se `ticket.healthUnitId === doctor.healthUnitId`
3. Verifica se `ticket.status === WAITING` — caso contrário, rejeita
4. Atualiza o ticket para `IN_PROGRESS`, retornando o ticket com `queueEntry.user` incluso

**Resposta `200`:**

```json
{
  "id": "uuid",
  "ticketNumber": 1,
  "status": "IN_PROGRESS",
  "queueEntry": {
    "id": "uuid",
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "cpf": "04512345678"
    }
  }
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token ausente ou inválido |
| `403` | Usuário não é DOCTOR, ou o ticket não pertence ao posto do médico |
| `404` | Médico ou ticket não encontrado |
| `409` | Ticket não está em `WAITING` (já iniciado ou concluído) |

---

### `PATCH /tickets/:id/complete`

Conclui o atendimento de um ticket. Restrito a `DOCTOR`.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Fluxo interno:**

1. Busca o médico logado e o ticket pelo `id`
2. Verifica se `ticket.healthUnitId === doctor.healthUnitId`
3. Verifica se `ticket.status === IN_PROGRESS` — caso contrário, rejeita
4. Dentro de uma `$transaction`, atualiza o `Ticket` para `DONE` **e** a `QueueEntry` vinculada para `DONE`, atomicamente
5. Retorna o ticket com `queueEntry.user` incluso

**Resposta `200`:**

```json
{
  "id": "uuid",
  "ticketNumber": 1,
  "status": "DONE",
  "queueEntry": {
    "id": "uuid",
    "status": "DONE",
    "user": {
      "id": "uuid",
      "name": "João Silva",
      "cpf": "04512345678"
    }
  }
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token ausente ou inválido |
| `403` | Usuário não é DOCTOR, ou o ticket não pertence ao posto do médico |
| `404` | Médico ou ticket não encontrado |
| `409` | Ticket não está em `IN_PROGRESS` (ainda aguardando ou já concluído) |

**Por que `$transaction`?**

O `Ticket` e a `QueueEntry` vinculada precisam mudar de status juntos. Sem atomicidade, uma falha entre as duas operações deixaria o sistema em estado inconsistente (ex: ticket `DONE` mas paciente ainda marcado como `CALLED` na fila). A transação garante que ambas as atualizações aconteçam, ou nenhuma aconteça.

---

## Rotas — Fila (compartilhadas)

### `GET /queue/:unitId/entries`

Retorna a fila do dia com todos os pacientes aguardando. Restrito a `RECEPTIONIST`.

Usado pelo painel da recepcionista no carregamento inicial da página. O Socket.io mantém atualizado em tempo real após o carregamento.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `200`:**

```json
{
  "id": "uuid",
  "status": "OPEN",
  "ticketCount": 5,
  "entries": [
    {
      "id": "uuid",
      "position": 1,
      "status": "WAITING",
      "userId": "uuid"
    }
  ]
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `404` | Nenhuma fila aberta hoje para este posto |

---

### `GET /queue/my-entry`

Retorna a entrada ativa do paciente logado em qualquer fila. Retorna `null` se não estiver em nenhuma fila.

Usado pelo frontend para restaurar o estado da fila em qualquer navegador ou dispositivo quando o `sessionStorage` estiver vazio.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `200`:**

```json
{
  "id": "uuid",
  "position": 2,
  "status": "WAITING",
  "queueId": "uuid",
  "userId": "uuid",
  "queue": {
    "id": "uuid",
    "healthUnitId": "uuid",
    "status": "OPEN",
    "ticketCount": 3
  }
}
```

---

## Redirecionar por role após login

Após autenticação, o frontend redireciona automaticamente para o painel correto:

| Role           | Rota             |
| -------------- | ---------------- |
| `PATIENT`      | `/fila`          |
| `RECEPTIONIST` | `/recepcionista` |
| `DOCTOR`       | `/medico`        |
| `ADMIN`        | `/admin`         |

---

## Testes de integração

Arquivo: `src/modules/tickets/tickets.integration.spec.ts`. Segue o mesmo padrão dos testes de `queue.integration.spec.ts` (Jest + Supertest, banco de teste real, `cleanDatabase` no `beforeEach`/`afterAll`).

**Setup do `beforeEach`:**

1. Registra um paciente
2. Registra um médico
3. Promove o paciente temporariamente para `ADMIN` e cria um `HealthUnit`
4. Vincula o médico ao posto (`role: DOCTOR`, `healthUnitId`)
5. Promove o paciente temporariamente para `RECEPTIONIST`, vinculado ao mesmo posto, para chamar o próximo da fila e gerar um `Ticket`
6. Devolve o paciente para `role: PATIENT` sem `healthUnitId`

Esse setup multi-papel no mesmo usuário existe porque o fluxo real depende de três roles distintos (`PATIENT` → `ADMIN` → `RECEPTIONIST`) interagindo na mesma fila antes do médico entrar em ação.

**Cobertura:**

| Endpoint                      | Cenários testados                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /tickets/doctor/today`   | Lista fichas do posto · `401` sem token · `403` para PATIENT                                                                                         |
| `PATCH /tickets/:id/start`    | Muda para `IN_PROGRESS` · `409` ao iniciar ticket já `IN_PROGRESS` · `401` sem token · `403` para PATIENT                                            |
| `PATCH /tickets/:id/complete` | Muda para `DONE` · `409` ao concluir ticket `WAITING` · `409` ao tentar voltar para `IN_PROGRESS` após `DONE` · `401` sem token · `403` para PATIENT |

**Bug encontrado e corrigido durante os testes:**

O teste `deve retornar 409 ao tentar concluir ticket WAITING` expôs que o `PatchCompleteTreatmentUseCase` não validava o status do ticket antes de concluir — um ticket `WAITING` podia pular direto para `DONE` sem nunca passar por `IN_PROGRESS`. Corrigido adicionando a guarda de status (`ConflictException` quando `status !== IN_PROGRESS`), espelhando a mesma validação já existente no `start`.

---

## Rate Limiting em ambiente de teste

O `ThrottlerModule` (ver `QUEUE.md` para a configuração completa de rate limiting) usa limites agressivos em produção (`60/min` global, `3/min` no `enter`). Esses limites quebravam os testes de integração, que disparam múltiplas requests em sequência rápida dentro do mesmo `beforeEach`.

**Solução:** os limites são condicionados ao `NODE_ENV`:

```typescript
// app.module.ts
ThrottlerModule.forRoot({
  throttlers: [
    {
      name: 'global',
      ttl: 60000,
      limit: process.env.NODE_ENV === 'test' ? 1000 : 60,
    },
  ],
}),
```

```typescript
// queue.controller.ts
@Throttle({
  global: {
    ttl: 60000,
    limit: process.env.NODE_ENV === 'test' ? 1000 : 3,
  },
})
```

Em qualquer ambiente diferente de `test` (`development`, `staging`, `production`), os limites originais permanecem intactos. Apenas o `NODE_ENV=test` (definido no `.env.test`) eleva o limite para `1000`, neutralizando o throttling sem remover a lógica.

---

## Execução dos testes

Os testes de integração compartilham um banco real (`filasaude_db_test`), então **precisam rodar sequencialmente**, não em paralelo — caso contrário, suites diferentes chamando `cleanDatabase()` ao mesmo tempo causam `Unique constraint` e `Foreign key` errors entre si.

```json
// package.json
"jest": {
  "maxWorkers": 1
}
```

Alternativa via linha de comando sem alterar a config:

```bash
npm run test -- --runInBand
```

**Aviso conhecido (não bloqueante):**

```
Jest did not exit one second after the test run has completed.
```

Indica uma conexão assíncrona (provavelmente Redis/BullMQ) não encerrada explicitamente ao final da suíte. Não afeta o resultado dos testes — investigação e correção planejadas para a Sprint 4.
