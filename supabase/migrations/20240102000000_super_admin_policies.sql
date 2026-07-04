-- =====================================================
-- SUPER ADMIN RLS POLICIES
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Helper function to check if current user is SUPER_ADMIN
CREATE OR REPLACE FUNCTION public.is_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow SUPER_ADMIN to view ALL users
CREATE POLICY "Super admins can view all users" ON public.users
  FOR SELECT USING (public.is_super_admin());

-- Allow SUPER_ADMIN to update any user's role
CREATE POLICY "Super admins can update users" ON public.users
  FOR UPDATE USING (public.is_super_admin());

-- Allow SUPER_ADMIN to view ALL stores
CREATE POLICY "Super admins can view all stores" ON public.stores
  FOR SELECT USING (public.is_super_admin());

-- Allow SUPER_ADMIN to update any store (for suspend/activate)
CREATE POLICY "Super admins can update stores" ON public.stores
  FOR UPDATE USING (public.is_super_admin());

-- Allow SUPER_ADMIN to view ALL orders
CREATE POLICY "Super admins can view all orders" ON public.orders
  FOR SELECT USING (public.is_super_admin());

-- Allow SUPER_ADMIN to view ALL products
CREATE POLICY "Super admins can view all products" ON public.products
  FOR SELECT USING (public.is_super_admin());

-- Allow SUPER_ADMIN to view ALL inventory
CREATE POLICY "Super admins can view all inventory" ON public.inventory
  FOR SELECT USING (public.is_super_admin());

-- =====================================================
-- TO SET YOUR ACCOUNT AS SUPER_ADMIN:
-- Replace 'your-email@example.com' with your email
-- =====================================================

UPDATE public.users 
SET role = 'SUPER_ADMIN' 
WHERE email = 'your-email@example.com';

-- Verify:
-- SELECT id, email, role FROM public.users WHERE role = 'SUPER_ADMIN';
