-- Add store_appearance column to stores table
ALTER TABLE public.stores
ADD COLUMN IF NOT EXISTS theme_settings JSONB DEFAULT '{"theme_color": "#000000", "hero_title": "Selamat Datang di Toko Kami", "hero_subtitle": "Temukan produk-produk terbaik dengan harga terjangkau."}'::jsonb;
