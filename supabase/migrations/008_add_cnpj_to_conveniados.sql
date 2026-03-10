-- FarmaFácil Convênios — Migration 008
-- Adiciona suporte a CNPJ como alternativa a CPF na tabela conveniados
-- Permite que conveniados sejam identificados por CPF (pessoa física) ou CNPJ (empresa)

-- ============================================
-- CONVENIADOS: adicionar coluna cnpj
-- ============================================
ALTER TABLE public.conveniados ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Remover constraint única anterior de CPF
ALTER TABLE public.conveniados DROP CONSTRAINT IF EXISTS conveniados_cpf_key;

-- Criar índice único que permite CPF OU CNPJ (não ambos nulos)
-- Para cada registro, apenas um pode ser não-nulo e deve ser único
CREATE UNIQUE INDEX IF NOT EXISTS idx_conveniados_cpf_unique
  ON public.conveniados(cpf) WHERE cpf IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_conveniados_cnpj_unique
  ON public.conveniados(cnpj) WHERE cnpj IS NOT NULL;

-- Criar índice para buscar por convenio + cpf/cnpj
CREATE INDEX IF NOT EXISTS idx_conveniados_convenio_cpf
  ON public.conveniados(convenio_id, cpf) WHERE cpf IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conveniados_convenio_cnpj
  ON public.conveniados(convenio_id, cnpj) WHERE cnpj IS NOT NULL;
