# Central de Exportação

A Central de Exportação permite ao administrador gerar relatórios e baixar dados do sistema em diferentes formatos.

Acesse via menu lateral: **Exportação** (`/admin/exports`).

---

## Formatos Disponíveis

| Formato | Extensão | Descrição |
|---------|----------|-----------|
| PDF | `.pdf` | Relatório formatado para impressão |
| Excel | `.xlsx` | Planilha com dados tabulares |
| Imagens ZIP | `.zip` | Pacote com fotos das vendas |

---

## Exportar Vendas em PDF

1. Na Central de Exportação, selecione **PDF**.
2. Configure os filtros:
   - **Período**: data inicial e final.
   - **Loja**: todas ou uma loja específica.
   - **Convênio**: todos ou um convênio específico.
3. Clique em **Gerar PDF**.
4. O arquivo será gerado e o download iniciará automaticamente.

### Conteúdo do PDF

- Cabeçalho com nome da empresa e período.
- Tabela com: data, loja, convênio, conveniado, valor e descrição.
- Totalizador ao final.

---

## Exportar Vendas em Excel (XLSX)

1. Selecione **Excel**.
2. Configure os mesmos filtros disponíveis para PDF.
3. Clique em **Gerar Excel**.
4. O arquivo `.xlsx` será baixado.

### Conteúdo da Planilha

- Uma linha por venda.
- Colunas: Data, Loja, CNPJ Loja, Convênio, CNPJ Convênio, Conveniado, CPF, Valor, Descrição.
- Formatação numérica aplicada à coluna de valor.

---

## Exportar Fotos em ZIP

1. Selecione **Imagens ZIP**.
2. Configure os filtros desejados.
3. Clique em **Gerar ZIP**.
4. O sistema empacota todas as fotos das vendas filtradas em um arquivo `.zip`.
5. O download inicia automaticamente.

### Estrutura do ZIP

```
fotos_vendas/
├── loja01/
│   ├── venda_001_foto1.jpg
│   ├── venda_001_foto2.jpg
│   └── venda_002_foto1.jpg
├── loja02/
│   └── venda_003_foto1.jpg
└── ...
```

---

## Dicas

- Use filtros de **período** para limitar o volume de dados e acelerar a geração.
- Para relatórios mensais, selecione o primeiro e último dia do mês.
- A exportação ZIP pode demorar se houver muitas fotos — aguarde o processamento.
