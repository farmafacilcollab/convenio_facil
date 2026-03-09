-- FarmaFácil Convênios — Migration 007
-- Adiciona número de requisição às vendas
-- Cada loja tem sua sequência independente de requisições

-- ============================================
-- SALES: adicionar coluna requisition_number
-- ============================================
ALTER TABLE public.sales ADD COLUMN requisition_number TEXT;

-- Preencher vendas existentes com substring do ID (temporário)
UPDATE public.sales SET requisition_number = LEFT(id::text, 8) WHERE requisition_number IS NULL;

-- Tornar coluna obrigatória
ALTER TABLE public.sales ALTER COLUMN requisition_number SET NOT NULL;

-- Índice único por loja (cada loja tem sua sequência)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_store_requisition
  ON public.sales(store_id, requisition_number);
