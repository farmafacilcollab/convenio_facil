# Acesso ao Sistema

## URL de Acesso

Após o deploy na Vercel, o sistema estará acessível pela URL configurada (ex.: `https://convenio-facil.vercel.app`).

Para desenvolvimento local:

```
http://localhost:3000
```

---

## Credenciais das Lojas

Todas as lojas possuem a **mesma senha padrão**: `FarmaFacil@2026`

| Loja | E-mail | Slug |
|------|--------|------|
| DROGARIA JR LTDA ME | farmafacil.loja01@hotmail.com | loja01 |
| DROGARIA AR LTDA | farmafacil.loja02@hotmail.com | loja02 |
| DROGARIA JK LTDA ME | farmafacil.loja03@hotmail.com | loja03 |
| DROGARIA DR LTDA ME | farmafacil.loja06@hotmail.com | loja04 |
| DROGARIA JM LTDA | farmafacil.loja05@hotmail.com | loja05 |

## Credenciais do Administrador

| Campo | Valor |
|-------|-------|
| E-mail | rh.farmafácil@gmail.com |
| Senha | FarmaFacilAdmin@2026 |

---

## Fluxo de Login

1. Acesse a URL do sistema.
2. Você será redirecionado para a tela de login (`/login`).
3. Digite o **e-mail** e a **senha**.
4. Clique em **Entrar**.
5. O sistema identifica automaticamente o perfil:
   - **Loja** → redireciona para `/store/dashboard`
   - **Admin** → redireciona para `/admin/dashboard`

## Logout

- **Loja**: clique no botão **Sair** no canto superior direito.
- **Admin**: clique no botão **Sair** na barra lateral (desktop) ou no menu hamburger (mobile).

---

## Redefinição de Senha

Caso esqueça a senha:

1. Um administrador deve acessar **Usuários** no painel admin.
2. Localizar o usuário e clicar em **Redefinir Senha**.
3. O sistema gera uma nova senha no formato `FarmaFacil@{ANO_ATUAL}`.
4. A nova senha é exibida na tela. Anote e informe ao usuário.
