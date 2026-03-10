-- FarmaFácil Convênios — Migration 009
-- Remove NOT NULL constraint from cpf column to allow CNPJ-only conveniados
-- (Migration 008 added cnpj column but forgot to drop cpf NOT NULL)

ALTER TABLE public.conveniados ALTER COLUMN cpf DROP NOT NULL;
