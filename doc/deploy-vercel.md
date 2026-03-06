# Deploy na Vercel

Guia passo a passo para publicar o FarmaFácil Convênios na Vercel, configurar variáveis de ambiente, domínio personalizado e monitoramento.

---

## 1. Pré-requisitos

- Repositório no GitHub: `https://github.com/geriobrito/convenio_facil.git`
- Conta na [Vercel](https://vercel.com) (plano gratuito é suficiente)
- Projeto Supabase já configurado com migrations e seed executados (veja [integracao-supabase.md](integracao-supabase.md))

---

## 2. Importar o Projeto

1. Acesse [https://vercel.com/new](https://vercel.com/new).
2. Clique em **Import Git Repository**.
3. Conecte sua conta GitHub (se ainda não conectou).
4. Selecione o repositório **convenio_facil**.
5. A Vercel detecta automaticamente que é um projeto **Next.js**.

### Configurações de Build (padrão, não precisa alterar)

| Campo | Valor |
|-------|-------|
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

---

## 3. Variáveis de Ambiente

**Antes de clicar em Deploy**, configure as variáveis de ambiente:

1. Na tela de importação, expanda **Environment Variables**.
2. Adicione cada variável:

| Variável | Valor | Ambientes |
|----------|-------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://SEU_PROJETO.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua chave anon/public | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Sua chave service_role | Production, Preview, Development |

> **Onde encontrar**: Supabase → Settings → API (veja [integracao-supabase.md](integracao-supabase.md#2-obter-as-chaves-de-api))

3. Clique em **Deploy**.

### Editar variáveis após o deploy

1. No dashboard da Vercel, acesse o projeto.
2. Vá em **Settings → Environment Variables**.
3. Edite ou adicione variáveis.
4. **Importante**: após alterar variáveis, faça um **Redeploy** para que as mudanças tenham efeito.
   - Vá em **Deployments** → clique nos 3 pontos do último deploy → **Redeploy**.

---

## 4. Deploy Automático

Após a importação, a Vercel configura automaticamente:

- **Deploy em push**: cada `git push` na branch `master` gera um novo deploy em produção.
- **Preview Deploys**: cada Pull Request gera um URL temporário de preview.

### Fluxo de trabalho

```
git add -A
git commit -m "feat: nova funcionalidade"
git push origin master
```

A Vercel inicia o build automaticamente. Acompanhe em **Deployments** no dashboard.

---

## 5. Domínio Personalizado

### Adicionar domínio

1. No dashboard do projeto, vá em **Settings → Domains**.
2. Digite seu domínio (ex.: `convenios.farmafacil.com.br`).
3. Clique em **Add**.

### Configurar DNS

A Vercel exibirá os registros DNS necessários. Configure no painel do seu provedor de domínio:

**Opção A — Subdomínio (recomendado)**

| Tipo | Nome | Valor |
|------|------|-------|
| CNAME | `convenios` | `cname.vercel-dns.com` |

**Opção B — Domínio raiz (apex)**

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `76.76.21.21` |

> O certificado SSL é gerado automaticamente pela Vercel.

### Verificar

Após configurar o DNS, aguarde a propagação (pode levar até 48h, mas geralmente é rápido). O status será exibido em **Settings → Domains**.

---

## 6. Configurações Recomendadas

### Framework Next.js

A Vercel já otimiza automaticamente para Next.js, incluindo:

- **Server Components** renderizados no Edge/Serverless.
- **Server Actions** executadas como Serverless Functions.
- **Static Generation** para páginas que não dependem de dados dinâmicos.
- **Image Optimization** automática.

### Região das Functions

Para melhor latência com o Supabase (se o projeto está em São Paulo):

1. Vá em **Settings → Functions**.
2. Defina a região para **São Paulo (GRU)** — `gru1`.

### Headers de Segurança

O projeto já configura headers no `next.config.ts`:

| Header | Valor | Proteção |
|--------|-------|----------|
| X-Frame-Options | DENY | Contra clickjacking |
| X-Content-Type-Options | nosniff | Contra MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Controle de referrer |
| Permissions-Policy | camera=(), microphone=(), geolocation=() | Restringe APIs do browser |

---

## 7. Monitoramento

### Logs

- Acesse **Deployments → Deploy específico → Functions** para ver logs server-side.
- Use **Logs** no menu lateral para ver logs em tempo real.

### Analytics (opcional)

1. No dashboard, vá em **Analytics**.
2. Ative o **Web Analytics** da Vercel (plano gratuito inclui métricas básicas).
3. Não requer código adicional — a integração com Next.js é automática.

### Alertas de Build

A Vercel envia e-mails automáticos quando um build falha. Verifique o e-mail da sua conta Vercel.

---

## 8. Troubleshooting

### Build falhou

1. Acesse **Deployments** e clique no deploy que falhou.
2. Veja o **Build Log** para identificar o erro.
3. Erros comuns:
   - **Variáveis de ambiente faltando** → Verifique se as 3 variáveis estão configuradas.
   - **Erro de tipo TypeScript** → Rode `npm run build` localmente para replicar.
   - **Dependência ausente** → Verifique se o `package.json` está atualizado.

### Página retornando 500

1. Verifique os **Function Logs** (Deployments → Functions).
2. Causas comuns:
   - `SUPABASE_SERVICE_ROLE_KEY` ausente ou inválida.
   - Supabase fora do ar ou projeto pausado (plano gratuito pausa após inatividade).

### CORS ou problemas de imagem

1. Confirme que o `next.config.ts` tem o hostname correto do Supabase em `images.remotePatterns`.
2. Se trocou o projeto Supabase, atualize o hostname e faça redeploy.

### Performance lenta

1. Verifique se a **região das Functions** está próxima do Supabase.
2. Use o **Speed Insights** da Vercel para identificar gargalos.
3. Considere adicionar `revalidate` em páginas com dados que não mudam frequentemente.

---

## 9. Checklist de Deploy

- [ ] Migrations executadas no Supabase
- [ ] Seed rodado com sucesso
- [ ] 3 variáveis de ambiente configuradas na Vercel
- [ ] Build passando localmente (`npm run build`)
- [ ] Deploy realizado com sucesso
- [ ] Teste de login com credenciais de loja
- [ ] Teste de login com credenciais de admin
- [ ] Upload de foto funcional
- [ ] Exportação PDF/XLSX funcional
- [ ] Domínio personalizado configurado (se aplicável)
