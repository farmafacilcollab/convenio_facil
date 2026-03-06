-- FarmaFácil Convênios — Seed via SQL
-- Migration 004: Create stores, auth users and profiles
--
-- This migration creates all initial data directly in the database,
-- without requiring the Node.js seed script or the service_role key.
-- Passwords are hashed using bcrypt (pgcrypto).
-- Uses DO blocks with NOT EXISTS to avoid constraint issues across Supabase versions.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- 1. INSERT STORES
-- ============================================
INSERT INTO public.stores (id, name, cnpj, email, slug) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'DROGARIA JR LTDA ME',  '07.625.132/0001-58', 'farmafacil.loja01@hotmail.com', 'loja01'),
  ('a1000000-0000-0000-0000-000000000002', 'DROGARIA AR LTDA',     '52.331.882/0001-71', 'farmafacil.loja02@hotmail.com', 'loja02'),
  ('a1000000-0000-0000-0000-000000000003', 'DROGARIA JK LTDA ME',  '97.528.758/0001-39', 'farmafacil.loja03@hotmail.com', 'loja03'),
  ('a1000000-0000-0000-0000-000000000004', 'DROGARIA DR LTDA ME',  '22.019.833/0001-37', 'farmafacil.loja06@hotmail.com', 'loja04'),
  ('a1000000-0000-0000-0000-000000000005', 'DROGARIA JM LTDA',     '33.610.141/0001-85', 'farmafacil.loja05@hotmail.com', 'loja05')
ON CONFLICT (cnpj) DO NOTHING;

-- ============================================
-- 2. INSERT AUTH USERS + IDENTITIES
--    (uses DO blocks to safely skip existing records)
-- ============================================

DO $$
BEGIN
  -- Store user 1 — loja01
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'farmafacil.loja01@hotmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      'b1000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'farmafacil.loja01@hotmail.com',
      crypt('FarmaFacil@2026', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1000000-0000-0000-0000-000000000001' AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'b1000000-0000-0000-0000-000000000001',
      'b1000000-0000-0000-0000-000000000001',
      jsonb_build_object('sub', 'b1000000-0000-0000-0000-000000000001', 'email', 'farmafacil.loja01@hotmail.com'),
      'email', 'b1000000-0000-0000-0000-000000000001',
      now(), now(), now()
    );
  END IF;

  -- Store user 2 — loja02
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'farmafacil.loja02@hotmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      'b1000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000000',
      'farmafacil.loja02@hotmail.com',
      crypt('FarmaFacil@2026', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1000000-0000-0000-0000-000000000002' AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'b1000000-0000-0000-0000-000000000002',
      'b1000000-0000-0000-0000-000000000002',
      jsonb_build_object('sub', 'b1000000-0000-0000-0000-000000000002', 'email', 'farmafacil.loja02@hotmail.com'),
      'email', 'b1000000-0000-0000-0000-000000000002',
      now(), now(), now()
    );
  END IF;

  -- Store user 3 — loja03
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'farmafacil.loja03@hotmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      'b1000000-0000-0000-0000-000000000003',
      '00000000-0000-0000-0000-000000000000',
      'farmafacil.loja03@hotmail.com',
      crypt('FarmaFacil@2026', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1000000-0000-0000-0000-000000000003' AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'b1000000-0000-0000-0000-000000000003',
      'b1000000-0000-0000-0000-000000000003',
      jsonb_build_object('sub', 'b1000000-0000-0000-0000-000000000003', 'email', 'farmafacil.loja03@hotmail.com'),
      'email', 'b1000000-0000-0000-0000-000000000003',
      now(), now(), now()
    );
  END IF;

  -- Store user 4 — loja04
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'farmafacil.loja06@hotmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      'b1000000-0000-0000-0000-000000000004',
      '00000000-0000-0000-0000-000000000000',
      'farmafacil.loja06@hotmail.com',
      crypt('FarmaFacil@2026', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1000000-0000-0000-0000-000000000004' AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'b1000000-0000-0000-0000-000000000004',
      'b1000000-0000-0000-0000-000000000004',
      jsonb_build_object('sub', 'b1000000-0000-0000-0000-000000000004', 'email', 'farmafacil.loja06@hotmail.com'),
      'email', 'b1000000-0000-0000-0000-000000000004',
      now(), now(), now()
    );
  END IF;

  -- Store user 5 — loja05
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'farmafacil.loja05@hotmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      'b1000000-0000-0000-0000-000000000005',
      '00000000-0000-0000-0000-000000000000',
      'farmafacil.loja05@hotmail.com',
      crypt('FarmaFacil@2026', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1000000-0000-0000-0000-000000000005' AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'b1000000-0000-0000-0000-000000000005',
      'b1000000-0000-0000-0000-000000000005',
      jsonb_build_object('sub', 'b1000000-0000-0000-0000-000000000005', 'email', 'farmafacil.loja05@hotmail.com'),
      'email', 'b1000000-0000-0000-0000-000000000005',
      now(), now(), now()
    );
  END IF;

  -- Admin user
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'rh.farmafacil@gmail.com') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      aud, role, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      'b1000000-0000-0000-0000-000000000099',
      '00000000-0000-0000-0000-000000000000',
      'rh.farmafacil@gmail.com',
      crypt('FarmaFacilAdmin@2026', gen_salt('bf')),
      now(), 'authenticated', 'authenticated',
      '{"provider":"email","providers":["email"]}', '{}',
      false, now(), now(), '', ''
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = 'b1000000-0000-0000-0000-000000000099' AND provider = 'email') THEN
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'b1000000-0000-0000-0000-000000000099',
      'b1000000-0000-0000-0000-000000000099',
      jsonb_build_object('sub', 'b1000000-0000-0000-0000-000000000099', 'email', 'rh.farmafacil@gmail.com'),
      'email', 'b1000000-0000-0000-0000-000000000099',
      now(), now(), now()
    );
  END IF;
END $$;

-- ============================================
-- 3. INSERT PROFILES (link auth users → stores/roles)
-- ============================================
INSERT INTO public.profiles (id, email, role, store_id) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'farmafacil.loja01@hotmail.com', 'store', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000002', 'farmafacil.loja02@hotmail.com', 'store', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000003', 'farmafacil.loja03@hotmail.com', 'store', 'a1000000-0000-0000-0000-000000000003'),
  ('b1000000-0000-0000-0000-000000000004', 'farmafacil.loja06@hotmail.com', 'store', 'a1000000-0000-0000-0000-000000000004'),
  ('b1000000-0000-0000-0000-000000000005', 'farmafacil.loja05@hotmail.com', 'store', 'a1000000-0000-0000-0000-000000000005'),
  ('b1000000-0000-0000-0000-000000000099', 'rh.farmafacil@gmail.com',       'admin', NULL)
ON CONFLICT (id) DO NOTHING;
