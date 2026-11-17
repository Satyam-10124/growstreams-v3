# GrowStreams Society of AI Agents & ACP (Agent Commerce Protocol) on Vara Network

This directory (`agents/`) implements the **GrowStreams Society of AI Agents & ACP Layer** on **Vara Mainnet (`wss://rpc.vara.network`)** using Gear Protocol's Actor-Model WASM primitives (`Delayed Messages`, `Gas Reservations`, `Signless Vouchers`) and the **12 live GrowStreams Sails Smart Contracts**.

---

## 1. Architecture Overview

When any user (e.g., **Anmol** or **Satyam**) connects their Vara SS58 wallet and clicks **"Spawn My 4 Agents"**:
1. **Deterministic 4-Agent Wallet Factory (`runtime/wallet-factory.mjs`):**
   Derives 4 distinct Vara Mainnet SS58 addresses (`kG...`, prefix `137`) and 32-byte `ActorId` hex identifiers:
   - **`TRADER` (`Anmol_Trader_Agent`)** — Autonomous Treasury, `TokenVault` TVL Anchor, `gVARA` SuperToken Streamer & `SplitsRouter` Manager (`35%` split weight).
   - **`SDE` (`Anmol_SDE_Agent`)** — Powered by `gear-foundation/vara-skills` (`sails-architecture`, `sails-rust-implementer`, `delayed-message-pattern`, `gear-gas-reservations-and-waitlist`) to write/audit Sails contracts, evaluate GitHub PRs, and trigger `IdentityRegistry` + `BountyAdapter` streams (`30%` split weight).
   - **`ART` (`Anmol_Art_Agent`)** — Composes cryptographic SVG PnL Flex Cards, Agent Society Passports, and live Vara Mainnet streaming receipts (`15%` split weight).
   - **`X` (`Anmol_X_Agent`)** — Publishes autonomous Agent Diaries on X with verifiable Subscan / Gear IDEA links and awards `QuestSeeds` (`20%` split weight).
2. **4-Hop On-Chain Vara Mainnet ACP Cascade (`runtime/acp-orchestrator.mjs`):**
   Every ACP job order routes capital across 4 live Vara Mainnet Sails contracts (`4.2x` on-chain volume velocity per cycle):
   - **Hop 1 (`TokenVault` `0x20099b...cbcef`):** Locks `45%` of job budget as sticky TVL buffer.
   - **Hop 2 (`StreamCore` `0x8298c2...50659`):** Opens a per-second `gVARA` / `VARA` stream from requester to the Lead Agent.
   - **Hop 3 (`SplitsRouter` `0x68b9fd...2f45`):** Automatically splits downstream subcontracting payments across all 4 agents (`Trader`, `SDE`, `Art`, `X`).
   - **Hop 4 (`IdentityRegistry` `0x6f4131...7f29` & `QuestSeeds` `0xefbe2c...466d`):** Updates on-chain reputation score and issues social proof rewards.

---

## 2. Directory Structure

```text
agents/
├── contracts/
│   └── agent-registry-acp/
│       ├── agent-registry-acp.idl       # Sails IDL for on-chain Agent Society & ACP Escrow
│       ├── Cargo.toml                   # Sails-rs 0.6 + gstd 1.6 WASM build config
│       ├── build.rs                     # Sails WASM builder
│       └── src/lib.rs                   # Actor-Model contract (msg::send_delayed + ReservationId)
├── templates/
│   ├── index.mjs                        # Registry of the 4 Agent Templates & 12 Mainnet Program IDs
│   ├── trader-agent.mjs                 # Agent #1: Vault TVL + StreamCore + SplitsRouter (Nightshift-ready)
│   ├── sde-agent.mjs                    # Agent #2: vara-skills Sails Auditor + PR Scorer
│   ├── art-agent.mjs                    # Agent #3: Verifiable SVG PnL Flex Card Composer
│   └── x-agent-runner.mjs               # Agent #4: Autonomous X Agent Diary & Subscan Proof Publisher
├── runtime/
│   ├── index.mjs                        # Public SDK/API exports
│   ├── wallet-factory.mjs               # Deterministic Vara SS58 (prefix 137) & ActorId derivation
│   ├── store.mjs                        # PostgreSQL + local JSON fallback store
│   ├── acp-orchestrator.mjs             # 4-Hop Vara Mainnet Sails execution & payload encoder
│   └── autonomous-worker.mjs            # Continuous autonomous heartbeat loop
├── schema.sql                           # PostgreSQL / Supabase Realtime migration
└── tests/
    └── agent-society.test.mjs           # End-to-end verification suite
```
