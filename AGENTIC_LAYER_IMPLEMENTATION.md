# GrowStreams Agentic Layer — Implementation Plan
### "The Network School for AI Agents" — Learn / Earn / Burn

---

## 1. Architecture & Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            /agentic (Next.js 15)                         │
│  LearnTerminal.tsx   EarnBountyBoard.tsx   BurnStreamTracker.tsx         │
│        │                     │                        │                  │
│        └────────── useAgenticStore (Zustand) ──────────┘                 │
│                              │                                            │
│              WalletProvider (SubWallet / Polkadot.js)                    │
│                              │                                            │
│                 React Query hooks (SWR-style polling/streaming)          │
└───────────────┬───────────────────────────┬──────────────────────────────┘
                │ REST/JSON                 │ SDK direct-to-chain (signed tx)
                ▼                            ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────┐
│   api/ (Express)               │  │  @growstreams/sdk (sails-js)          │
│  /routes/agentic/*             │  │  sdk.learn.startSession()             │
│  /services/session-metering    │  │  sdk.earn.submitBounty()              │
│  /services/evaluator-webhook   │  │  sdk.burn.reportPR() → create_stream  │
│  /services/credit-accounting   │  └───────────────┬───────────────────────┘
└───────────────┬─────────────────────────────────────┘ signed extrinsic
                │ writes                                 ▼
                ▼                          ┌───────────────────────────────┐
     ┌────────────────────┐                │  Gear Sails Contracts (Vara)  │
     │  Supabase Postgres  │◄───event sub───┤  StreamCore  |  TokenVault    │
     │  agent_sessions      │   (indexer)   └───────────────────────────────┘
     │  agent_bounties       │
     │  oss_contributions    │
     └──────────┬────────────┘
                │ Supabase Realtime (postgres_changes)
                ▼
   UI re-renders: live credit ticker, bounty status, stream $/sec counter
```

**Lifecycle trace (Burn path, most complex):**
1. Agent/dev opens PR on a tracked OSS repo → GitHub webhook hits `api/routes/agentic/webhooks/github.ts`.
2. `evaluator-webhook.service.ts` pulls diff, sends to GPT-4o-mini scoring prompt → produces `qualityScore`, `linesOfImpact`.
3. Score ≥ threshold → `credit-accounting.service.ts` computes payout rate → calls `sdk.burn.reportPR()`.
4. SDK builds a sails-js message to `StreamCore.create_stream(recipient, ratePerSec, duration)`, signs with the **treasury/service account** (agents don't need their own gas for automated payouts), submits to Vara testnet.
5. A long-running **Gear event listener** (`api/src/services/chain-indexer.ts`, node-cron or persistent subscription) picks up `StreamCreated`/`StreamClaimed` events, upserts into `oss_contributions` + a `streams` mirror table in Supabase.
6. Supabase Realtime channel pushes the change; `/agentic` Burn tab's `useLiveStream` hook updates the per-second ticker client-side by interpolating between indexed checkpoints (no server round-trip needed for the animation itself).

---

## 2. File-by-File Implementation Checklist

### `frontend/src/app/agentic/`
| File | Change |
|---|---|
| `page.tsx` | Convert to server component shell; fetch initial SSR data (bounties, active sessions) via `api` server actions; hydrate client store. |
| `layout.tsx` | Wrap children in `<WalletProvider>` + `<QueryClientProvider>`. |
| `providers.tsx` **(new)** | `WalletProvider` (SubWallet/Polkadot.js extension detection, account selection, session persistence in cookie). |
| `store/useAgenticStore.ts` **(new)** | Zustand store: `{ wallet, activeSession, activeBounty, streamCache }`. |
| `hooks/useLiveStream.ts` **(new)** | React Query hook, see §4. |
| `hooks/useLearnSession.ts` **(new)** | Mutations: `startSession`, `submitAnswer`, `endSession`. |
| `hooks/useBounties.ts` **(new)** | Query: list/filter bounties; mutation: `claimBounty`. |
| `loading.tsx`, `error.tsx` **(new)** | Standard Next.js boundaries. |

### `frontend/src/components/agentic/`
| File | Change |
|---|---|
| `LearnTerminal.tsx` | Replace mock transcript array with `useLearnSession()`; stream GPT tokens via SSE/`ReadableStream` from `/api/agentic/learn/stream`. |
| `EarnBountyBoard.tsx` | Replace static cards with `useBounties()`; add wallet-gated "Claim" button calling `sdk.earn.claimBounty(bountyId)`. |
| `BurnStreamTracker.tsx` | Replace static progress bar with `useLiveStream(streamId)`; render animated $/sec counter (client-side `requestAnimationFrame` interpolation). |
| `WalletConnectButton.tsx` **(new)** | Extension detection, account picker modal, balance display via `sdk.getBalance`. |
| `CreditBadge.tsx` **(new)** | Displays accrued Learn credits, subscribes to Supabase Realtime channel `agent_sessions:user_id=eq.*`. |
| `TxStatusToast.tsx` **(new)** | Generic pending/success/failed extrinsic toast, keyed by tx hash. |

### `api/src/routes/`
| File | Change |
|---|---|
| `agentic/learn.ts` **(new)** | `POST /session/start`, `POST /session/:id/answer` (proxies to GPT-4o-mini, meters tokens), `POST /session/:id/end`. |
| `agentic/earn.ts` **(new)** | `GET /bounties`, `POST /bounties/:id/claim`. |
| `agentic/burn.ts` **(new)** | `GET /streams/:id`, `POST /webhooks/github` (PR events). |
| `agentic/index.ts` **(new)** | Router aggregator, mounted at `/api/agentic`. |

### `api/src/services/`
| File | Change |
|---|---|
| `session-metering.service.ts` **(new)** | Tracks token usage per Learn session, converts to credits, writes `agent_sessions.credits_earned`. |
| `evaluator-webhook.service.ts` **(new)** | GitHub signature verification, diff fetch, GPT-4o-mini scoring call, returns `{score, summary}`. |
| `credit-accounting.service.ts` **(new)** | Central ledger logic: Learn credits, Earn payouts, Burn stream rates — single source of truth so contract calls and Supabase stay consistent. |
| `chain-indexer.service.ts` **(new)** | Persistent Gear event subscription (or cron-polled `getBlockEvents`), upserts `streams`, `bounty_claims`. |
| `sails.service.ts` **(new)** | Wraps `@growstreams/sdk` server-side with the treasury keypair for automated `create_stream` calls. |

### `sdk/src/`
| File | Change |
|---|---|
| `client.ts` | Add `learn`, `earn`, `burn` namespaces to `GrowStreamsClient`. |
| `modules/learn.ts` **(new)** | `startSession()`, `submitAnswer()`, `getCredits()` — thin HTTP wrappers (Learn has no on-chain component by default). |
| `modules/earn.ts` **(new)** | `listBounties()`, `claimBounty()` — builds sails-js message to `TokenVault.release_bounty`. |
| `modules/burn.ts` **(new)** | `reportPR()`, `createStream()`, `getStream()` — builds sails-js message to `StreamCore.create_stream` / `.claim_stream`. |
| `types.ts` | Add `AgentSession`, `Bounty`, `StreamHandle`, `PRContribution` interfaces. |
| `idl/` | Ensure `StreamCore.idl`/`TokenVault.idl` are current; regenerate sails-js types via `sails-js-cli generate`. |

---

## 3. Step-by-Step Execution Phases

### Phase 1 — Backend & Indexing Setup
1. Write Supabase migrations for `agent_sessions`, `agent_bounties`, `oss_contributions`, plus mirror tables `streams`, `bounty_claims` (see §4 for schemas).
2. Enable Row Level Security: users read their own sessions/claims; service role writes.
3. Enable Supabase Realtime on all four tables (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`).
4. Stand up `chain-indexer.service.ts` as a long-lived worker (separate PM2/Docker process from the API, not inline in request handlers) subscribing to `StreamCreated`, `StreamClaimed`, `BountyReleased` Gear events.
5. Add a node-cron reconciliation job (every 5 min) that re-fetches recent blocks to catch any missed events from the subscription.

### Phase 2 — SDK Client Extensions
1. Regenerate sails-js typed clients from the latest `.idl` files for `StreamCore`/`TokenVault`.
2. Implement `modules/burn.ts::createStream` as a typed transaction builder returning an unsigned extrinsic + a `.signAndSend()` helper, so both the frontend (user-signed) and backend (treasury-signed) paths reuse the same builder.
3. Add `sdk.estimateGas()` helpers so the frontend can show fee previews before signing.
4. Version bump `@growstreams/sdk`, publish to the monorepo's internal package registry/workspace link.

### Phase 3 — `/agentic` UI Dynamic Wiring
1. Implement `WalletProvider` with `@polkadot/extension-dapp` (`web3Enable`, `web3Accounts`, `web3FromAddress`).
2. Swap all three tab components from static arrays to React Query hooks (§2 table).
3. Add optimistic UI updates for `claimBounty`/`startSession` (mutate cache immediately, reconcile on tx confirmation).
4. Wire `TxStatusToast` to a global mutation observer so any pending extrinsic across tabs shows consistent status.

### Phase 4 — Agent Evaluator & Webhook Automation
1. Register GitHub App/webhook on tracked repos → `POST /api/agentic/burn/webhooks/github` on `pull_request.closed` (merged=true).
2. `evaluator-webhook.service.ts` fetches diff via GitHub API, builds a scoring prompt, calls GPT-4o-mini, parses structured JSON score.
3. If score passes threshold, `credit-accounting.service.ts` computes `ratePerSec` and calls `sails.service.ts::createStream` with the treasury account — fully automated, no human signer needed for standard payouts above/below configurable caps (large payouts route to a manual-approval queue instead).
4. Indexer picks up the resulting `StreamCreated` event and closes the loop into Supabase → UI.

---

## 4. Code Drafts for Critical Junctions

### 4.1 React Query hook — live per-second streaming ticker

```typescript
// frontend/src/app/agentic/hooks/useLiveStream.ts
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { sdk } from "@/lib/sdk-client";

interface StreamState {
  streamId: string;
  ratePerSec: number;      // in smallest token unit
  startedAt: number;       // unix ms, from chain
  claimedTotal: number;    // last on-chain checkpoint
  status: "active" | "paused" | "completed";
}

// Base query: source of truth from Supabase (mirrors chain-indexer output)
async function fetchStream(streamId: string): Promise<StreamState> {
  const { data, error } = await supabase
    .from("streams")
    .select("stream_id, rate_per_sec, started_at, claimed_total, status")
    .eq("stream_id", streamId)
    .single();

  if (error) throw error;
  return {
    streamId: data.stream_id,
    ratePerSec: Number(data.rate_per_sec),
    startedAt: new Date(data.started_at).getTime(),
    claimedTotal: Number(data.claimed_total),
    status: data.status,
  };
}

export function useLiveStream(streamId: string) {
  const [liveBalance, setLiveBalance] = useState(0);
  const frameRef = useRef<number>();

  const query = useQuery({
    queryKey: ["stream", streamId],
    queryFn: () => fetchStream(streamId),
    staleTime: 15_000,
    refetchInterval: 15_000, // periodic reconciliation with indexer
  });

  // Supabase Realtime: push-based updates on top of the polling baseline
  useEffect(() => {
    const channel = supabase
      .channel(`stream:${streamId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "streams", filter: `stream_id=eq.${streamId}` },
        () => query.refetch()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [streamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Client-side interpolation for the smooth per-second ticker
  useEffect(() => {
    if (!query.data || query.data.status !== "active") return;

    const { ratePerSec, startedAt, claimedTotal } = query.data;

    const tick = () => {
      const elapsedSec = (Date.now() - startedAt) / 1000;
      setLiveBalance(claimedTotal + elapsedSec * ratePerSec);
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [query.data]);

  const claim = async (signerAddress: string) => {
    return sdk.burn.claimStream({ streamId, signerAddress });
  };

  return {
    ...query,
    liveBalance,
    claim,
  };
}
```

### 4.2 API route — PR verification → `StreamCore.create_stream`

```typescript
// api/src/routes/agentic/burn.ts
import { Router, Request, Response } from "express";
import crypto from "crypto";
import { verifyGithubSignature } from "../../services/evaluator-webhook.service";
import { scorePullRequest } from "../../services/evaluator-webhook.service";
import { computeStreamRate } from "../../services/credit-accounting.service";
import { treasurySails } from "../../services/sails.service";
import { supabaseAdmin } from "../../lib/supabase-admin";

const router = Router();
const SCORE_THRESHOLD = 70;         // 0-100 GPT-4o-mini quality score
const AUTO_APPROVE_CAP_USD = 500;   // above this, route to manual queue

router.post("/webhooks/github", async (req: Request, res: Response) => {
  // 1. Verify webhook authenticity
  const signature = req.header("x-hub-signature-256") ?? "";
  const isValid = verifyGithubSignature({
    payload: req.body,
    signature,
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  });
  if (!isValid) return res.status(401).json({ error: "invalid signature" });

  const event = req.header("x-github-event");
  if (event !== "pull_request") return res.status(202).json({ skipped: true });

  const payload = req.body;
  if (payload.action !== "closed" || !payload.pull_request?.merged) {
    return res.status(202).json({ skipped: "not a merged PR" });
  }

  const pr = payload.pull_request;
  const repoFullName = payload.repository.full_name;

  try {
    // 2. Idempotency guard
    const { data: existing } = await supabaseAdmin
      .from("oss_contributions")
      .select("id")
      .eq("pr_url", pr.html_url)
      .maybeSingle();
    if (existing) return res.status(200).json({ status: "already_processed" });

    // 3. Score via GPT-4o-mini
    const { qualityScore, linesOfImpact, summary } = await scorePullRequest({
      repo: repoFullName,
      prNumber: pr.number,
      diffUrl: pr.diff_url,
    });

    // 4. Persist evaluation regardless of outcome
    const { data: contribution, error: insertError } = await supabaseAdmin
      .from("oss_contributions")
      .insert({
        pr_url: pr.html_url,
        repo: repoFullName,
        author_github: pr.user.login,
        quality_score: qualityScore,
        lines_of_impact: linesOfImpact,
        summary,
        status: qualityScore >= SCORE_THRESHOLD ? "approved" : "rejected",
      })
      .select()
      .single();
    if (insertError) throw insertError;

    if (qualityScore < SCORE_THRESHOLD) {
      return res.status(200).json({ status: "rejected", qualityScore });
    }

    // 5. Compute payout terms
    const { ratePerSec, durationSec, estimatedUsd } = computeStreamRate({
      qualityScore,
      linesOfImpact,
    });

    if (estimatedUsd > AUTO_APPROVE_CAP_USD) {
      await supabaseAdmin
        .from("oss_contributions")
        .update({ status: "pending_manual_approval" })
        .eq("id", contribution.id);
      return res.status(200).json({ status: "queued_for_manual_approval", estimatedUsd });
    }

    // 6. Fire on-chain create_stream from treasury account
    const recipientAddress = await resolveRecipientWallet(pr.user.login);
    const { streamId, txHash } = await treasurySails.burn.createStream({
      recipient: recipientAddress,
      ratePerSec,
      durationSec,
      memo: `PR:${pr.html_url}`,
    });

    // 7. Link contribution row to on-chain stream (indexer will fill in confirmations)
    await supabaseAdmin
      .from("oss_contributions")
      .update({ status: "stream_created", stream_id: streamId, tx_hash: txHash })
      .eq("id", contribution.id);

    return res.status(200).json({ status: "stream_created", streamId, txHash });
  } catch (err) {
    console.error("[burn/webhooks/github] error", err);
    return res.status(500).json({ error: "internal_error" });
  }
});

async function resolveRecipientWallet(githubLogin: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("agent_wallets")
    .select("wallet_address")
    .eq("github_login", githubLogin)
    .single();
  if (error || !data) throw new Error(`No linked wallet for github user ${githubLogin}`);
  return data.wallet_address;
}

export default router;
```

### 4.3 Supabase schemas

```sql
-- agent_sessions: Learn tab
create table agent_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  wallet_address text,
  topic text not null,
  status text not null default 'active'
    check (status in ('active', 'completed', 'abandoned')),
  tokens_used integer not null default 0,
  credits_earned numeric(18,6) not null default 0,
  transcript jsonb not null default '[]',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);
create index idx_agent_sessions_user on agent_sessions(user_id);
create index idx_agent_sessions_status on agent_sessions(status);

-- agent_bounties: Earn tab
create table agent_bounties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  reward_amount numeric(18,6) not null,
  reward_token text not null default 'GSTREAM',
  status text not null default 'open'
    check (status in ('open', 'claimed', 'in_review', 'paid', 'expired')),
  claimed_by uuid references auth.users(id),
  claimed_wallet text,
  vault_bounty_ref text,          -- on-chain TokenVault bounty identifier
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_agent_bounties_status on agent_bounties(status);

-- oss_contributions + streams mirror: Burn tab
create table oss_contributions (
  id uuid primary key default gen_random_uuid(),
  pr_url text not null unique,
  repo text not null,
  author_github text not null,
  quality_score numeric(5,2) not null,
  lines_of_impact integer not null,
  summary text,
  status text not null default 'pending'
    check (status in (
      'pending', 'approved', 'rejected',
      'pending_manual_approval', 'stream_created'
    )),
  stream_id text,
  tx_hash text,
  created_at timestamptz not null default now()
);
create index idx_oss_contributions_status on oss_contributions(status);
create index idx_oss_contributions_repo on oss_contributions(repo);

create table streams (
  stream_id text primary key,         -- on-chain stream identifier
  contribution_id uuid references oss_contributions(id),
  recipient_wallet text not null,
  rate_per_sec numeric(30,0) not null,
  claimed_total numeric(30,0) not null default 0,
  status text not null default 'active'
    check (status in ('active', 'paused', 'completed')),
  started_at timestamptz not null,
  last_indexed_block bigint,
  updated_at timestamptz not null default now()
);
create index idx_streams_status on streams(status);

-- enable realtime
alter publication supabase_realtime add table agent_sessions, agent_bounties, oss_contributions, streams;
```

---

### Notes / Open Decisions
- **Treasury signer custody**: automated `create_stream` calls need a hot-wallet keypair in the API service — store via a secrets manager (not `.env` in plain text), and keep the `AUTO_APPROVE_CAP_USD` gate as the primary risk control.
- **Learn tab on-chain footprint**: as scoped here, Learn credits are off-chain (Supabase ledger) until redeemed; redemption into on-chain tokens would call `TokenVault` separately — flag if you want that wired now vs. later.
- **Indexer resilience**: run `chain-indexer.service.ts` as its own process with restart policies; a missed-event window is covered by the 5-minute reconciliation cron in Phase 1.