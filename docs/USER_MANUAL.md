# GrowStreams V3 × Stonk on Vara — Master Product Overview, Vision & Step-by-Step User Manual

> **Prepared for:** Vara Network DevRel, Engineering & OpenGov (`opengov.vara.network`) Community Reviewers  
> **Live Application:** [https://www.growstreams.xyz](https://www.growstreams.xyz)  
> **Live Real-Time Telemetry Dashboard (15s RPC Sync):** [https://www.growstreams.xyz/dashboard](https://www.growstreams.xyz/dashboard)  
> **16-Contract Registry & Portfolio Inspector:** [https://www.growstreams.xyz/protocol-overview](https://www.growstreams.xyz/protocol-overview)  
> **DeFiLlama Public Verification:** [https://defillama.com/protocol/growstreams](https://defillama.com/protocol/growstreams)  
> **Official X (Twitter):** [https://x.com/GrowwStreams](https://x.com/GrowwStreams)

---

## 1. Executive Summary & Long-Term Vision

### 1.1 The Problem We Solve
On-chain finance today is built around static, discrete transactions: lump-sum token transfers, manual grant payouts, and isolated trading venues that require centralized off-chain keepers. Meanwhile, real-world economic activity—salaries, developer grants, SaaS subscriptions, AI agent compute billing, and 24/7 global equity trading—is **continuous**.

### 1.2 The GrowStreams V3 Vision on Vara Network
**GrowStreams V3** is the **Real-Time Programmable Liquidity & 24/7 Capital Markets Layer on Vara Network**. By combining **Superfluid-grade per-second money streaming** with an **on-chain Spot Central Limit Order Book (`SpotOrderbook`)**, a **24/7 Pyth-indexed US Equity & Crypto Perpetuals Desk (`StonkPerpsDesk`)**, and **Autonomous AI Agent Squads (`AgentRegistryACP` + `SplitsRouter`)**, GrowStreams turns idle `VARA` into productive, continuously flowing capital:

1. **Wrap Once, Use Everywhere (`gVARA` & `wVARA` SuperTokens):** Users wrap native `VARA` 1:1 into liquid `gVARA` or `wVARA` in [`SuperToken` / `TokenVault`](https://www.growstreams.xyz/app/vault?tab=wrap). That same wrapped liquidity backs continuous per-second streams, on-chain bounties, CLOB limit orders, and `1x–5x` RWA perpetual margin positions.
2. **Continuous Cashflows & Automated Splits (`StreamCore V3` + `SplitsRouter` + `BountyAdapter`):** Protocol teams, DAOs, and creators stream funds by the second ([`/app/streams`](https://www.growstreams.xyz/app/streams)), escrow milestone bounties that auto-start streams upon verification ([`/app/bounties`](https://www.growstreams.xyz/app/bounties)), and split revenue across multiple contributors or agents atomically ([`/app/splits`](https://www.growstreams.xyz/app/splits)).
3. **24/7 On-Chain Orderbook & RWA Markets (`Stonk on Vara`):** Traders and autonomous agent squads trade 23+ Pyth-indexed US Equities (`$NVDA`, `$TSLA`, `$AAPL`, `$MSFT`, `$AMZN`, `$META`, `$GOOGL`, `$COIN`, `$MSTR`), ETFs (`$SPY`, `$QQQ`, `$IBIT`, `$GLD`), and crypto pairs 24/7 on [`/agents?tab=perps`](https://www.growstreams.xyz/agents?tab=perps) and [`/agents?tab=spot`](https://www.growstreams.xyz/agents?tab=spot).

---

## 2. What Is Live & Working Today (Complete URL & Feature Matrix)

Every route below is live in production on **[https://www.growstreams.xyz](https://www.growstreams.xyz)** and wired directly to **Vara Mainnet (`wss://rpc.vara.network`)** with **100% client-side Sails SCALE encoding** and **SubWallet / Polkadot.js signing**:

| # | Product Module | Live URL | What Is Working End-to-End Right Now |
| :--- | :--- | :--- | :--- |
| **1** | **Real-Time Telemetry Dashboard** | [`/dashboard`](https://www.growstreams.xyz/dashboard) | • Queries `https://rpc.vara.network` (`chain_getHeader`, `state_queryStorageAt`, `gear_calculateReplyForHandle`), DeFiLlama, and `explorer.vara.network` every **15 seconds**.<br>• Displays live Block Height, Active Custody TVL (`183,439+ VARA`), DAU/MAU, Cumulative Streams (`2,660`), Settled Trades (`189`), 30d DEX Volume (`$48,590`), 7d Perps Notional (`$67,950`), and Vara DAA Share (`31.1%`). |
| **2** | **Protocol Overview & Contract Registry** | [`/protocol-overview`](https://www.growstreams.xyz/protocol-overview) | • Interactive directory of all **16 Vara Mainnet Sails Smart Contracts** with one-click Subscan & Gear IDEA links.<br>• Displays live connected-wallet portfolio positions across Streams, Vaults, Spot Orders, and Perps. |
| **3** | **Stonk on Vara — 24/7 RWA & Crypto Perps (`1x–5x`)** | [`/agents?tab=perps`](https://www.growstreams.xyz/agents?tab=perps) | • Live Pyth + exchange price feeds across **23 featured markets** (`$NVDA`, `$AAPL`, `$TSLA`, `$MSFT`, `$AMZN`, `$META`, `$GOOGL`, `$COIN`, `$MSTR`, `$SPY`, `$QQQ`, `$IBIT`, `$GLD`, etc.) + searchable **1,050+ US Equity catalog**.<br>• Direct SubWallet signing for `StonkBaseService.OpenPosition` (`1x–5x` Long/Short) and `ClosePosition`. |
| **4** | **Stonk on Vara — On-Chain Spot CLOB** | [`/agents?tab=spot`](https://www.growstreams.xyz/agents?tab=spot) | • Reads live resting bids, asks, and recent fills directly from `SpotOrderbook` (`0x82f227bb...d4b7`).<br>• Direct SubWallet signing for `OrderbookService.PlaceOrder` (Buy/Sell limit orders) and `CancelOrder`. |
| **5** | **Autonomous AI Agent Squads (`ACP`)** | [`/agents?tab=squads`](https://www.growstreams.xyz/agents?tab=squads) | • Interactive 1-to-8 Agent Squad builder (`TRADER`, `QUANT`, `SDE`, `LIQUIDATOR`, `ART`, `X`, `MARKET_MAKER`, `BOUNTY_HUNTER`).<br>• Custom basis-point revenue split sliders (`60/15/15/10`) wired to `SplitsRouter` & `AgentRegistryACP`. |
| **6** | **SuperToken Vault (`Wrap / Unwrap / Custody`)** | [`/app/vault?tab=wrap`](https://www.growstreams.xyz/app/vault?tab=wrap) | • **Wrap Tab:** 1:1 native `VARA` $\rightarrow$ `gVARA` / `wVARA` minting (`SuperToken.Mint` with attached value).<br>• **Unwrap Tab:** 1:1 `gVARA` / `wVARA` $\rightarrow$ native `VARA` redemption (`SuperToken.Burn`).<br>• **Custody Tab (`/app/vault?tab=deposit`):** Direct `TokenVault.DepositNative` & `WithdrawNative`. |
| **7** | **Per-Second Money Streams** | [`/app/streams`](https://www.growstreams.xyz/app/streams) | • Create continuous per-second streams (`StreamCore.CreateStream`) with 1-click Auto-Wrap (`VARA` $\rightarrow$ `gVARA`).<br>• Full lifecycle controls: Sender `Deposit` top-up, `Pause`, `Resume`, `Stop`, and Receiver real-time `Withdraw`. |
| **8** | **Escrowed Developer & Creator Bounties** | [`/app/bounties`](https://www.growstreams.xyz/app/bounties) | • Browse live on-chain bounties (`94` total on `BountyAdapter`), post new escrowed bounties (`CreateBounty`), and claim open tasks (`ClaimBounty`). |
| **9** | **Multi-Recipient Revenue Splits** | [`/app/splits`](https://www.growstreams.xyz/app/splits) | • Create weighted split groups (`SplitsRouter.CreateGroup`) and distribute `VARA` / `gVARA` across recipients (`Distribute`). |
| **10** | **On-Chain Identity Registry** | [`/app/identity`](https://www.growstreams.xyz/app/identity) | • Register on-chain agent/user profiles (`IdentityRegistry.RegisterAgent` / `CreateBinding`) with metadata URIs. |
| **11** | **Scoped Permission Manager** | [`/app/permissions`](https://www.growstreams.xyz/app/permissions) | • Grant and revoke time-bound, amount-capped execution permissions (`PermissionManager.GrantPermission` / `RevokePermission`). |

---

## 3. Step-by-Step Interactive Testing Guide (For Vara DevRel & OpenGov Auditors)

### Step 0: Wallet Connection (`< 30 Seconds`)
1. Install **[SubWallet](https://www.subwallet.app/)** (or Polkadot.js / Talisman) and switch to **Vara Network Mainnet** (`kG...` address with at least `5–10 VARA` for testing).
2. Open **[https://www.growstreams.xyz/app/vault?tab=wrap](https://www.growstreams.xyz/app/vault?tab=wrap)** and click **Connect Wallet** in the top-right header.
3. Approve the connection in SubWallet. Your live Mainnet `VARA`, `gVARA`, `wVARA`, and `GROW` balances will immediately appear in the UI.

---

### Test 1: Wrap Native `VARA` into `gVARA` (`1:1 SuperToken Mint`)
1. On **[https://www.growstreams.xyz/app/vault?tab=wrap](https://www.growstreams.xyz/app/vault?tab=wrap)**, select **`gVARA`** and enter `2` VARA.
2. Click **Wrap VARA to gVARA** and sign the `SuperToken.Mint` transaction in SubWallet.
3. **Expected Result (~3s):**
   - Toast notification displays the confirmed Vara Mainnet block hash.
   - Your `gVARA` balance increases by `+2.00 gVARA`, and the `gVARA V3` custody contract (`0x086c7257...10ee`) balance increases by `+2.00 VARA`.
   - Switch to the **Unwrap** tab at any time to burn `gVARA` and receive native `VARA` back 1:1.

---

### Test 2: Create a Per-Second Money Stream (`StreamCore V3`)
1. Open **[https://www.growstreams.xyz/app/streams/create](https://www.growstreams.xyz/app/streams/create)**.
2. Enter a recipient Vara `SS58` address (`kG...`), select **`gVARA`** (or **`VARA (Auto-Wrap)`**), enter `1 gVARA` deposit, and select a `1 Hour` duration.
3. Click **Create Stream** and sign the `StreamCore.CreateStream` extrinsic in SubWallet.
4. **Expected Result (~3s):**
   - Stream appears in **[https://www.growstreams.xyz/app/streams](https://www.growstreams.xyz/app/streams)** with a live ticking per-second counter.
   - `StreamCore V3` (`0x4ae03ca0...a784`) increments `TotalStreams` and `ActiveStreams` on-chain (verifiable immediately on **[https://www.growstreams.xyz/dashboard](https://www.growstreams.xyz/dashboard)**).
   - The recipient can connect their wallet and click **Withdraw** to claim streamed tokens to their wallet at any second, or you can click **Pause** / **Stop** to close the stream and reclaim unstreamed deposit.

---

### Test 3: Place an On-Chain Spot CLOB Limit Order (`SpotOrderbook`)
1. Open **[https://www.growstreams.xyz/agents?tab=spot](https://www.growstreams.xyz/agents?tab=spot)**.
2. Inspect the live on-chain orderbook fetched from `SpotOrderbook` (`0x82f227bb...d4b7`).
3. Select **Buy `wVARA`**, enter price `1.00 gVARA` and amount `5 wVARA`, and click **Place Order**.
4. Sign the `OrderbookService.PlaceOrder` extrinsic in SubWallet.
5. **Expected Result (~3s):**
   - Your order is recorded on-chain in `SpotOrderbook` (incrementing `next_order_id` beyond `114`—or immediately filling if crossing an ask and incrementing `total_trades`).

---

### Test 4: Open & Close a 24/7 US Equity Perpetual Position (`StonkPerpsDesk`)
1. Open **[https://www.growstreams.xyz/agents?tab=perps](https://www.growstreams.xyz/agents?tab=perps)**.
2. Select a live Pyth US Equity market (e.g., **`$NVDA`**, **`$TSLA`**, or **`$AAPL`**) and inspect the live mark price and 24h change badge.
3. Select **Long**, choose **`2x` or `5x` leverage**, enter `5 gVARA` margin collateral, and click **Open Position**.
4. Sign `StonkBaseService.OpenPosition` in SubWallet.
5. **Expected Result (~3s):**
   - Your leveraged position appears in the **My Open Positions** panel with real-time entry price, liquidation price, and unrealized PnL.
   - Click **Close Position** anytime to sign `StonkBaseService.ClosePosition` and settle on-chain.

---

### Test 5: Create a `60/15/15/10` Revenue Split Group, Post a Bounty, or Grant Scoped Permissions
- **Splits (`/app/splits`):** Click **Create Split Group** on **[https://www.growstreams.xyz/app/splits](https://www.growstreams.xyz/app/splits)** to register a weighted recipient group on `SplitsRouter` (`0x68b9fd8f...2f45`).
- **Bounties (`/app/bounties`):** Click **Create Bounty** on **[https://www.growstreams.xyz/app/bounties](https://www.growstreams.xyz/app/bounties)** to lock a reward on `BountyAdapter` (`0x7697bb2e...bd4f`).
- **Identity & Permissions (`/app/identity` & `/app/permissions`):** Register an on-chain identity on `IdentityRegistry` (`0x6f413156...7f29`) or delegate a scoped stream permission on `PermissionManager` (`0x52f4299e...e581`).

---

## 4. Architecture & Market Microstructure FAQ (For Technical & OpenGov Reviewers)

### Q1: How Does `StonkPerpsDesk` Offer 24/7 Equity & ETF Exposure Without Custodial Shares?
- **Oracle-Settled Cash-Margin Perpetuals (Not Custodial Tokenized Shares):**
  - Just like **Gains Network (`gTrade`)** on Arbitrum (`$50B+` volume), **Ostium**, and **Synthetix**, `StonkPerpsDesk` (`0x8073da7a...da81`) does **not** issue or custody physical shares of stock.
  - Instead, it is an **oracle-settled perpetual futures engine collateralized 100% in `gVARA` (1:1 wrapped `VARA`)**:
    1. Traders lock `gVARA` margin inside the `StonkPerpsDesk` Sails smart contract at `1x` to `5x` leverage.
    2. Our on-chain oracle keeper (`api/stonk-oracle-keeper.mjs`) fetches live price feeds from the **Pyth Network Hermes Equity & ETF Catalog (`https://hermes.pyth.network`)** and pushes signed `StonkBaseService.PushOraclePrices` extrinsics on-chain.
    3. Long and Short PnL is settled entirely in **`gVARA`** against the protocol vault—keeping **100% of TVL, margin collateral, and trading fees native to Vara Network** with zero off-chain broker counterparty risk.

### Q2: How Does the Protocol Handle Weekend & Overnight Market Closures (48-Hour Price Gaps)?
When traditional US equity markets close on Friday at 16:00 ET and re-open Monday at 09:30 ET, macro events over the weekend can cause significant opening price gaps. GrowStreams V3 protects both traders and the `gVARA` vault through a **4-Layer Microstructure Defense**:
1. **On-Chain `±8%` (`MAX_MOVE_BPS = 800`) Circuit-Breaker Clamp:** Inside `agents/contracts/stonkbase-vara-desk/src/lib.rs`, every `PushOraclePrices` update is clamped on-chain to a maximum `±8%` move per update cycle. Even if an underlying stock gaps `15%` at the Monday open, the on-chain mark price steps smoothly across intervals rather than triggering an instant flash-wick liquidation.
2. **Conservative `1x–5x` Maximum Leverage Cap:** Unlike `50x–100x` perp venues where a `1%–2%` gap wipes out positions, `StonkPerpsDesk` enforces a strict `5x` maximum leverage ceiling (`20%` maintenance margin buffer), absorbing standard overnight/weekend volatility safely.
3. **Oracle Freshness & Confidence Guards:** Positions can only be opened or closed when the on-chain oracle timestamp is fresh and confidence bounds (`conf >= 95`) are satisfied.
4. **"Call the Open" — Dedicated 09:30 ET Opening-Candle Parimutuel Market (`agents/stonkbase/call-the-open.mjs`):**
   - To let the community trade weekend/overnight news with **zero liquidation risk and zero vault solvency risk**, users stake `gVARA` in a parimutuel pool predicting whether the Monday 09:30 ET opening candle will print **`GREEN`** (`Close > Open`) or **`RED`** (`Close < Open`), with a hard **60-second pre-open cutoff (`09:29:00 ET`)** and a **`1.20x` weight boost** for `TokenVault` stakers. Because it is parimutuel, winners split the opposing pool pro-rata and the protocol vault takes **zero directional gap risk**.

### Q3: Why Is 30-Day Volume (`$48.5K+` DEX / `$67.9K` Perps) High Relative to Current Snapshot TVL (`183,439+ VARA`)?
1. **Capital Velocity (`Flow`) vs. Point-in-Time Snapshot (`Stock`):**
   - Unlike passive AMM pools where liquidity sits idle, GrowStreams is a **continuous streaming (`StreamCore V3`) and orderbook (`SpotOrderbook`) protocol**. When working capital wraps into `gVARA`/`wVARA`, streams per second to a recipient or crosses on the Spot CLOB, and is subsequently withdrawn/unwrapped, it generates high cumulative settled volume while leaving minimal idle balance locked at day's end.
2. **`VARA` Denominated TVL (`183,439+ VARA`):**
   - On-chain custody across `TokenVault`, `wVARA`, `gVARA V3`, and `StonkPerpsDesk` holds **`183,439+ VARA`** (all self-seeded by the team, as prior M1/M2 grants were strictly engineering build milestones with `$0` liquidity allocation). Expanding this `gVARA` / `TokenVault` reserve is a primary catalyst for scaling position sizes in Phase 3.

---

## 5. Direct RPC Verification Commands (Zero-Trust CLI Check)

Auditors can verify the live on-chain state of GrowStreams V3 directly against `https://rpc.vara.network` using a single `curl` command:

```bash
# Query the live aggregated telemetry endpoint (reads directly from wss://rpc.vara.network + DeFiLlama)
curl -s https://www.growstreams.xyz/api/dashboard-stats | jq '{
  blockNumber: .network.blockNumber,
  tvlVara: .financials.tvlVara,
  totalStreamsOnChain: .onChainTotals.totalStreams,
  totalTradesOnChain: .onChainTotals.totalTrades,
  totalBountiesOnChain: .onChainTotals.totalBounties,
  dexVolume30dUsd: .financials.dexVolume30dUsd,
  perpsVolume7dUsd: .financials.perpsVolume7dUsd,
  varaNetworkDaaSharePct: .users.varaNetworkDaaSharePct
}'
```
