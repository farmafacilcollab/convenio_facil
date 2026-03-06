# Painel Administrativo

O painel administrativo fornece controle total sobre o sistema. Apenas usuários com perfil **admin** têm acesso.

---

## Dashboard

Ao fazer login como **admin**, você é direcionado ao Dashboard (`/admin/dashboard`).

### Indicadores

- **Total de Vendas (Mês)**: quantidade de vendas de todas as lojas no mês.
- **Valor Total (Mês)**: soma de todas as vendas do mês.
- **Convênios Ativos**: quantidade de convênios cadastrados e ativos.
- **Conveniados Ativos**: quantidade de conveniados cadastrados.
- **Vendas Recentes**: lista das últimas vendas de todas as lojas.
- **Ranking de Lojas**: lojas ordenadas por valor total no mês.

---

## Gerenciar Convênios

Acesse **Convênios** no menu lateral.

### Listar Convênios

- Visualize todos os convênios cadastrados.
- Use a barra de busca para filtrar por **razão social** ou **CNPJ**.

### Cadastrar Novo Convênio

1. Clique em **Novo Convênio**.
2. Preencha:
   - **Razão Social** (obrigatório)
   - **CNPJ** (obrigatório, formato XX.XXX.XXX/XXXX-XX)
3. Clique em **Salvar**.

### Editar Convênio

1. Clique no ícone de edição ao lado do convênio.
2. Altere os campos desejados.
3. Clique em **Salvar**.

### Excluir Convênio

1. Clique no ícone de exclusão.
2. Confirme a exclusão na caixa de diálogo.

> **Atenção**: Não é possível excluir convênios que possuem vendas vinculadas.

---

## Gerenciar Conveniados

Acesse **Conveniados** no menu lateral.

### Listar Conveniados

- Visualize todos os conveniados cadastrados.
- Use a barra de busca para filtrar por **nome** ou **CPF**.
- Cada conveniado está vinculado a um **convênio**.

### Cadastrar Novo Conveniado

1. Clique em **Novo Conveniado**.
2. Preencha:
   - **Nome Completo** (obrigatório)
   - **CPF** (obrigatório, formato XXX.XXX.XXX-XX)
   - **Convênio** (selecione na lista)
3. Clique em **Salvar**.

### Editar Conveniado

1. Clique no ícone de edição.
2. Altere os campos desejados.
3. Clique em **Salvar**.

### Excluir Conveniado

1. Clique no ícone de exclusão.
2. Confirme a exclusão.

> **Atenção**: Não é possível excluir conveniados que possuem vendas vinculadas.

---

## Gerenciar Lojas

Acesse **Lojas** no menu lateral.

- Visualize todas as lojas cadastradas.
- Cada loja exibe: nome, CNPJ, slug, e-mail e status.
- Clique em uma loja para ver os detalhes e o histórico de vendas.

---

## Gerenciar Usuários

Acesse **Usuários** no menu lateral.

### Listar Usuários

- Visualize todos os usuários do sistema (lojas e admins).
- Cada usuário exibe: e-mail, perfil (role) e loja vinculada.

### Redefinir Senha

1. Localize o usuário na lista.
2. Clique em **Redefinir Senha**.
3. O sistema gera uma nova senha e a exibe na tela.
4. Anote a senha e informe ao usuário.

---

## Navegação do Admin

| Menu | Descrição |
|------|-----------|
| Dashboard | Visão geral com indicadores e rankings |
| Convênios | Cadastro e gestão de convênios |
| Conveniados | Cadastro e gestão de conveniados |
| Lojas | Visualização das lojas cadastradas |
| Usuários | Gestão de usuários e senhas |
| Exportação | Central de exportação de dados |
| Sair | Encerrar sessão |
