# Feature

| React                     | Next.js                    |
| ------------------------- | -------------------------- |
| Biblioteca para UI        | Framework baseado em React |
| CSR por padrão            | SSR, SSG e ISR             |
| Componentes reutilizáveis | Roteamento automático      |
| Virtual DOM               | Melhor SEO                 |
| Hooks                     | Melhor performance         |

---

| Props           | State                |
| --------------- | -------------------- |
| Pai → Filho     | Dados internos       |
| Somente leitura | Atualiza a interface |

---

| Hook        | Uso                         |
| ----------- | --------------------------- |
| useState    | Armazenar estado            |
| useEffect   | Buscar API, eventos, timers |
| useMemo     | Memoriza cálculos           |
| useCallback | Memoriza funções            |
| useContext  | Compartilhar estado         |

---

| SSR                   | CSR                             |
| --------------------- | ------------------------------- |
| Renderiza no servidor | Renderiza no navegador          |
| Melhor SEO            | Mais usado em sistemas internos |
| Dados atualizados     | Mais interatividade             |

---

| Método | Função              |
| ------ | ------------------- |
| GET    | Buscar              |
| POST   | Criar               |
| PUT    | Atualizar           |
| PATCH  | Atualização parcial |
| DELETE | Excluir             |

---

## 🔐 Autenticação

```http
Authorization: Bearer TOKEN
```

---

| Organização | Objetivo                  |
| ----------- | ------------------------- |
| components/ | Componentes reutilizáveis |
| hooks/      | Hooks customizados        |
| services/   | APIs                      |
| contexts/   | Estado global             |
| utils/      | Funções auxiliares        |

---

| Performance  | Uso                       |
| ------------ | ------------------------- |
| next/image   | Otimização de imagens     |
| Lazy Loading | Carrega quando necessário |
| useMemo      | Evita recálculos          |
| useCallback  | Evita recriar funções     |
| Cache        | Menos requisições         |

---

| Responsividade | Acessibilidade        |
| -------------- | --------------------- |
| Flexbox        | HTML semântico        |
| Grid           | alt                   |
| Media Query    | aria-label            |
| Mobile First   | Navegação por teclado |

---

# 🎯 Perguntas rápidas

| Pergunta       | Resposta                                                   |
| -------------- | ---------------------------------------------------------- |
| React x Next?  | React é biblioteca. Next é framework com SSR, SEO e rotas. |
| Props x State? | Props vêm do pai. State pertence ao componente.            |
| useEffect?     | Buscar APIs, timers e eventos.                             |
| SSR?           | Renderiza no servidor.                                     |
| CSR?           | Renderiza no navegador.                                    |
| Por que Next?  | SEO, performance e roteamento.                             |

---

# 🧠 Se perguntarem...

| Pergunta            | Resposta curta                                               |
| ------------------- | ------------------------------------------------------------ |
| API lenta?          | Loading + Skeleton + tratar erros + avaliar cache/paginação. |
| Bug em produção?    | Replicar → Logs → Corrigir → Testar → Deploy → Documentar.   |
| Organização?        | Separar responsabilidades e reutilizar componentes.          |
| Task desconhecida?  | Documentação → IA → Implementar → Code Review.               |
| Trabalho em equipe? | Alinhamento + comunicação + seguir padrão do projeto.        |

---

# 💬 Frases boas

- "Primeiro procuro entender o contexto."
- "Busco seguir o padrão do projeto."
- "Prefiro componentes reutilizáveis."
- "Baixo acoplamento facilita manutenção."
- "Sempre valido antes do deploy."
- "Documentação e code review fazem parte do processo."
