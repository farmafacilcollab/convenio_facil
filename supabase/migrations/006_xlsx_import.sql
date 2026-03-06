-- FarmaFácil Convênios — Migration 006
-- Ajustes para importação XLSX de conveniados
-- Torna convenios.cnpj nullable (convênios criados via import podem não ter CNPJ)
-- Adiciona índices para performance de sincronização

-- ============================================
-- CONVENIOS: tornar cnpj nullable
-- ============================================
ALTER TABLE public.convenios ALTER COLUMN cnpj DROP NOT NULL;

-- Recriar constraint unique como partial index (apenas para cnpj não-nulo)
ALTER TABLE public.convenios DROP CONSTRAINT IF EXISTS convenios_cnpj_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_convenios_cnpj_unique
  ON public.convenios(cnpj) WHERE cnpj IS NOT NULL;

-- ============================================
-- CONVENIADOS: índices adicionais
-- ============================================
CREATE INDEX IF NOT EXISTS idx_conveniados_cpf ON public.conveniados(cpf);
CREATE INDEX IF NOT EXISTS idx_conveniados_active ON public.conveniados(active);
