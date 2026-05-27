# Fila Virtual e Postos de Saúde

Documentação do módulo de fila virtual, postos de saúde, cache e tempo real do FilaSaúde.

---

## Visão geral

O sistema de fila virtual funciona em três camadas:

```
HealthUnit (Posto de saúde)
  └── Queue (Fila do dia)
        ├── QueueEntry (Paciente João — posição 1 — WAITING)
        ├── QueueEntry (Paciente Maria — posição 2 — CALLED)
        └── QueueEntry (Paciente Pedro — posição 3 — WAITING)
```

Toda manhã, quando o primeiro paciente tenta entrar, o sistema cria automaticamente uma `Queue` para aquele dia — sem precisar de intervenção manual do admin.

---

## Schema do banco

```prisma
enum QueueStatus {
  OPEN
  CLOSED
  FULL
}

enum QueueEntryStatus {
  WAITING
  CALLED
  DONE
  CANCELLED
}

model HealthUnit {
  id            String   @id @default(uuid())
  name          String
  address       String
  city          String
  state         String   @db.Char(2)
  cnes          String?  @unique
  maxTicketsDay Int      @default(20)
  openTime      String   @default("07:00")
  closeTime     String   @default("11:00")
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  queues        Queue[]

  @@map("health_units")
}

model Queue {
  id           String      @id @default(uuid())
  date         DateTime    @db.Date
  status       QueueStatus @default(OPEN)
  ticketCount  Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  healthUnitId String
  healthUnit   HealthUnit  @relation(fields: [healthUnitId], references: [id])
  entries      QueueEntry[]

  @@unique([healthUnitId, date])
  @@map("queues")
}

model QueueEntry {
  id        String           @id @default(uuid())
  position  Int
  status    QueueEntryStatus @default(WAITING)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt
  queueId   String
  queue     Queue            @relation(fields: [queueId], references: [id])
  userId    String
  user      User             @relation(fields: [userId], references: [id])

  @@unique([queueId, userId])
  @@unique([queueId, position])
  @@map("queue_entries")
}
```

**Decisões de schema:**

`@@unique([healthUnitId, date])` — um posto só pode ter uma fila por dia. Tentativa de criar duplicata é rejeitada pelo banco.

`@@unique([queueId, userId])` — um paciente só pode ter uma entrada por fila. Proteção no nível do banco além da lógica de negócio.

`@@unique([queueId, position])` — duas pessoas não podem ter a mesma posição na mesma fila.

`ticketCount` — contador incremental na fila. Evita fazer `COUNT(*)` nas entries a cada entrada, reduzindo carga no banco.

`openTime` e `closeTime` como `String` — horários recorrentes não têm data específica. `"07:00"` é mais simples e direto que um `DateTime`.

`cnes` — Cadastro Nacional de Estabelecimentos de Saúde. Identificador único nacional de cada posto, permite futura integração com sistemas do SUS.

---

## Postos de Saúde

### Rotas públicas (sem autenticação)

#### `GET /health-units`

Lista todos os postos ativos. Suporta filtro por cidade e estado.

**Query params:**

```
?city=Caruaru&state=PE
```

**Resposta `200`:**

```json
[
  {
    "id": "uuid",
    "name": "UBS Vila União",
    "address": "Rua das Flores, 123",
    "city": "Caruaru",
    "state": "PE",
    "maxTicketsDay": 30,
    "openTime": "07:00",
    "closeTime": "11:00",
    "active": true
  }
]
```

---

#### `GET /health-units/:id`

Retorna detalhes de um posto específico.

---

### Rotas restritas ao ADMIN

#### `POST /health-units`

Cria um novo posto.

**Body:**

```json
{
  "name": "UBS Vila União",
  "address": "Rua das Flores, 123",
  "city": "Caruaru",
  "state": "PE",
  "cnes": "1234567",
  "maxTicketsDay": 30,
  "openTime": "07:00",
  "closeTime": "11:00"
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400` | Payload inválido |
| `403` | Usuário não é ADMIN |
| `409` | CNES já cadastrado |

---

#### `PUT /health-units/:id`

Atualiza dados do posto. Todos os campos são opcionais.

---

#### `DELETE /health-units/:id`

Desativa o posto (soft delete). O registro permanece no banco com `active: false`.

---

## Fila Virtual

### `GET /queue/:unitId`

Retorna a fila atual do posto. Rota pública, com cache Redis de 5 segundos.

**Resposta `200`:**

