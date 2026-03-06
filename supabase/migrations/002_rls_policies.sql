-- FarmaFácil Convênios — RLS Policies
-- Migration 002: Enable RLS and create policies

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Returns the store_id of the currently authenticated user  
CREATE OR REPLACE FUNCTION public.get_user_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convenios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conveniados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- STORES POLICIES
-- ============================================

-- Store users can only read their own store
CREATE POLICY "stores_select_own"
  ON public.stores FOR SELECT
  TO authenticated
  USING (id = public.get_user_store_id());

-- Admin can read all stores
CREATE POLICY "stores_select_admin"
  ON public.stores FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- CONVENIOS POLICIES
-- ============================================

-- All authenticated users can read active convenios
CREATE POLICY "convenios_select_active"
  ON public.convenios FOR SELECT
  TO authenticated
  USING (active = true);

-- Admin can read all convenios (including inactive)
CREATE POLICY "convenios_select_admin"
  ON public.convenios FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Only admin can insert
CREATE POLICY "convenios_insert_admin"
  ON public.convenios FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admin can update
CREATE POLICY "convenios_update_admin"
  ON public.convenios FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admin can delete
CREATE POLICY "convenios_delete_admin"
  ON public.convenios FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- CONVENIADOS POLICIES
-- ============================================

-- All authenticated users can read active conveniados
CREATE POLICY "conveniados_select_active"
  ON public.conveniados FOR SELECT
  TO authenticated
  USING (active = true);

-- Admin can read all conveniados (including inactive)
CREATE POLICY "conveniados_select_admin"
  ON public.conveniados FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Only admin can insert
CREATE POLICY "conveniados_insert_admin"
  ON public.conveniados FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admin can update
CREATE POLICY "conveniados_update_admin"
  ON public.conveniados FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admin can delete
CREATE POLICY "conveniados_delete_admin"
  ON public.conveniados FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- SALES POLICIES
-- ============================================

-- Store users can insert sales for their own store
CREATE POLICY "sales_insert_store"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (store_id = public.get_user_store_id());

-- Store users can read their own store's sales
CREATE POLICY "sales_select_store"
  ON public.sales FOR SELECT
  TO authenticated
  USING (store_id = public.get_user_store_id());

-- Admin can read all sales
CREATE POLICY "sales_select_admin"
  ON public.sales FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- Admin can update sales (for status changes)
CREATE POLICY "sales_update_admin"
  ON public.sales FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================
-- SALE_IMAGES POLICIES
-- ============================================

-- Store users can insert images for their own sales
CREATE POLICY "sale_images_insert_store"
  ON public.sale_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE sales.id = sale_id 
      AND sales.store_id = public.get_user_store_id()
    )
  );

-- Store users can read images for their own sales
CREATE POLICY "sale_images_select_store"
  ON public.sale_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sales 
      WHERE sales.id = sale_id 
      AND sales.store_id = public.get_user_store_id()
    )
  );

-- Admin can read all sale images
CREATE POLICY "sale_images_select_admin"
  ON public.sale_images FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- EXPORT_LOGS POLICIES
-- ============================================

-- Only admin can insert export logs
CREATE POLICY "export_logs_insert_admin"
  ON public.export_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- Only admin can read export logs
CREATE POLICY "export_logs_select_admin"
  ON public.export_logs FOR SELECT
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own notifications (mark read)
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
