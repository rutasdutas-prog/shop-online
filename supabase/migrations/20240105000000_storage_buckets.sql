-- Create products bucket if it does not exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for products bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'products' );

CREATE POLICY "Authenticated users can upload objects" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'products' );

CREATE POLICY "Authenticated users can update objects" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'products' );

CREATE POLICY "Authenticated users can delete objects" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'products' );
