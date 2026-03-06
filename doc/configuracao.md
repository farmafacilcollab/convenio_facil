# Configuração do Sistema

Guia para configuração do ambiente de desenvolvimento e deploy em produção.

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** ou **pnpm**
- Conta no **Supabase** (https://supabase.com)
- Conta na **Vercel** (para deploy) ou outro serviço de hospedagem

---

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

| Variável | Descrição | Onde encontrar |
|----------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço (server-side) | Supabase → Settings → API |

> **Importante**: Nunca exponha a `SUPABASE_SERVICE_ROLE_KEY` no cliente. Ela é usada apenas em Server Actions e Route Handlers.

---

## Configuração do Supabase

### 1. Criar Projeto

1. Acesse https://supabase.com e crie um novo projeto.
2. Anote a **URL** e as **chaves API**.

### 2. Executar Migrations

As migrations estão em `supabase/migrations/`. Execute-as no SQL Editor do Supabase:

1. Acesse **SQL Editor** no painel do Supabase.
2. Abra cada arquivo de migration em ordem cronológica.
3. Execute o SQL.

**Ordem das migrations:**

```
supabase/migrations/
├── 00001_initial_schema.sql     → Tabelas principais
├── 00002_rls_policies.sql       → Políticas de Row Level Security
├── 00003_storage.sql            → Buckets de storage para fotos
└── 00004_functions.sql          → Funções auxiliares
```

### 3. Executar Seed (Dados Iniciais)

O arquivo `supabase/seed.ts` cria os dados iniciais do sistema:

- 5 lojas com seus respectivos usuários
- 1 usuário administrador

Para executar:

```bash
npx tsx supabase/seed.ts
```

> O seed utiliza a `SUPABASE_SERVICE_ROLE_KEY` para criar usuários via API admin.

### 4. Configurar Storage

O bucket `sale-photos` é criado automaticamente pela migration de storage. Verifique se as políticas de acesso estão configuradas:

- Usuários autenticados podem fazer **upload**.
- Leitura pública para **download** das imagens.

---

## Instalação Local

```bash
# Clonar o repositório
git clone https://github.com/geriobrito/convenio_facil.git
cd convenio_facil

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Iniciar servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:3000`.

---

## Build de Produção

```bash
# Gerar build otimizado
npm run build

# Iniciar em modo produção
npm start
```

---

## Deploy na Vercel

1. Acesse https://vercel.com e importe o repositório do GitHub.
2. Configure as **variáveis de ambiente** no painel da Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Clique em **Deploy**.
4. A Vercel detectará automaticamente que é um projeto Next.js.

### Domínio Personalizado

1. Na Vercel, acesse **Settings → Domains**.
2. Adicione seu domínio personalizado.
3. Configure os registros DNS conforme instruído.

---

## Estrutura do Projeto

```
convenio_facil/
├── src/
│   ├── app/                  → Rotas (App Router)
│   │   ├── (auth)/           → Grupo de rotas autenticadas
│   │   │   ├── admin/        → Painel administrativo
│   │   │   └── store/        → Painel da loja
│   │   ├── login/            → Página de login
│   │   └── layout.tsx        → Layout raiz
│   ├── components/           → Componentes React
│   │   ├── forms/            → Formulários e wizard de venda
│   │   ├── ui/               → Componentes shadcn/ui
│   │   └── ...
│   ├── lib/                  → Utilitários e configurações
│   │   ├── supabase/         → Clientes Supabase (client/server)
│   │   └── utils.ts          → Funções auxiliares
│   └── types/                → Tipos TypeScript
├── supabase/
│   ├── migrations/           → Scripts SQL de migração
│   └── seed.ts               → Script de dados iniciais
├── doc/                      → Documentação do sistema
├── .env.example              → Template de variáveis de ambiente
└── package.json
```
