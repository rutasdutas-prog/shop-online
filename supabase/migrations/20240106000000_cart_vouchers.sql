-- ============================================================
-- FASE 1: AI Shopping Cart, Vouchers
-- Jalankan di: https://supabase.com/dashboard/project/ieobmwbcvnsnaculmvnu/sql
-- ============================================================

-- Tabel Cart (keranjang belanja sementara, berbasis session)
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  voucher_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, session_id)
);

-- Tabel Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(12,2) NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (cart_id, product_id)
);

-- Tabel Voucher
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PERCENT', 'FIX')),
  value DECIMAL(12,2) NOT NULL,
  min_purchase DECIMAL(12,2) DEFAULT 0,
  max_discount DECIMAL(12,2),
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (store_id, code)
);

-- Enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- Policies: Cart bisa diakses siapa saja (server-side menggunakan service role)
CREATE POLICY "Anyone can manage carts" ON public.carts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can manage cart items" ON public.cart_items FOR ALL USING (true) WITH CHECK (true);

-- Policies: Voucher
CREATE POLICY "Public can view active vouchers" ON public.vouchers 
  FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage vouchers" ON public.vouchers 
  FOR ALL USING (public.is_store_owner(store_id));

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_carts_store_session ON public.carts(store_id, session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_store ON public.vouchers(store_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON public.vouchers(store_id, code);
