-- ============================================================
-- FASE 3: AI Knowledge Base (RAG)
-- Jalankan di: https://supabase.com/dashboard/project/ieobmwbcvnsnaculmvnu/sql
-- ============================================================

-- Aktifkan ekstensi pgvector (wajib untuk RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel Knowledge Base
CREATE TABLE IF NOT EXISTS public.knowledge_base (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536), -- Menggunakan 1536 dimensi (standar OpenAI text-embedding-3-small / text-embedding-ada-002)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Owners can manage their knowledge base" 
  ON public.knowledge_base 
  FOR ALL USING (public.is_store_owner(store_id));

CREATE POLICY "Anyone can view knowledge base for a store" 
  ON public.knowledge_base 
  FOR SELECT USING (true);

-- Buat fungsi pencarian vector (Similarity Search)
CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_store_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    kb.id,
    kb.title,
    kb.content,
    1 - (kb.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_base kb
  WHERE kb.store_id = p_store_id
    AND 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$$;
