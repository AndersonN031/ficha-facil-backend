## Notificações com BullMQ

Quando a recepcionista chama o próximo, a notificação para o paciente é processada via BullMQ em vez de emitir o Socket.io diretamente. Isso garante entrega confiável com retry automático.

**Fluxo:**

```
CallNextUseCase
  → enfileira job no BullMQ (notificationsQueue)
  → worker processa o job
  → emite ticket:called via Socket.io para o paciente
  → job marcado como completed
```

**Configuração do job:**

```typescript
attempts: 3         // tenta 3 vezes em caso de falha
backoff: {
  type: 'exponential',
  delay: 2000       // 2s, 4s, 8s entre tentativas
}
removeOnComplete: true
removeOnFail: true
```

**Ciclo de vida do job no Redis:**

```
added → waiting → active → completed
```

Em caso de falha:

```
added → waiting → active → failed → waiting (retry 1) → active → failed...
```

**Por que BullMQ em vez de emitir Socket.io diretamente?**

O Socket.io é um canal em tempo real mas não garante entrega — se o paciente estiver com conexão instável no momento da chamada, o evento é perdido. O BullMQ persiste o job no Redis e tenta novamente automaticamente, garantindo que a notificação chegue mesmo em condições adversas de rede.

**Estrutura do módulo:**

```
NotificationsModule
  ├── notifications.service.ts    → enfileira jobs (notifyPatientCalled)
  ├── notifications.processor.ts  → consome a fila e emite Socket.io
  └── notifications.module.ts     → registra a fila 'notifications' no BullMQ
```

O `NotificationsProcessor` roda como um worker separado (`@Processor('notifications')` extendendo `WorkerHost`), fora do fluxo principal da request — a recepcionista recebe a resposta do `call-next` sem esperar a notificação ser entregue.

---
