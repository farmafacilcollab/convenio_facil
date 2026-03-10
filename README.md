# FarmaFácil Convênios

Sistema de controle de vendas por convênio para a rede de farmácias FarmaFácil. Permite que cada loja registre vendas vinculadas a convênios e conveniados, com upload de fotos comprobatórias. O painel administrativo oferece gestão centralizada de convênios, conveniados, lojas, usuários e exportação de relatórios.

## Tecnologias

- **Next.js 16** (App Router, Server Actions, Turbopack)
- **TypeScript** (strict mode)
- **Tailwind CSS v4** + **shadcn/ui** (New York)
- **Supabase** (Auth, Database PostgreSQL, Storage, RLS)

## Funcionalidades

### Painel da Loja
- Dashboard com indicadores de vendas (mês/dia)
- Registro de vendas com assistente de 5 etapas (convênio → conveniado → detalhes → fotos → revisão)
- Histórico de vendas com filtros e detalhes

### Painel Administrativo
- Dashboard com indicadores globais e ranking de lojas
- CRUD de convênios e conveniados (identificação por CPF ou CNPJ)
- Importação em massa via CSV, XLSX ou TXT WebPharma (convênios e conveniados)
- Suporte a CNPJ para conveniados (empresas que compram pelo CNPJ)
- Gestão de lojas e usuários
- Central de exportação (PDF, XLSX, ZIP de fotos)

## Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais do Supabase

# Executar migrations no Supabase (SQL Editor)
# Arquivos em supabase/migrations/ (executar em ordem)

# Popular dados iniciais
npx tsx supabase/seed.ts

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`.

## Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

## Documentação

Manuais completos estão disponíveis na pasta [`doc/`](doc/README.md):

| Documento | Descrição |
|-----------|-----------|
| [Acesso ao Sistema](doc/acesso.md) | URLs, credenciais e fluxo de login |
| [Painel da Loja](doc/painel-loja.md) | Dashboard, registro e histórico de vendas |
| [Painel Administrativo](doc/painel-admin.md) | Gestão de convênios, conveniados, lojas e usuários |
| [Exportação](doc/exportacao.md) | Geração de PDF, XLSX e ZIP de fotos |
| [Importação CSV](doc/importacao-csv.md) | Formato e processo de importação em massa |
| [Configuração](doc/configuracao.md) | Setup do ambiente, Supabase e deploy |
| [Integração Supabase](doc/integracao-supabase.md) | Migrations, RLS, storage, clientes e troubleshooting |
| [Deploy Vercel](doc/deploy-vercel.md) | Publicação, domínio, variáveis e monitoramento |

## Deploy

O projeto está preparado para deploy na **Vercel**. Importe o repositório, configure as variáveis de ambiente e faça o deploy. Veja detalhes em [doc/deploy-vercel.md](doc/deploy-vercel.md).

## Licença

Projeto privado — uso restrito à rede FarmaFácil.
