# Integração com Supabase

Guia completo para configurar e manter a integração do FarmaFácil Convênios com o Supabase (autenticação, banco de dados, storage e RLS).

---

## 1. Criar o Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com) e faça login.
2. Clique em **New Project**.
3. Preencha:
   - **Name**: `convenio-facil` (ou nome de sua preferência)
   - **Database Password**: defina e guarde uma senha segura
   - **Region**: escolha a região mais próxima (ex.: South America - São Paulo)
4. Aguarde a criação do projeto.

---

## 2. Obter as Chaves de API

1. No painel do Supabase, acesse **Settings → API**.
2. Copie os seguintes valores:

| Variável | Onde encontrar | Uso |
|----------|----------------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** | Conexão com o projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **anon / public** (em API Keys) | Operações client-side (respeita RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** (em API Keys) | Operações server-side (bypass de RLS) |

3. Cole esses valores no arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

> **Segurança**: A `service_role` key tem acesso total ao banco. Nunca exponha no client-side.

---

## 3. Executar Migrations

As migrations criam toda a estrutura do banco. Execute-as no **SQL Editor** do Supabase, **na ordem correta**:

### Migration 1 — Tabelas (`001_create_tables.sql`)

Cria as 8 tabelas do sistema:

| Tabela | Descrição |
|--------|-----------|
| `stores` | Lojas da rede (nome, CNPJ, e-mail, slug) |
| `profiles` | Perfis de usuário (vincula auth.users ao sistema) |
| `convenios` | Empresas conveniadas (razão social, CNPJ) |
| `conveniados` | Funcionários conveniados (nome, CPF, vínculo com convênio) |
| `sales` | Registro de vendas (loja, convênio, conveniado, valor, parcelas) |
| `sale_images` | Fotos das vendas armazenadas no storage |
| `export_logs` | Log de exportações realizadas pelo admin |
| `notifications` | Notificações por usuário |

Também cria **7 índices** para performance em buscas por store_id, convenio_id, cpf, cnpj, etc.

**Como executar:**
1. No Supabase, acesse **SQL Editor → New Query**.
2. Copie e cole o conteúdo de `supabase/migrations/001_create_tables.sql`.
3. Clique em **Run**.

### Migration 2 — Políticas RLS (`002_rls_policies.sql`)

Ativa o Row Level Security (RLS) em todas as tabelas e define as políticas de acesso:

| Tabela | Leitura | Escrita |
|--------|---------|---------|
| `profiles` | Usuário lê o próprio; admin lê todos | — |
| `stores` | Loja lê a própria; admin lê todas | — |
| `convenios` | Todos autenticados lêem ativos | Admin insere/edita/exclui |
| `conveniados` | Todos autenticados lêem ativos | Admin insere/edita/exclui |
| `sales` | Loja lê as próprias; admin lê todas | Loja insere para sua loja; admin atualiza |
| `sale_images` | Loja lê as próprias; admin lê todas | Loja insere para suas vendas |
| `export_logs` | Apenas admin | Apenas admin |
| `notifications` | Usuário lê as próprias | Usuário atualiza as próprias |

Cria duas funções auxiliares:
- `get_user_role()` → retorna `'admin'` ou `'store'`
- `get_user_store_id()` → retorna o UUID da loja vinculada

**Execute** da mesma forma no SQL Editor.

### Migration 3 — Storage (`003_storage.sql`)

Configura o bucket de storage para fotos das vendas:

- **Bucket**: `requisitions` (privado)
- **Upload**: loja faz upload apenas na pasta do seu `store_id`
- **Leitura**: loja lê apenas sua pasta; admin lê tudo
- **Exclusão**: apenas admin pode excluir

**Execute** no SQL Editor.

---

## 4. Popular Dados Iniciais (Seed)

O seed cria os usuários e lojas iniciais:

```bash
npx tsx supabase/seed.ts
```

### O que o seed faz:

1. **Insere 5 lojas** na tabela `stores` (upsert por CNPJ, sem duplicatas).
2. **Cria 5 usuários auth** no Supabase Auth (um por loja).
3. **Cria 5 profiles** vinculando cada usuário à sua loja (role: `store`).
4. **Cria 1 usuário admin** + profile (role: `admin`).

> Se algum usuário já existir (mesmo e-mail), o seed trata o erro e segue adiante.

### Requisito

O seed usa a `SUPABASE_SERVICE_ROLE_KEY` para criar usuários via API admin do Supabase. Certifique-se de que o `.env.local` está configurado antes de rodar.

---

## 5. Arquitetura dos Clientes Supabase

O projeto usa 3 clientes Supabase distintos, cada um para um contexto:

### Client-side (`src/lib/supabase/client.ts`)

```
createBrowserClient (do @supabase/ssr)
```

- Usado em **Client Components** (React no browser).
- Utiliza a chave `anon` — todas as operações respeitam o RLS.
- Gerencia a sessão via cookies do browser.

### Server-side (`src/lib/supabase/server.ts`)

```
createServerClient (do @supabase/ssr)
```

- Usado em **Server Components**, **Server Actions** e **Route Handlers**.
- Lê cookies do Next.js para manter a sessão do usuário.
- Ainda respeita RLS — opera como o usuário autenticado.

### Admin (`src/lib/supabase/admin.ts`)

```
createClient (do @supabase/supabase-js)
```

- Usado apenas em operações administrativas no server (ex.: seed, redefinir senha).
- Usa `SUPABASE_SERVICE_ROLE_KEY` — **bypass de RLS**.
- Sessão desabilitada (auto-refresh off, sem persistência).

---

## 6. Middleware de Autenticação

O arquivo `src/lib/supabase/middleware.ts` (integrado ao `middleware.ts` na raiz) gerencia:

| Regra | Comportamento |
|-------|---------------|
| Rotas públicas (`/login`, `/`) | Acesso livre |
| Usuário não autenticado | Redireciona para `/login` |
| Usuário autenticado em `/login` | Redireciona para dashboard |
| Role `admin` acessando `/store/*` | Redireciona para `/admin/dashboard` |
| Role `store` acessando `/admin/*` | Redireciona para `/store/dashboard` |

O middleware consulta a tabela `profiles` para obter o role do usuário logado.

---

## 7. Configuração de Imagens

O `next.config.ts` está configurado para aceitar imagens do storage do Supabase:

```
hostname: zabfoldmhecxhbehqefa.supabase.co
pathname: /storage/v1/object/**
```

> Se você trocar o projeto Supabase, atualize o hostname no `next.config.ts`.

---

## 8. Manutenção e Troubleshooting

### RLS bloqueando operações

Se uma operação retorna lista vazia ou erro de permissão:

1. Verifique se o usuário está autenticado.
2. Confira em **Authentication → Users** se o usuário existe.
3. Confira em **Table Editor → profiles** se o profile tem o `role` e `store_id` corretos.
4. Teste a query no SQL Editor com `set role authenticated; set request.jwt.claim.sub = 'UUID_DO_USUARIO';`.

### Problemas no Storage

Se o upload de fotos falhar:

1. Verifique se o bucket `requisitions` existe em **Storage**.
2. Confira se as políticas de storage foram criadas (migration 003).
3. No browser, verifique o console para erros de CORS.

### Seed falhou

Se o seed reportar erros:

1. Verifique se as migrations foram executadas (tabelas devem existir).
2. Confira se as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão corretas no `.env.local`.
3. Rode novamente — o seed é idempotente (upsert + tratamento de duplicatas).

### Tipos TypeScript desatualizados

Se você alterar o schema do banco:

1. Regere os tipos com: `npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/types/database.types.ts`
2. Ou atualize manualmente o arquivo `database.types.ts`.
