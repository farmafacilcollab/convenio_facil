# Importação via CSV

O sistema permite importar **convênios** e **conveniados** em massa através de arquivos CSV. Essa funcionalidade está disponível no painel administrativo.

---

## Importar Convênios

Acesse **Convênios** → **Importar CSV**.

### Formato do Arquivo

- Separador: **ponto e vírgula** (`;`)
- Codificação: **UTF-8**
- Sem cabeçalho (header)

### Colunas

| Posição | Campo | Obrigatório | Formato |
|---------|-------|-------------|---------|
| 1 | Razão Social | Sim | Texto |
| 2 | CNPJ | Sim | XX.XXX.XXX/XXXX-XX |

### Exemplo de Arquivo

```csv
EMPRESA ALPHA LTDA;12.345.678/0001-90
EMPRESA BETA S.A.;98.765.432/0001-10
COOPERATIVA GAMMA;11.222.333/0001-44
```

### Processo

1. Clique em **Importar CSV**.
2. Selecione o arquivo `.csv` do seu computador.
3. O sistema valida cada linha:
   - Verifica se o CNPJ é válido.
   - Verifica se o CNPJ já está cadastrado (evita duplicatas).
4. Um resumo é exibido: total de linhas, importadas com sucesso, erros.
5. Linhas com erro são listadas para correção manual.

---

## Importar Conveniados

Acesse **Conveniados** → **Importar CSV**.

### Formato do Arquivo

- Separador: **ponto e vírgula** (`;`)
- Codificação: **UTF-8**
- Sem cabeçalho (header)

### Colunas

| Posição | Campo | Obrigatório | Formato |
|---------|-------|-------------|---------|
| 1 | Nome Completo | Sim | Texto |
| 2 | CPF | Sim | XXX.XXX.XXX-XX |
| 3 | CNPJ do Convênio | Sim | XX.XXX.XXX/XXXX-XX |

### Exemplo de Arquivo

```csv
João da Silva;123.456.789-00;12.345.678/0001-90
Maria Oliveira;987.654.321-00;98.765.432/0001-10
Pedro Santos;111.222.333-44;12.345.678/0001-90
```

### Processo

1. Clique em **Importar CSV**.
2. Selecione o arquivo `.csv`.
3. O sistema valida cada linha:
   - Verifica se o CPF é válido.
   - Verifica se o CNPJ do convênio existe no sistema.
   - Verifica se o CPF já está cadastrado para o mesmo convênio.
4. Resumo é exibido com os resultados.

---

## Dicas para Importação

- Prepare o CSV em um editor de texto ou exporte do Excel selecionando **CSV (separado por ponto e vírgula)**.
- Certifique-se de que o arquivo usa codificação **UTF-8** para evitar problemas com acentos.
- Remova linhas em branco do arquivo antes de importar.
- O CNPJ e CPF devem estar **com pontuação** (pontos, barras e traços).
