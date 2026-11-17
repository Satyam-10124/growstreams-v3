-- ============================================================================
-- GrowStreams Society of AI Agents & ACP (Agent Commerce Protocol) on Vara
-- Database Schema (Compatible with PostgreSQL & Supabase Realtime)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. User-Spawned Vara AI Agents (4-Agent Template Suite: TRADER, SDE, ART, X)
CREATE TABLE IF NOT EXISTS public.user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_wallet TEXT NOT NULL,
    owner_handle TEXT,
    agent_wallet TEXT NOT NULL UNIQUE,
    agent_actor_id TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('TRADER', 'SDE', 'ART', 'X')),
    name TEXT NOT NULL,
    role_title TEXT NOT NULL,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    hire_fee_vara NUMERIC(20, 4) NOT NULL DEFAULT 5.0,
    split_weight INTEGER NOT NULL DEFAULT 2500,
    splits_group_id TEXT,
    voucher_id TEXT,
    permission_tx_hash TEXT,
    identity_tx_hash TEXT,
    reservation_id TEXT,
    heartbeat_interval_blocks INTEGER NOT NULL DEFAULT 1200,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'RETIRED')),
    total_jobs INTEGER NOT NULL DEFAULT 0,
    total_volume_vara NUMERIC(24, 6) NOT NULL DEFAULT 0,
    total_gas_burned_vara NUMERIC(24, 6) NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_agents_owner ON public.user_agents(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_user_agents_template ON public.user_agents(template_type);
CREATE INDEX IF NOT EXISTS idx_user_agents_status ON public.user_agents(status);

-- 2. Agent Commerce Protocol (ACP) Jobs (User-to-Agent & Agent-to-Agent Orders)
CREATE TABLE IF NOT EXISTS public.acp_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_code TEXT NOT NULL UNIQUE,
    requester_wallet TEXT NOT NULL,
    owner_wallet TEXT NOT NULL,
    lead_agent_id UUID REFERENCES public.user_agents(id),
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    budget_vara NUMERIC(20, 4) NOT NULL DEFAULT 25.0,
    token_symbol TEXT NOT NULL DEFAULT 'gVARA',
    token_address TEXT NOT NULL DEFAULT '0x04314af41b7dbac322e3e66920211d2f799719e1cdc3122a99752f72b6ae84ee',
    stream_id TEXT,
    splits_group_id TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('OPEN', 'STREAMING', 'SUBCONTRACTING', 'COMPLETED', 'FAILED')),
    total_onchain_volume_vara NUMERIC(24, 6) NOT NULL DEFAULT 0,
    hop_count INTEGER NOT NULL DEFAULT 0,
    deliverables JSONB NOT NULL DEFAULT '{}'::jsonb,
    tx_trail JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acp_jobs_requester ON public.acp_jobs(requester_wallet);
CREATE INDEX IF NOT EXISTS idx_acp_jobs_owner ON public.acp_jobs(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_acp_jobs_status ON public.acp_jobs(status);

-- 3. On-Chain Vara ACP Hop Transactions (Audit Trail for Subscan / Gear IDEA / DefiLlama)
CREATE TABLE IF NOT EXISTS public.acp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.acp_jobs(id) ON DELETE CASCADE,
    hop_number INTEGER NOT NULL,
    hop_type TEXT NOT NULL,
    contract_name TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    service_method TEXT NOT NULL,
    from_actor TEXT NOT NULL,
    to_actor TEXT NOT NULL,
    amount_vara NUMERIC(24, 6) NOT NULL DEFAULT 0,
    token_symbol TEXT NOT NULL DEFAULT 'VARA',
    tx_hash TEXT,
    block_hash TEXT,
    execution_mode TEXT NOT NULL DEFAULT 'on_chain',
    explorer_url TEXT,
    payload_hex TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_acp_transactions_job ON public.acp_transactions(job_id);
CREATE INDEX IF NOT EXISTS idx_acp_transactions_contract ON public.acp_transactions(contract_name);
