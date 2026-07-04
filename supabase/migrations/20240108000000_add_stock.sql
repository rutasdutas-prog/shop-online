-- ============================================================
-- FASE 4: Add Stock Column to Products
-- Jalankan di: https://supabase.com/dashboard/project/ieobmwbcvnsnaculmvnu/sql
-- ============================================================

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock INTEGER NOT NULL DEFAULT 0;
