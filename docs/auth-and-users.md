# Autenticação e Usuários

Documentação do módulo de autenticação e gerenciamento de perfil do FilaSaúde.

---

## Visão geral

O sistema utiliza autenticação via **JWT** com dois tokens:

- **Access Token** — vida curta (30 minutos), usado em toda requisição autenticada no header `Authorization`
- **Refresh Token** — vida longa (7 dias), usado exclusivamente para gerar um novo par de tokens sem exigir novo login

Cada token gerado possui um `jwtid` único (UUID), o que garante que dois tokens com o mesmo payload nunca sejam idênticos — evitando colisão no banco mesmo em logins simultâneos.

---

## Papéis (RBAC)

Todo usuário possui um `role` que define o que ele pode acessar no sistema.

| Role           | Descrição                              |
| -------------- | -------------------------------------- |
| `PATIENT`      | Atribuído automaticamente no cadastro  |
| `RECEPTIONIST` | Atribuído pelo Admin                   |
| `DOCTOR`       | Atribuído pelo Admin                   |
| `ADMIN`        | Atribuído manualmente via banco (seed) |

A autorização é aplicada via `RolesGuard` + decorator `@Roles()`. Rotas sem `@Roles()` são acessíveis por qualquer usuário autenticado. Rotas com `@Public()` não exigem autenticação.

---

## Rotas

### Autenticação

#### `POST /auth/register`

Cria uma nova conta. Qualquer pessoa pode acessar.

**Body:**

```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "04512345678",
  "phone": "81999999999",
  "password": "123456"
}
```

> `phone` é opcional. CPF deve conter exatamente 11 dígitos numéricos, sem pontuação.

**Resposta `201`:**

```json
{
  "user": {
    "id": "uuid",
    "name": "João Silva",
    "email": "joao@email.com",
    "cpf": "04512345678",
    "phone": "81999999999",
    "role": "PATIENT",
    "active": true,
    "createdAt": "2026-05-18T00:00:00.000Z",
    "updatedAt": "2026-05-18T00:00:00.000Z"
  },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400` | Payload inválido (campo faltando, CPF com formato errado) |
| `409` | E-mail ou CPF já cadastrado |

---

#### `POST /auth/login`

Autentica um usuário existente. Qualquer pessoa pode acessar.

**Body:**

```json
{
  "email": "joao@email.com",
  "password": "123456"
}
```

**Resposta `200`:**

```json
{
  "user": { ... },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | E-mail não encontrado, senha incorreta ou conta desativada |

---

#### `POST /auth/refresh`

Gera um novo par de tokens a partir de um refresh token válido. O token antigo é revogado após o uso (**Refresh Token Rotation**). Qualquer pessoa pode acessar.

**Body:**

```json
{
  "refreshToken": "eyJ..."
}
```

**Resposta `200`:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token inválido, já utilizado ou expirado |

---

#### `POST /auth/logout`

Revoga todos os refresh tokens ativos do usuário. Requer autenticação.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `200`:**

```json
{
  "message": "Logout realizado com sucesso"
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token ausente ou inválido |

---

### Perfil do usuário

#### `GET /users/me`

Retorna os dados do usuário autenticado. Requer autenticação.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Resposta `200`:**

```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@email.com",
  "cpf": "04512345678",
  "phone": "81999999999",
  "role": "PATIENT",
  "active": true,
  "createdAt": "2026-05-18T00:00:00.000Z",
  "updatedAt": "2026-05-18T00:00:00.000Z"
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `401` | Token ausente ou inválido |
| `404` | Usuário não encontrado |

---

#### `PUT /users/me`

Atualiza nome, telefone ou senha do usuário autenticado. Requer autenticação. Todos os campos são opcionais — envie apenas o que deseja atualizar.

**Header:**

```
Authorization: Bearer <accessToken>
```

**Body:**

```json
{
  "name": "João Atualizado",
  "phone": "81988888888",
  "password": "novaSenha123"
}
```

**Resposta `200`:**

```json
{
  "id": "uuid",
  "name": "João Atualizado",
  ...
}
```

**Erros possíveis:**
| Status | Motivo |
|--------|--------|
| `400` | Campo com formato inválido |
| `401` | Token ausente ou inválido |
| `404` | Usuário não encontrado |

---

## Segurança

**Senhas** são armazenadas com hash `bcrypt` (salt rounds: 10). A senha nunca é retornada em nenhuma resposta da API.

**Refresh Token Rotation** — cada uso do refresh token gera um novo par e invalida o anterior. Se um token já utilizado for apresentado novamente, a requisição é rejeitada com `401`.

**Logout real** — o logout revoga todos os refresh tokens ativos do usuário no banco, invalidando todas as sessões independente do tempo de expiração.

**Rotas públicas** — marcadas com `@Public()`, não exigem token. São elas: `register`, `login` e `refresh`.

**Rotas protegidas** — todas as demais exigem `Authorization: Bearer <token>` válido. O `JwtGuard` é aplicado globalmente.

---

## Schema do banco

```prisma
enum Role {
  PATIENT
  RECEPTIONIST
  DOCTOR
  ADMIN
}

model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  cpf           String         @unique
  phone         String?
  password      String
  role          Role           @default(PATIENT)
  active        Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]

  @@map("users")
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  revoked   Boolean  @default(false)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("refresh_tokens")
}
```

---

## Decisões técnicas

**Por que access token de 30 minutos?**
É o tempo padrão do mercado. Curto o suficiente para limitar o impacto de um token comprometido, longo o suficiente para não impactar a experiência — o frontend renova automaticamente via refresh token sem que o usuário perceba.

**Por que salvar o refresh token no banco?**
JWT é stateless por natureza — uma vez emitido, não tem como invalidá-lo antes de expirar. Salvando no banco ganhamos controle real: logout funciona de verdade, tokens roubados podem ser revogados e sessões múltiplas podem ser gerenciadas.

**Por que `active` em vez de deletar o usuário?**
Deleção física perde histórico e pode quebrar integridade referencial com outras tabelas futuras (fichas, atendimentos). Desativar a conta preserva o histórico e permite reativação.

**Por que CPF sem formatação?**
Guardar `04512345678` em vez de `045.123.456-78` evita inconsistência em buscas e validações. A formatação é responsabilidade do frontend.