```json
{
  "id": "uuid",
  "date": "2026-05-25",
  "status": "OPEN",
  "ticketCount": 5,
  "healthUnitId": "uuid"
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `404` | Nenhuma fila aberta hoje para este posto |

---

### `POST /queue/:unitId/enter`

Paciente entra na fila virtual. Requer autenticação. Rate limit: 3 requests/minuto por IP.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `201`:**

```json
{
  "entry": {
    "id": "uuid",
    "position": 3,
    "status": "WAITING"
  },
  "position": 3,
  "message": "Você entrou na fila com sucesso! Sua posição é 3"
}
```

**Validações realizadas (nessa ordem):**

1. Idempotência — bloqueia request duplicada via Redis
2. Posto existe e está ativo
3. Horário de funcionamento
4. Fila está aberta
5. Fichas disponíveis
6. Status da entrada existente (WAITING → 409, CALLED → 409, DONE → 400, CANCELLED → permite entrar de novo)

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400` | Posto inativo, fora do horário, fichas esgotadas ou já foi atendido hoje |
| `401` | Token ausente ou inválido |
| `409` | Já está na fila, já foi chamado ou request duplicada |
| `429` | Rate limit excedido |

---

### `DELETE /queue/:entryId`

Cancela a entrada do paciente na fila. Requer autenticação. O paciente só pode cancelar a própria entrada.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `200`:**

```json
{
  "id": "uuid",
  "status": "CANCELLED"
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400` | Entrada não está mais em WAITING |
| `401` | Token ausente ou inválido |
| `403` | Tentando cancelar entrada de outro paciente |
| `404` | Entrada não encontrada |

---

## Idempotência

A entrada na fila é protegida contra requests duplicadas via Redis. Antes de qualquer processamento, o sistema tenta gravar uma chave única:

```
queue:enter:{userId}:{healthUnitId}:{data}
```

A operação `SETNX` (Set if Not Exists) do Redis é atômica — garante que só a primeira request é processada, mesmo em duplo clique ou reconexão.

**TTL da chave: 30 segundos**

Se ocorrer erro durante o processamento, a chave é deletada imediatamente — permitindo nova tentativa. Se o paciente cancelar, a chave também é deletada — permitindo entrar de novo.

A chave só permanece os 30 segundos completos quando a entrada for bem sucedida, bloqueando duplo clique nesse intervalo.

---

## Concorrência

Idempotência e concorrência são proteções diferentes que se complementam:

|                    | Idempotência                         | Concorrência                             |
| ------------------ | ------------------------------------ | ---------------------------------------- |
| **Protege contra** | Requests duplicadas do mesmo cliente | Múltiplas operações simultâneas no banco |
| **Camada**         | Entrada da requisição (Redis)        | Escrita no banco (Prisma + PostgreSQL)   |

**Como tratamos concorrência:**

O `$transaction` no `createEntry` garante que a criação da `QueueEntry` e o incremento do `ticketCount` acontecem atomicamente:

```typescript
await this.prisma.$transaction([
  this.prisma.queueEntry.create({ ... }),
  this.prisma.queue.update({
    data: { ticketCount: { increment: 1 } }
  }),
]);
```

O `increment` é atômico no PostgreSQL — dois incrementos simultâneos nunca produzem o mesmo valor. E o `@@unique([queueId, position])` garante que se dois chegarem na mesma posição, um recebe erro de constraint em vez de dados corrompidos.

---

## Cache com Redis

O endpoint `GET /queue/:unitId` usa cache Redis com TTL de 5 segundos.

**Fluxo:**

```
Request chega
  → Redis tem cache? → SIM → retorna do Redis (cache hit)
  → NÃO → busca no PostgreSQL → salva no Redis com TTL 5s → retorna (cache miss)
```

**Por que 5 segundos?**

A fila muda com frequência — a cada entrada ou cancelamento. Cache longo mostraria dados desatualizados. Com 5 segundos o pior caso é o paciente ver a fila com 5 segundos de atraso, aceitável para esse contexto.

Quando a recepcionista chamar o próximo (Sprint 3), o cache será invalidado manualmente — sem esperar o TTL expirar.

---

## Tempo real com Socket.io

O Gateway Socket.io organiza os clientes em **rooms** por posto. Cada `healthUnitId` tem sua própria room — eventos de um posto só chegam para quem está conectado naquele posto.

**Eventos:**

| Evento          | Direção            | Descrição                      |
| --------------- | ------------------ | ------------------------------ |
| `join:unit`     | cliente → servidor | entra na room do posto         |
| `leave:unit`    | cliente → servidor | sai da room do posto           |
| `joined`        | servidor → cliente | confirmação de entrada na room |
| `queue:update`  | servidor → cliente | fila atualizada                |
| `ticket:called` | servidor → cliente | paciente foi chamado           |

**Quando `queue:update` é emitido:**

- Paciente entra na fila
- Paciente cancela a entrada

O payload do `queue:update` contém todas as entries com status `WAITING` ordenadas por posição — o frontend filtra pelo `userId` para mostrar a posição do paciente logado.

---

## Rate Limiting

Configurado globalmente com `@nestjs/throttler`:

| Escopo                      | Limite                    |
| --------------------------- | ------------------------- |
| Global (todas as rotas)     | 60 requests/minuto por IP |
| `POST /queue/:unitId/enter` | 3 requests/minuto por IP  |

A rota de entrar na fila tem limite mais restritivo porque combinada com a idempotência Redis forma duas camadas de proteção contra abuso.
