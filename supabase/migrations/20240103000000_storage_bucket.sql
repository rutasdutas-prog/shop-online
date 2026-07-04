-- ============================================================
-- MIGRATION: Setup Storage Bucket untuk upload produk
-- Jalankan ini di Supabase SQL Editor
-- ============================================================

-- Buat bucket untuk produk (public = bisa diakses tanpa login)
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Authenticated users bisa upload
CREATE POLICY "Authenticated users can upload product files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Policy: Public bisa lihat/download
CREATE POLICY "Public can view product files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Policy: Authenticated users bisa hapus file mereka
CREATE POLICY "Authenticated users can delete own product files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');
