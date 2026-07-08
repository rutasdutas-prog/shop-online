-- Create Chat Sessions Table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- Optional if guest
    session_token TEXT UNIQUE NOT NULL, -- To track guests (e.g. cookie based)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Allow all (just for simplicity in this ecommerce example, since users can be guests)
-- In a real prod you'd want to secure this based on session_token or user_id
CREATE POLICY "Enable read for anyone" ON public.chat_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for anyone" ON public.chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for anyone" ON public.chat_sessions FOR UPDATE USING (true);

CREATE POLICY "Enable read for anyone" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Enable insert for anyone" ON public.chat_messages FOR INSERT WITH CHECK (true);
