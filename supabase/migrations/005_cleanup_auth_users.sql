-- FarmaFácil Convênios — Cleanup auth records
-- Migration 005: Remove auth users created by migration 004
--
-- The direct SQL inserts into auth.users (migration 004) generate bcrypt hashes
-- via pgcrypto crypt() that are NOT compatible with Supabase GoTrue's internal
-- password verification. This causes HTTP 500 on signInWithPassword.
--
-- This migration removes those broken auth records so they can be properly
-- recreated via the Supabase Admin API (seed.ts script).
--
-- The stores and profiles in public schema are fine and kept intact.

-- ============================================
-- 1. DELETE BROKEN PROFILES (they reference auth.users that will be deleted)
-- ============================================
DELETE FROM public.profiles WHERE id IN (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000099'
);

-- ============================================
-- 2. DELETE BROKEN IDENTITIES
-- ============================================
DELETE FROM auth.identities WHERE user_id IN (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000099'
);

-- ============================================
-- 3. DELETE BROKEN AUTH USERS
-- ============================================
DELETE FROM auth.users WHERE id IN (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000004',
  'b1000000-0000-0000-0000-000000000005',
  'b1000000-0000-0000-0000-000000000099'
);

-- ============================================
-- After running this migration, execute the seed script to recreate
-- users properly via the Supabase Admin API:
--
--   npx tsx supabase/seed.ts
--
-- The seed script uses the Admin API (createUser) which hashes passwords
-- correctly for GoTrue authentication.
-- ============================================
