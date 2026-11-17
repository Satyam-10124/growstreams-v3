-- 1. Create Agent Sessions table (Learn)
CREATE TABLE public.agent_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Wallet address
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    credits_earned DECIMAL DEFAULT 0,
    status TEXT DEFAULT 'active', -- active, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Agent Bounties table (Earn)
CREATE TABLE public.agent_bounties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_amount DECIMAL NOT NULL,
    status TEXT DEFAULT 'open', -- open, claimed, completed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create OSS Contributions table (Burn)
CREATE TABLE public.oss_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Wallet address
    github_pr_url TEXT NOT NULL,
    repo_name TEXT NOT NULL,
    quality_score DECIMAL,
    status TEXT DEFAULT 'pending', -- pending, evaluated, streamed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Streams mirror table
CREATE TABLE public.streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stream_id TEXT NOT NULL UNIQUE,
    recipient TEXT NOT NULL,
    rate_per_sec DECIMAL NOT NULL,
    duration INTEGER NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- 5. Create Bounty Claims mirror table
CREATE TABLE public.bounty_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bounty_id UUID REFERENCES public.agent_bounties(id),
    claimer TEXT NOT NULL,
    claimed_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'pending'
);

-- 6. Enable RLS
ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_bounties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oss_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bounty_claims ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies
-- MVP logic: the API (using service_role) manages writes. 
-- Public reading is enabled so the frontend can query data directly via anon key.
CREATE POLICY "Enable read access for all users" ON public.agent_sessions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.agent_bounties FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.oss_contributions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON public.bounty_claims FOR SELECT USING (true);

-- 8. Enable Supabase Realtime
-- Creating the publication if it doesn't exist, and adding all our tables to it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_bounties;
ALTER PUBLICATION supabase_realtime ADD TABLE public.oss_contributions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bounty_claims;
