-- FarmaFácil Convênios — Database Schema
-- Migration 001: Create all tables

-- ============================================
-- STORES
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'store')),
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- CONVÊNIOS (Benefit Companies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.convenios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  cnpj TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- ============================================
-- CONVENIADOS (Beneficiaries)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conveniados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  cpf TEXT NOT NULL UNIQUE,
  convenio_id UUID NOT NULL REFERENCES public.convenios(id),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.profiles(id)
);

-- ============================================
-- SALES
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES public.stores(id),
  convenio_id UUID NOT NULL REFERENCES public.convenios(id),
  conveniado_id UUID NOT NULL REFERENCES public.conveniados(id),
  sale_date DATE NOT NULL,
  total_value NUMERIC(10,2) NOT NULL CHECK (total_value > 0),
  is_installment BOOLEAN NOT NULL DEFAULT false,
  installment_count INTEGER CHECK (installment_count IS NULL OR (installment_count >= 2 AND installment_count <= 5)),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'exported', 'closed')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- SALE IMAGES
-- ============================================
CREATE TABLE IF NOT EXISTS public.sale_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  installment_number INTEGER,
  storage_path TEXT NOT NULL,
  file_size_kb INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- EXPORT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exported_by UUID NOT NULL REFERENCES public.profiles(id),
  convenio_id UUID NOT NULL REFERENCES public.convenios(id),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total_sales INTEGER NOT NULL,
  export_type TEXT NOT NULL CHECK (export_type IN ('pdf', 'xlsx', 'images')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- NOTIFICATIONS (scaffold for future use)
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sales_store_date ON public.sales(store_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_convenio_date ON public.sales(convenio_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_status ON public.sales(status);
CREATE INDEX IF NOT EXISTS idx_conveniados_convenio ON public.conveniados(convenio_id);
CREATE INDEX IF NOT EXISTS idx_sale_images_sale ON public.sale_images(sale_id);
CREATE INDEX IF NOT EXISTS idx_profiles_store ON public.profiles(store_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, read);
