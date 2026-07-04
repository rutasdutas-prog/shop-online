-- ============================================================
-- FASE 5: Add Variants to Products
-- Jalankan di: https://supabase.com/dashboard/project/ieobmwbcvnsnaculmvnu/sql
-- ============================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variants JSONB NOT NULL DEFAULT '[]'::jsonb;
