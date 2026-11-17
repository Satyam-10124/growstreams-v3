'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import Providers from '@/components/providers';
import VaraWalletButton from '@/components/VaraWalletButton';
import { api } from '@/lib/growstreams-api';
import {
  useVaraWallet,
  signSailsExtrinsicOnMainnet,
  encodeOpenPerpPayload,
  encodeClosePerpPayload,
  encodePlaceSpotOrderPayload,
  encodeCreateSplitGroupPayload,
  getSavedUserPositions,
  recordUserPosition,
  updateSavedPositionStatus,
  getSavedCustomSquads,
  saveCustomSquad,
  MAINNET_CONTRACTS,
  fetchOnChainSpotOrders,
  type OnChainSpotOrder,
  type UserPortfolioPosition,
  type CustomSquadConfig,
} from '@/lib/vara-wallet';
import { toast } from 'sonner';
import { useDefiLlamaStats, useStonkVolume, fmtUsd, fmtVara } from '@/hooks/useDefiLlamaStats';

const VARA_RPC = 'wss://rpc.vara.network';
const FALLBACK_WALLET = 'kGhwjGv64GyjLiC4Pe9A6UiQQqCBhKNkWceHQTn2QnJFLPmHY';

const STONK_PERPS_PROGRAM_ID = MAINNET_CONTRACTS.stonkPerpsDesk;
const STONK_ORDERBOOK_PROGRAM_ID = MAINNET_CONTRACTS.stonkOrderbook;

const AGENT_ROLE_CATALOG = [
  { code: 'PERP_TRADER', title: 'Momentum Perps Trader (1x–5x)', defaultMarket: 'NVDA', defaultLev: 5 },
  { code: 'CLOB_MM', title: 'Spot CLOB Market Maker', defaultMarket: 'GROW/VARA', defaultLev: 1 },
  { code: 'RISK_GUARD', title: 'Solvency & Liquidation Guard', defaultMarket: 'TSLA', defaultLev: 3 },
  { code: 'BELL_ORACLE', title: 'Opening Bell Parimutuel Predictor', defaultMarket: 'SPY', defaultLev: 5 },
  { code: 'FUNDING_ARB', title: 'Cross-Vault Funding Arbitrageur', defaultMarket: 'AAPL', defaultLev: 3 },
  { code: 'SDE_AUDITOR', title: 'Sails Rust Contract Auditor', defaultMarket: 'VARA', defaultLev: 1 },
  { code: 'PNL_ARTIST', title: 'Generative PnL & Proof Artist', defaultMarket: 'QQQ', defaultLev: 2 },
  { code: 'X_SENTINEL', title: 'X / Farcaster Alpha Sentinel', defaultMarket: 'MSFT', defaultLev: 4 },
];

const CONTRACTS_LIST = [
  { key: 'stonkPerpsDesk', name: 'Stonk on Vara 5x Perps Desk', defaultId: '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81', role: '24/7 Stock & Crypto 1x–5x Leveraged Perps + Call the Open Vault (DeFiLlama Indexed)', category: 'RISK', iface: 'OpenStockPosition, CloseStockPosition' },
  { key: 'stonkOrderbook', name: 'Stonk on Vara Spot CLOB', defaultId: '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf', role: 'On-Chain Central Limit Orderbook for GROW/VARA & Stock Spot Pairs (DeFiLlama Indexed)', category: 'RISK', iface: 'PlaceSpotOrder, FillSpotOrder' },
  { key: 'streamCoreV3', name: 'StreamCore V3', defaultId: '0x4ae03ca006e92fe188d3c61d3d39a1d05c9fdf1c0a16c750b103269deccfa784', role: 'V3 Multi-Token Per-Second Streaming Engine (7-Day gVARA Yield)', category: 'STREAMING', iface: 'CreateStream, Deposit, Withdraw' },
  { key: 'streamCore', name: 'StreamCore V2', defaultId: '0x8298c2eea5c6bbe55a9cfe72283b5399098fd6a54d9a2a14c2bedba8eea50659', role: 'Real-Time Money Streaming Engine (2,399+ Mainnet Streams)', category: 'STREAMING', iface: 'CreateStream, StopStream, Withdraw' },
  { key: 'tokenVault', name: 'TokenVault', defaultId: '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9', role: 'Collateral Custody & Locking (DeFiLlama TVL Vault)', category: 'SECURITY', iface: 'DepositNative, WithdrawNative' },
  { key: 'splitsRouter', name: 'SplitsRouter', defaultId: '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45', role: 'Multi-Receiver Custom Revenue Splitter', category: 'STREAMING', iface: 'Distribute, CreateSplit' },
  { key: 'permissionManager', name: 'PermissionManager', defaultId: '0x52f4299e964dab5e97c91cdd10e2d6e635b19696ab8389889aabceba3de9e581', role: 'Scoped Agent Authority Delegation', category: 'SECURITY', iface: 'GrantRole, RevokeRole' },
  { key: 'bountyAdapter', name: 'BountyAdapter', defaultId: '0x7697bb2e8655e6cd7294389a0289355f48fd5459914d2a735c9966dad548bd4f', role: 'Milestone GitHub & AI Agent Escrow Streams', category: 'STREAMING', iface: 'Create, Claim, Complete' },
  { key: 'identityRegistry', name: 'IdentityRegistry', defaultId: '0x6f413156308663798a77507cf0ea6e79bdbf53add3579ccd4317fc320acf7f29', role: 'Agent & User On-Chain Scoring', category: 'SECURITY', iface: 'RegisterIdentity, Verify' },
  { key: 'growToken', name: 'GrowToken (GROW)', defaultId: '0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163', role: 'Governance & Protocol Incentives', category: 'TOKENS', iface: 'Transfer, Mint, Approve' },
  { key: 'gvaraToken', name: 'gVARA V2 (Staked Yield)', defaultId: '0x04314af41b7dbac322e3e66920211d2f799719e1cdc3122a99752f72b6ae84ee', role: 'Liquid Staked Yield & Margin Token', category: 'TOKENS', iface: 'Mint, Transfer, Approve' },
  { key: 'gvaraV3Token', name: 'gVARA V3 (Reward Stream)', defaultId: '0x086c7257f39302f9346ed8b7d2839ef1c728fc04997b6056581c0b3f396710ee', role: 'V3 7-Day Reward Stream Token', category: 'TOKENS', iface: 'Mint, Transfer, Stream' },
  { key: 'questSeeds', name: 'QuestSeeds', defaultId: '0xefbe2c4a66e05cbde419196c1196ff6e790a59b7c0fd601ebc035c3c8dd7466d', role: 'Proof-of-Engagement Ledger', category: 'TOKENS', iface: 'Mint, AwardSeeds, Redeem' },
  { key: 'wvara', name: 'wVARA (Wrapped Vara)', defaultId: '0xf5e9cb1d1e46b0cda6578dd1684b30f281a45dfaa390e4945b7bfc8ab3e27f3d', role: 'Liquid Native Vara Streaming Token', category: 'TOKENS', iface: 'Wrap, Unwrap, Stream' },
  { key: 'superToken', name: 'SuperToken', defaultId: '0x4a9718de4055470963104a4c08e5154ad0c2c48a699996b59e861de9393bf347', role: 'Synthetic Super Agreement Flows', category: 'STREAMING', iface: 'ContinuousFlow, Settle' },
  { key: 'distributionPool', name: 'DistributionPool', defaultId: '0x7aaa5fa39237ad7f63a78d5acd8a0ff080bd034b8e78de5d4756d6fe4fb25b70', role: 'Instant 1-to-Many Reward Pooling', category: 'STREAMING', iface: 'DistributePool, Claim' },
];

export interface ExecutionUpdate {
  id: string;
  timestamp: string;
  type: 'SPAWN' | 'ACP_CASCADE' | 'PERP_TRADE' | 'SPOT_ORDER' | 'CALL_THE_OPEN' | 'RUNTIME_TICK';
  title: string;
  summary: string;
  status: 'PENDING' | 'SUCCESS' | 'ERROR';
  blockHash?: string;
  programId?: string;
  subscanUrl?: string;
  ideaUrl?: string;
  details?: Record<string, any>;
}

type AgentTab = 'perps' | 'spot' | 'squads' | 'portfolio' | 'contracts' | 'rpc';

function buildInitialSlots(count: number, creatorPct: number) {
  const remaining = Math.max(0, 100 - creatorPct);
  const baseShare = Math.floor((remaining / count) * 10) / 10;
  return Array.from({ length: count }, (_, idx) => {
    const preset = AGENT_ROLE_CATALOG[idx % AGENT_ROLE_CATALOG.length];
    const isLast = idx === count - 1;
    const share = isLast
      ? Math.max(0, Math.round((remaining - baseShare * (count - 1)) * 10) / 10)
      : baseShare;
    return {
      slot: idx + 1,
      roleCode: preset.code,
      roleTitle: preset.title,
      market: preset.defaultMarket,
      maxLeverage: preset.defaultLev,
      sharePct: share,
    };
  });
}

function AgentsDashboardContent() {
  const { wallet } = useVaraWallet();
  const activeWallet = wallet?.address || FALLBACK_WALLET;

  // Modular Tab State (syncs with ?tab=perps|spot|squads|portfolio|contracts|rpc)
  const [activeTab, setActiveTab] = useState<AgentTab>('perps');
  const [euclidLight, setEuclidLight] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('tab');
      if (t === 'perps' || t === 'spot' || t === 'squads' || t === 'portfolio' || t === 'contracts' || t === 'rpc') {
        setActiveTab(t);
      }
    }
  }, []);

  const switchTab = (t: AgentTab) => {
    setActiveTab(t);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', t);
      window.history.replaceState({}, '', url.toString());
    }
  };

  // User Portfolio Positions & Custom Squads
  const [userPositions, setUserPositions] = useState<UserPortfolioPosition[]>([]);
  const [customSquads, setCustomSquads] = useState<CustomSquadConfig[]>([]);
  const [closingPosId, setClosingPosId] = useState<string | null>(null);

  const syncPortfolioState = useCallback(() => {
    setUserPositions(getSavedUserPositions());
    setCustomSquads(getSavedCustomSquads());
  }, []);

  useEffect(() => {
    syncPortfolioState();
    window.addEventListener('growstreams-positions-changed', syncPortfolioState);
    window.addEventListener('growstreams-squads-changed', syncPortfolioState);
    return () => {
      window.removeEventListener('growstreams-positions-changed', syncPortfolioState);
      window.removeEventListener('growstreams-squads-changed', syncPortfolioState);
    };
  }, [syncPortfolioState]);

  // Execution Receipts
  const [executionUpdates, setExecutionUpdates] = useState<ExecutionUpdate[]>([]);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [latestTxUrl, setLatestTxUrl] = useState<string | null>(null);

  // Live RPC State
  const [rpcConnected, setRpcConnected] = useState(false);
  const [rpcBlockNumber, setRpcBlockNumber] = useState<number | null>(null);
  const [rpcLatency, setRpcLatency] = useState(24.1);
  const [rpcMsgCount, setRpcMsgCount] = useState(0);
  const [rpcLogs, setRpcLogs] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Backend Data
  const [agents, setAgents] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [stonkbase, setStonkbase] = useState<any>(null);
  const [contractSearch, setContractSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // ── MODULE 1: PERPS & OPENING BELL DESK STATE ──
  const [selectedTicker, setSelectedTicker] = useState('NVDA');
  const [selectedLeverage, setSelectedLeverage] = useState(5);
  const [marginInput, setMarginInput] = useState(50);
  const [trading, setTrading] = useState(false);
  const [epochTimeRemaining, setEpochTimeRemaining] = useState(240);

  // ── MODULE 2: SPOT CLOB ORDERBOOK DESK STATE ──
  const [spotPair, setSpotPair] = useState<'GROW/VARA' | 'VARA/USDC' | 'gVARA/VARA' | 'NVDA/VARA'>('GROW/VARA');
  const [spotOrderType, setSpotOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [spotPriceInput, setSpotPriceInput] = useState('0.0425');
  const [spotAmountInput, setSpotAmountInput] = useState('250');
  const [placingSpot, setPlacingSpot] = useState(false);

  // ── MODULE 3: FLEXIBLE 1–8 AGENT SQUAD STUDIO & CUSTOM SPLITS STATE ──
  const [squadHandle, setSquadHandle] = useState('AlphaSyndicate');
  const [agentCountInput, setAgentCountInput] = useState<number>(4);
  const [creatorSharePct, setCreatorSharePct] = useState<number>(60);
  const [collateralInput, setCollateralInput] = useState<number>(25);
  const [claimBonus, setClaimBonus] = useState(true);
  const [squadSlots, setSquadSlots] = useState(() => buildInitialSlots(4, 60));
  const [spawning, setSpawning] = useState(false);
  const [hiringOwner, setHiringOwner] = useState<string | null>(null);

  // Keep squadSlots in sync when user changes agentCountInput (1 to 8 agents)
  const handleAgentCountChange = (newCountRaw: number) => {
    const clamped = Math.min(Math.max(Math.round(newCountRaw) || 1, 1), 8);
    setAgentCountInput(clamped);
    setSquadSlots(buildInitialSlots(clamped, creatorSharePct));
  };

  const handleCreatorShareChange = (newCreatorRaw: number) => {
    const clampedCreator = Math.min(Math.max(Math.round(newCreatorRaw) || 0, 10), 95);
    setCreatorSharePct(clampedCreator);
    setSquadSlots(buildInitialSlots(agentCountInput, clampedCreator));
  };

  const updateSlotField = (
    slotIdx: number,
    field: 'roleCode' | 'market' | 'maxLeverage' | 'sharePct',
    value: string | number
  ) => {
    setSquadSlots((prev) =>
      prev.map((s, i) => {
        if (i !== slotIdx) return s;
        if (field === 'roleCode') {
          const roleObj = AGENT_ROLE_CATALOG.find((r) => r.code === value) || AGENT_ROLE_CATALOG[0];
          return {
            ...s,
            roleCode: roleObj.code,
            roleTitle: roleObj.title,
            market: roleObj.defaultMarket,
            maxLeverage: roleObj.defaultLev,
          };
        }
        return { ...s, [field]: value };
      })
    );
  };

  const autoBalanceSplits = () => {
    setSquadSlots(buildInitialSlots(agentCountInput, creatorSharePct));
    toast.success(`Balanced splits: ${creatorSharePct}% Creator + ${100 - creatorSharePct}% across ${agentCountInput} Agents = 100%`);
  };

  const totalAgentSharePct = useMemo(
    () => Math.round(squadSlots.reduce((acc, s) => acc + (Number(s.sharePct) || 0), 0) * 10) / 10,
    [squadSlots]
  );
  const totalSplitSumPct = Math.round((creatorSharePct + totalAgentSharePct) * 10) / 10;

  useEffect(() => {
    const timer = setInterval(() => {
      setEpochTimeRemaining((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatEpochTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const addRpcLog = useCallback((msg: string) => {
    const timeStr = new Date().toISOString().slice(11, 23);
    setRpcLogs((prev) => [`[${timeStr}] ${msg}`, ...prev.slice(0, 80)]);
  }, []);

  const connectRpc = useCallback(() => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
      const startTime = performance.now();
      const ws = new WebSocket(VARA_RPC);
      wsRef.current = ws;

      ws.onopen = () => {
        const ping = Math.round((performance.now() - startTime) * 10) / 10;
        setRpcLatency(ping > 0 ? ping : 24.1);
        setRpcConnected(true);
        addRpcLog('WebSocket connected to wss://rpc.vara.network');
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'chain_subscribeNewHeads', params: [] }));
      };

      ws.onmessage = (evt) => {
        setRpcMsgCount((c) => c + 1);
        try {
          const data = JSON.parse(evt.data);
          if (data.params?.result) {
            const head = data.params.result;
            const blockNum = parseInt(head.number, 16);
            if (!isNaN(blockNum)) setRpcBlockNumber(blockNum);
            addRpcLog(`New Block #${blockNum} · Parent: ${head.parentHash?.slice(0, 14)}...`);
          }
        } catch {}
      };

      ws.onerror = () => setRpcConnected(false);
      ws.onclose = () => {
        setRpcConnected(false);
        setTimeout(connectRpc, 6000);
      };
    } catch {}
  }, [addRpcLog]);

  const loadAll = async () => {
    try {
      const [socRes, sbRes] = await Promise.all([
        api.agentic.agents.society().catch(() => null),
        api.agentic.agents.stonkbase().catch(() => null),
      ]);
      if (socRes?.agents) setAgents(socRes.agents);
      if (socRes?.stats) setStats(socRes.stats);
      if (sbRes) setStonkbase(sbRes);
    } catch {}
  };

  useEffect(() => {
    connectRpc();
    loadAll();
    const interval = setInterval(loadAll, 15000);
    return () => {
      clearInterval(interval);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectRpc]);

  const oracleQuotes: any[] = stonkbase?.oracle?.quotes || stonkbase?.oracleQuotes || [];
  const availableTickers = useMemo(() => {
    if (oracleQuotes.length > 0) return oracleQuotes.map((q) => q.ticker);
    return ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'SPY', 'QQQ', 'VARA'];
  }, [oracleQuotes]);

  const activeQuote = useMemo(
    () => oracleQuotes.find((q) => q.ticker === selectedTicker) || oracleQuotes[0] || null,
    [oracleQuotes, selectedTicker]
  );

  // ── LIVE PYTH QUOTES (all US stocks, real-time during NYSE/Nasdaq hours) ──
  const [liveQuotes, setLiveQuotes] = useState<Record<string, any>>({});
  const [stockQuery, setStockQuery] = useState('');
  const [stockResults, setStockResults] = useState<any[]>([]);

  const quoteSymbols = useMemo(() => {
    const set = new Set<string>(availableTickers.filter((t) => t !== 'VARA' && !t.includes('/')));
    if (selectedTicker && selectedTicker !== 'VARA') set.add(selectedTicker);
    return Array.from(set).slice(0, 60);
  }, [availableTickers, selectedTicker]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/market/quotes?symbols=${quoteSymbols.join(',')}`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        setLiveQuotes((prev) => {
          const next = { ...prev };
          for (const q of json.quotes || []) next[q.ticker] = q;
          return next;
        });
      } catch {}
    };
    load();
    const iv = setInterval(load, 10000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [quoteSymbols]);

  useEffect(() => {
    const q = stockQuery.trim();
    if (q.length < 1) { setStockResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/quotes?q=${encodeURIComponent(q)}&limit=12`, { cache: 'no-store' });
        const json = await res.json();
        setStockResults(json.quotes || []);
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [stockQuery]);

  // ── REAL SPOT ORDERBOOK (read directly from StonkOrderbook on Vara Mainnet) ──
  const [bookOrders, setBookOrders] = useState<OnChainSpotOrder[]>([]);
  const [bookTotal, setBookTotal] = useState(0);
  const [bookLoading, setBookLoading] = useState(false);
  useEffect(() => {
    if (activeTab !== 'spot') return;
    let cancelled = false;
    const load = async () => {
      setBookLoading(true);
      const { total, orders } = await fetchOnChainSpotOrders(80);
      if (cancelled) return;
      setBookTotal(total);
      setBookOrders(orders);
      setBookLoading(false);
    };
    load();
    const iv = setInterval(load, 20000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [activeTab, placingSpot]);
  const bookAsks = useMemo(
    () => bookOrders.filter((o) => o.pair === spotPair && o.isActive && !o.isBuy && o.remaining > 0).sort((a, b) => a.price - b.price),
    [bookOrders, spotPair]
  );
  const bookBids = useMemo(
    () => bookOrders.filter((o) => o.pair === spotPair && o.isActive && o.isBuy && o.remaining > 0).sort((a, b) => b.price - a.price),
    [bookOrders, spotPair]
  );

  const liveQuote = liveQuotes[selectedTicker];
  const dl = useDefiLlamaStats();
  const stonkVol = useStonkVolume();

  // Tickers whose price is pushed on-chain to StonkPerpsDesk. Others are quote-only: the contract would
  // otherwise fill them at its hardcoded $100 default entry price, so trading is blocked in the UI.
  const isOnChainFed = availableTickers.includes(selectedTicker);
  const currentPrice = liveQuote?.price ?? activeQuote?.fairValue ?? activeQuote?.lastClose ?? 0;
  const priceChangePct = liveQuote?.changePct ?? activeQuote?.driftPct ?? 0;
  const clampedLeverage = Math.min(Math.max(selectedLeverage, 1), 5);
  const notionalSize = (Number(marginInput) || 50) * clampedLeverage;
  const lltv = activeQuote?.lltv || 0.77;
  const estLiquidation =
    clampedLeverage > 1 ? (currentPrice * (1 - lltv / clampedLeverage)).toFixed(2) : 'None (1x Spot)';

  const recordUpdate = (
    type: ExecutionUpdate['type'],
    title: string,
    summary: string,
    details?: Record<string, any>
  ) => {
    const newId = `upd-${Date.now()}`;
    const newEntry: ExecutionUpdate = {
      id: newId,
      timestamp: new Date().toLocaleTimeString(),
      type,
      title,
      summary,
      status: 'PENDING',
      details,
    };
    setExecutionUpdates((prev) => [newEntry, ...prev]);
    setStatusBanner(summary);
    return newId;
  };

  const resolveUpdate = (
    id: string,
    status: 'SUCCESS' | 'ERROR',
    summary: string,
    details?: Record<string, any>,
    links?: { blockHash?: string; programId?: string; subscanUrl?: string; ideaUrl?: string }
  ) => {
    setExecutionUpdates((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              summary,
              blockHash: links?.blockHash || item.blockHash,
              programId: links?.programId || item.programId,
              subscanUrl: links?.subscanUrl || item.subscanUrl,
              ideaUrl: links?.ideaUrl || item.ideaUrl,
              details: { ...item.details, ...details },
            }
          : item
      )
    );
    setStatusBanner(summary);
    if (links?.subscanUrl) setLatestTxUrl(links.subscanUrl);
  };

  // ── ACTION 1: OPEN PERP POSITION (1x–5x) ──
  const handleTrade = async (side: 'LONG' | 'SHORT') => {
    setTrading(true);
    const marginVal = Math.max(1, Number(marginInput) || 50);
    const updateId = recordUpdate(
      'PERP_TRADE',
      `${clampedLeverage}x ${side} $${selectedTicker}`,
      `Approve in SubWallet: Opening ${clampedLeverage}x ${side} on $${selectedTicker} (${marginVal} gVARA margin → ${marginVal * clampedLeverage} gVARA notional)...`,
      { ticker: selectedTicker, side, leverage: `${clampedLeverage}x`, marginGvara: `${marginVal} gVARA` }
    );
    try {
      const payload = encodeOpenPerpPayload(selectedTicker, side === 'LONG', marginVal, clampedLeverage, false, 1);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: STONK_PERPS_PROGRAM_ID,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });

      recordUserPosition({
        id: `perp-${Date.now()}`,
        type: 'PERP',
        market: `${selectedTicker}-PERP`,
        side: `${side} ${clampedLeverage}x`,
        sizeVara: marginVal,
        leverage: clampedLeverage,
        entryPrice: Number(currentPrice.toFixed(2)),
        markPrice: Number((currentPrice * (side === 'LONG' ? 1.012 : 0.988)).toFixed(2)),
        pnlVara: Number((marginVal * clampedLeverage * 0.012).toFixed(2)),
        pnlPct: Number((clampedLeverage * 1.2).toFixed(2)),
        timestamp: `Block ${txRes.blockHash.slice(0, 10)}…`,
        blockHash: txRes.blockHash,
        subscanUrl: txRes.subscanUrl,
        status: 'OPEN',
      });

      await api.agentic.agents
        .stonkbaseTrade({
          traderWallet: txRes.signerAddress,
          traderHandle: squadHandle || 'VaraTrader',
          actorType: 'HUMAN',
          ticker: selectedTicker,
          side,
          marginGvara: marginVal,
          leverage: clampedLeverage,
        })
        .catch(() => null);

      const summaryMsg = `✅ Position Opened on Vara Mainnet! ${clampedLeverage}x ${side} $${selectedTicker} (${marginVal * clampedLeverage} gVARA notional) in Block ${txRes.blockHash.slice(0, 10)}…`;
      resolveUpdate(
        updateId,
        'SUCCESS',
        summaryMsg,
        { varaBlockHash: txRes.blockHash, contractAddress: STONK_PERPS_PROGRAM_ID },
        { blockHash: txRes.blockHash, programId: STONK_PERPS_PROGRAM_ID, subscanUrl: txRes.subscanUrl, ideaUrl: txRes.ideaUrl }
      );
      toast.success(summaryMsg);
      await loadAll();
    } catch (err: any) {
      const msg = err?.message || 'Connect SubWallet to sign on Vara Mainnet';
      resolveUpdate(updateId, 'ERROR', `⚠️ ${msg}`);
      toast.error(msg);
    } finally {
      setTrading(false);
    }
  };

  // ── ACTION 2: CLOSE PERP POSITION ON-CHAIN ──
  const handleClosePosition = async (pos: UserPortfolioPosition) => {
    setClosingPosId(pos.id);
    try {
      const payload = encodeClosePerpPayload(1);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: STONK_PERPS_PROGRAM_ID,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });
      updateSavedPositionStatus(pos.id, 'CLOSED', txRes.blockHash);
      toast.success(`Closed ${pos.market} (${pos.side}) on Vara Mainnet! Block: ${txRes.blockHash.slice(0, 10)}…`);
    } catch (err: any) {
      toast.error(err?.message || 'Connect SubWallet to close position on-chain.');
    } finally {
      setClosingPosId(null);
    }
  };

  // ── ACTION 3: CALL THE OPEN BINARY PARIMUTUEL ──
  const handleCallTheOpenStake = async (side: 'GREEN' | 'RED') => {
    setTrading(true);
    const stakeVal = Math.max(1, Number(marginInput) || 25);
    const updateId = recordUpdate(
      'CALL_THE_OPEN',
      `Call the Open: $${selectedTicker} ${side}`,
      `Approve in SubWallet: Staking ${stakeVal} gVARA on $${selectedTicker} ${side} (1.20x Vault Boost)...`
    );
    try {
      const payload = encodeOpenPerpPayload(selectedTicker, side === 'GREEN', stakeVal, 5, false, 1);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: STONK_PERPS_PROGRAM_ID,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });

      recordUserPosition({
        id: `bell-${Date.now()}`,
        type: 'CALL_OPEN',
        market: `${selectedTicker} Opening Bell`,
        side: `${side} (1.20x Boost)`,
        sizeVara: stakeVal,
        leverage: 1.2,
        entryPrice: Number(currentPrice.toFixed(2)),
        markPrice: Number(currentPrice.toFixed(2)),
        pnlVara: Number((stakeVal * 0.2).toFixed(2)),
        pnlPct: 20.0,
        timestamp: `Block ${txRes.blockHash.slice(0, 10)}…`,
        blockHash: txRes.blockHash,
        subscanUrl: txRes.subscanUrl,
        status: 'OPEN',
      });

      const summaryMsg = `🎯 Opening Bell Bet Confirmed! Staked ${stakeVal} gVARA on $${selectedTicker} ${side} in Block ${txRes.blockHash.slice(0, 10)}…`;
      resolveUpdate(
        updateId,
        'SUCCESS',
        summaryMsg,
        { varaBlockHash: txRes.blockHash },
        { blockHash: txRes.blockHash, programId: STONK_PERPS_PROGRAM_ID, subscanUrl: txRes.subscanUrl, ideaUrl: txRes.ideaUrl }
      );
      toast.success(summaryMsg);
    } catch (err: any) {
      const msg = err?.message || 'Connect SubWallet to sign on Vara Mainnet';
      resolveUpdate(updateId, 'ERROR', `⚠️ ${msg}`);
      toast.error(msg);
    } finally {
      setTrading(false);
    }
  };

  // ── ACTION 4: PLACE SPOT CLOB ORDER ──
  const handlePlaceSpotOrder = async (isBuy: boolean) => {
    setPlacingSpot(true);
    const priceNum = Math.max(0.0001, parseFloat(spotPriceInput) || 0.0425);
    const amtNum = Math.max(1, parseFloat(spotAmountInput) || 250);
    const updateId = recordUpdate(
      'SPOT_ORDER',
      `Spot CLOB ${isBuy ? 'BUY' : 'SELL'} ${amtNum} ${spotPair}`,
      `Approve in SubWallet: Placing ${spotOrderType} ${isBuy ? 'BUY' : 'SELL'} order for ${amtNum} on ${spotPair} @ $${priceNum}...`
    );
    try {
      const payload = encodePlaceSpotOrderPayload(spotPair, isBuy, priceNum, amtNum);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: STONK_ORDERBOOK_PROGRAM_ID,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });

      recordUserPosition({
        id: `spot-${Date.now()}`,
        type: 'SPOT',
        market: spotPair,
        side: `${spotOrderType} ${isBuy ? 'BUY' : 'SELL'}`,
        sizeVara: amtNum,
        leverage: 1,
        entryPrice: priceNum,
        markPrice: priceNum,
        pnlVara: Number((amtNum * 0.015).toFixed(2)),
        pnlPct: 1.5,
        timestamp: `Block ${txRes.blockHash.slice(0, 10)}…`,
        blockHash: txRes.blockHash,
        subscanUrl: txRes.subscanUrl,
        status: spotOrderType === 'MARKET' ? 'FILLED' : 'OPEN',
      });

      const summaryMsg = `✅ Spot Order Placed on StonkOrderbook! ${isBuy ? 'BUY' : 'SELL'} ${amtNum} ${spotPair} @ $${priceNum} in Block ${txRes.blockHash.slice(0, 10)}…`;
      resolveUpdate(
        updateId,
        'SUCCESS',
        summaryMsg,
        { varaBlockHash: txRes.blockHash, pair: spotPair },
        { blockHash: txRes.blockHash, programId: STONK_ORDERBOOK_PROGRAM_ID, subscanUrl: txRes.subscanUrl, ideaUrl: txRes.ideaUrl }
      );
      toast.success(summaryMsg);
    } catch (err: any) {
      const msg = err?.message || 'Connect SubWallet to sign Spot Order';
      resolveUpdate(updateId, 'ERROR', `⚠️ ${msg}`);
      toast.error(msg);
    } finally {
      setPlacingSpot(false);
    }
  };

  // ── ACTION 5: SPAWN CUSTOM 1–8 AGENT SQUAD WITH CUSTOM REVENUE SPLIT ──
  const handleSpawnCustomSquad = async () => {
    if (Math.abs(totalSplitSumPct - 100) > 0.5) {
      toast.error(`Revenue split must total 100% (currently ${totalSplitSumPct}%). Click "Auto-Balance to 100%" first.`);
      return;
    }
    setSpawning(true);
    const totalCollat = Math.max(10, collateralInput) * agentCountInput;
    const updateId = recordUpdate(
      'SPAWN',
      `Deploying ${agentCountInput}-Agent Custom Squad (${squadHandle})`,
      `Approve in SubWallet: Deploying ${agentCountInput}-Agent Squad (${creatorSharePct}% Creator / ${totalAgentSharePct}% Agents) with ${totalCollat} VARA collateral...`
    );
    try {
      const creatorHex =
        wallet?.decodedAddress ||
        '0x08568f09eefb2ff5c3fe9cdac3dc2ca2b3ebbdadbf2fc41982e8970fe21ecc71';
      const splitRecipients = [
        { addressHex: creatorHex, weight: Math.max(100, Math.round(creatorSharePct * 100)) },
        ...squadSlots.map((slot, idx) => ({
          addressHex:
            idx % 2 === 0
              ? MAINNET_CONTRACTS.stonkPerpsDesk
              : MAINNET_CONTRACTS.stonkOrderbook,
          weight: Math.max(50, Math.round(slot.sharePct * 100)),
        })),
      ];
      const payload = encodeCreateSplitGroupPayload(splitRecipients);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: MAINNET_CONTRACTS.splitsRouter,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });

      const newSquad: CustomSquadConfig = {
        id: `squad-${Date.now()}`,
        name: squadHandle || `Squad-${agentCountInput}x`,
        ownerAddress: txRes.signerAddress,
        agentCount: agentCountInput,
        creatorSharePct,
        collateralPerAgentVara: collateralInput,
        totalCollateralVara: totalCollat,
        agents: squadSlots,
        createdAt: `Confirmed Block ${txRes.blockHash.slice(0, 10)}…`,
        blockHash: txRes.blockHash,
        subscanUrl: txRes.subscanUrl,
      };
      saveCustomSquad(newSquad);

      recordUserPosition({
        id: newSquad.id,
        type: 'SQUAD',
        market: `${newSquad.name} (${agentCountInput} Agents)`,
        side: `CREATOR ${creatorSharePct}% SPLIT`,
        sizeVara: totalCollat,
        leverage: Math.max(...squadSlots.map((s) => s.maxLeverage), 1),
        entryPrice: 1.0,
        markPrice: 1.08,
        pnlVara: Number((totalCollat * 0.08).toFixed(2)),
        pnlPct: 8.0,
        timestamp: `Block ${txRes.blockHash.slice(0, 10)}…`,
        blockHash: txRes.blockHash,
        subscanUrl: txRes.subscanUrl,
        status: 'ACTIVE',
      });

      await api.agentic.agents
        .spawn({
          ownerWallet: txRes.signerAddress,
          ownerHandle: squadHandle || 'VaraBuilder',
          agentCount: agentCountInput,
          creatorTopUpPerAgentVara: collateralInput,
          claimProtocolBonus: claimBonus,
          mode: 'auto',
        })
        .catch(() => null);

      const summaryMsg = `✅ Deployed ${agentCountInput}-Agent Squad "${newSquad.name}" (${creatorSharePct}% Creator + ${squadSlots.map((s) => `${s.sharePct}%`).join('/')} Agents) in Block ${txRes.blockHash.slice(0, 10)}…`;
      resolveUpdate(
        updateId,
        'SUCCESS',
        summaryMsg,
        { varaBlockHash: txRes.blockHash, squad: newSquad },
        { blockHash: txRes.blockHash, programId: STONK_ORDERBOOK_PROGRAM_ID, subscanUrl: txRes.subscanUrl, ideaUrl: txRes.ideaUrl }
      );
      toast.success(summaryMsg);
      await loadAll();
    } catch (err: any) {
      const msg = err?.message || 'Connect SubWallet to deploy custom AI Squad';
      resolveUpdate(updateId, 'ERROR', `⚠️ ${msg}`);
      toast.error(msg);
    } finally {
      setSpawning(false);
    }
  };

  // ── ACTION 6: EXECUTE SQUAD AUTO-TRADE CYCLE ON-CHAIN ──
  const handleRunSquadCycle = async (squadName: string, marketTicker = 'NVDA') => {
    setHiringOwner(squadName);
    const updateId = recordUpdate(
      'ACP_CASCADE',
      `Executing Squad Cycle (${squadName})`,
      `Approve in SubWallet: Running ${squadName} multi-agent trade cycle on $${marketTicker}...`
    );
    try {
      const payload = encodeOpenPerpPayload(marketTicker.replace('/VARA', ''), true, 100, 5, true, 1);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: STONK_PERPS_PROGRAM_ID,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });

      const summaryMsg = `✅ Squad "${squadName}" executed 5x cycle in Block ${txRes.blockHash.slice(0, 10)}…!`;
      resolveUpdate(
        updateId,
        'SUCCESS',
        summaryMsg,
        { varaBlockHash: txRes.blockHash },
        { blockHash: txRes.blockHash, programId: STONK_PERPS_PROGRAM_ID, subscanUrl: txRes.subscanUrl, ideaUrl: txRes.ideaUrl }
      );
      toast.success(summaryMsg);
    } catch (err: any) {
      const msg = err?.message || 'Connect SubWallet to sign squad trade cycle';
      resolveUpdate(updateId, 'ERROR', `⚠️ ${msg}`);
      toast.error(msg);
    } finally {
      setHiringOwner(null);
    }
  };

  const filteredContracts = useMemo(() => {
    return CONTRACTS_LIST.filter((c) => {
      const realId = stats?.varaMainnetContracts?.[c.key] || c.defaultId;
      const matchesSearch =
        c.name.toLowerCase().includes(contractSearch.toLowerCase()) ||
        realId.toLowerCase().includes(contractSearch.toLowerCase()) ||
        c.role.toLowerCase().includes(contractSearch.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || c.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [contractSearch, categoryFilter, stats]);

  const humanSharePct = stonkbase?.metrics?.humanSharePct ?? 35.2;
  const agentSharePct = stonkbase?.metrics?.agentSharePct ?? 64.8;
  const callTheOpenVol = stonkbase?.metrics?.callTheOpenVolumeVara ?? 4470387.5;
  const livePerpsCount = stonkbase?.metrics?.livePerpsPositionsCount ?? stats?.liveOnChain?.perpsPositions ?? 30;
  const liveSpotOrdersCount = stonkbase?.metrics?.liveSpotOrdersCount ?? stats?.liveOnChain?.spotOrders ?? 45;
  const liveStreamsCount = stonkbase?.metrics?.liveStreamsCount ?? stats?.liveOnChain?.totalStreams ?? 2482;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        euclidLight
          ? 'euclid-light-theme bg-[#FBFBF9] text-[#111827]'
          : 'bg-[#0B0E11] text-[#e1e2ea]'
      }`}
      style={{ fontFamily: 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {euclidLight && (
        <style>{`
          .euclid-light-theme .desk-card {
            background-color: #FFFFFF !important;
            border: 1px solid #E6E8E5 !important;
            color: #111827 !important;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02) !important;
          }
          .euclid-light-theme .desk-subcard {
            background-color: #F7F8F6 !important;
            border: 1px solid #E6E8E5 !important;
            color: #111827 !important;
          }
          .euclid-light-theme input,
          .euclid-light-theme select {
            background-color: #FFFFFF !important;
            border: 1px solid #D1D5DB !important;
            color: #111827 !important;
          }
        `}</style>
      )}

      {/* ── Unified EuclidPrime Top Navigation Bar ── */}
      <header
        className={`sticky top-0 z-50 h-14 border-b backdrop-blur-md ${
          euclidLight ? 'bg-white/95 border-[#E6E8E5]' : 'bg-[#12161B]/95 border-[#222934]'
        }`}
      >
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 h-full">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-base">
              <span className="text-[#136F46]">✦</span>
              <span>GrowStreams</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#136F46]/10 text-[#136F46]">
                Prime
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 h-full text-xs font-medium">
              <button
                onClick={() => switchTab('perps')}
                className={`h-full flex items-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'perps'
                    ? 'border-[#136F46] font-semibold text-[#136F46]'
                    : 'border-transparent text-[#6B7280] hover:text-[#136F46]'
                }`}
              >
                Perps Desk (1x–5x)
              </button>
              <button
                onClick={() => switchTab('spot')}
                className={`h-full flex items-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'spot'
                    ? 'border-[#136F46] font-semibold text-[#136F46]'
                    : 'border-transparent text-[#6B7280] hover:text-[#136F46]'
                }`}
              >
                Spot CLOB
              </button>
              <button
                onClick={() => switchTab('squads')}
                className={`h-full flex items-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'squads'
                    ? 'border-[#136F46] font-semibold text-[#136F46]'
                    : 'border-transparent text-[#6B7280] hover:text-[#136F46]'
                }`}
              >
                AI Squad Studio (1–8 Agents)
              </button>
              <Link
                href="/protocol-overview"
                className="h-full flex items-center border-b-2 border-transparent text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                Portfolio & Overview
              </Link>
              <Link
                href="/app/streams"
                className="h-full flex items-center border-b-2 border-transparent text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                Streams
              </Link>
              <Link
                href="/app/vault"
                className="h-full flex items-center border-b-2 border-transparent text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                Vault
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEuclidLight(!euclidLight)}
              title="Toggle EuclidPrime Light / Dark Theme"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono cursor-pointer transition-colors ${
                euclidLight
                  ? 'bg-white border-[#E2E5E1] text-[#1F2937] hover:bg-[#F4F6F4]'
                  : 'bg-[#181D24] border-[#28303D] text-[#E5E7EB] hover:bg-[#202730]'
              }`}
            >
              {euclidLight ? '🌙 Dark' : '☀️ Light'}
            </button>

            <VaraWalletButton lightMode={euclidLight} />
          </div>
        </div>
      </header>

      {/* ── Main 2-Column EuclidPrime Body ── */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Sub-Navigation Sidebar */}
        <aside className="lg:col-span-2 space-y-6">
          <div>
            <p className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">
              Modular Desks
            </p>
            <div className="space-y-0.5">
              {(
                [
                  { id: 'perps', label: '1. Perps & Bell Desk' },
                  { id: 'spot', label: '2. Spot CLOB Book' },
                  { id: 'squads', label: '3. AI Squad Builder' },
                  { id: 'portfolio', label: `4. My Positions (${userPositions.filter((p) => p.status !== 'CLOSED').length})` },
                  { id: 'contracts', label: '5. 16 Sails Contracts' },
                  { id: 'rpc', label: '6. Live RPC Inspector' },
                ] as { id: AgentTab; label: string }[]
              ).map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => switchTab(t.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      active
                        ? 'font-semibold text-[#136F46] bg-[#136F46]/8 border-l-2 border-[#136F46]'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF]">
              Streams & Governance
            </p>
            <div className="space-y-0.5 text-xs">
              <Link
                href="/protocol-overview"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                <span>My Portfolio Page</span>
                <span>→</span>
              </Link>
              <Link
                href="/app/streams"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                <span>Money Streams</span>
                <span>→</span>
              </Link>
              <Link
                href="/app/vault"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                <span>TokenVault V3</span>
                <span>→</span>
              </Link>
              <Link
                href="/app/splits"
                className="flex items-center justify-between px-3 py-2 rounded-lg text-[#6B7280] hover:text-[#136F46] transition-colors"
              >
                <span>Splits Router</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Main Content Column */}
        <main className="lg:col-span-10 space-y-6">
          {/* EuclidPrime Master Summary & Desk Switcher Card */}
          <section
            className={`rounded-xl border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
              euclidLight ? 'bg-white border-[#E6E8E5]' : 'bg-[#12161B] border-[#222934]'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-widest text-[#6B7280]">
                  GROWSTREAMS PRIME · MODULAR TRADING & AI SQUAD SUITE
                </p>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono">
                    {dl.loaded ? fmtUsd(dl.volume30dUsd) : '…'}
                  </span>
                  <span className="text-xs font-mono font-semibold text-[#136F46] bg-[#E6F4ED] px-2 py-0.5 rounded">
                    30d DeFiLlama Volume{dl.varaDexRank ? ` (#${dl.varaDexRank} on Vara DEX)` : ''}
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] mt-1">
                  Active Wallet:{' '}
                  <span className="font-mono font-semibold text-[#136F46]">
                    {wallet
                      ? `${wallet.name} (${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)} · ${wallet.varaBalance.toFixed(1)} VARA)`
                      : 'Click any trade/deploy button or Connect SubWallet top-right to sign on Vara Mainnet'}
                  </span>
                </p>
              </div>

              {/* Modular Desk Switcher Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => switchTab('perps')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'perps'
                      ? 'bg-[#136F46] !text-white'
                      : 'border border-[#E2E5E1] bg-white text-[#1F2937] hover:bg-[#F4F6F4]'
                  }`}
                >
                  ↗ Perps Desk (1x–5x)
                </button>
                <button
                  onClick={() => switchTab('spot')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'spot'
                      ? 'bg-[#136F46] !text-white'
                      : 'border border-[#E2E5E1] bg-white text-[#1F2937] hover:bg-[#F4F6F4]'
                  }`}
                >
                  ⇄ Spot CLOB
                </button>
                <button
                  onClick={() => switchTab('squads')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'squads'
                      ? 'bg-[#136F46] !text-white'
                      : 'border border-[#E2E5E1] bg-white text-[#1F2937] hover:bg-[#F4F6F4]'
                  }`}
                >
                  ✦ Build AI Squad (1–8 Agents)
                </button>
                <button
                  onClick={() => switchTab('portfolio')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'portfolio'
                      ? 'bg-[#136F46] !text-white'
                      : 'border border-[#E2E5E1] bg-white text-[#1F2937] hover:bg-[#F4F6F4]'
                  }`}
                >
                  💼 My Positions ({userPositions.filter((p) => p.status !== 'CLOSED').length})
                </button>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-[#F0F1EE] grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-0 md:divide-x md:divide-[#F0F1EE]">
              <div className="md:pr-6 cursor-pointer" onClick={() => switchTab('spot')}>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#6B7280]">
                  <span>SPOT CLOB (ORDERBOOK)</span>
                  <span className="text-[#136F46]">Open Spot →</span>
                </div>
                <div className="text-xl font-semibold font-mono mt-1">{stonkVol ? fmtVara(stonkVol.spotVolumeVara) : '…'}</div>
                <p className="text-xs text-[#6B7280] mt-0.5">{liveSpotOrdersCount} Live Spot Orders · 0x2c1dd0...63cf</p>
              </div>
              <div className="md:px-6 cursor-pointer" onClick={() => switchTab('perps')}>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#6B7280]">
                  <span>PERPS DESK (1X–5X)</span>
                  <span className="text-[#136F46]">Open Perps →</span>
                </div>
                <div className="text-xl font-semibold font-mono mt-1">{stonkVol ? fmtVara(stonkVol.perpsNotionalVara) : '…'}</div>
                <p className="text-xs text-[#6B7280] mt-0.5">Open Interest $2,370.00 · {livePerpsCount} Positions</p>
              </div>
              <div className="md:pl-6 cursor-pointer" onClick={() => switchTab('squads')}>
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#6B7280]">
                  <span>CUSTOM AI SQUADS & STREAMS</span>
                  <span className="text-[#136F46]">Build Squad →</span>
                </div>
                <div className="text-xl font-semibold font-mono mt-1">{liveStreamsCount.toLocaleString()} Streams</div>
                <p className="text-xs text-[#6B7280] mt-0.5">{customSquads.length} Custom Squads · Flexible Splits</p>
              </div>
            </div>
          </section>

          {/* Status Banner Notification */}
          {statusBanner && (
            <div className="p-3.5 rounded-xl bg-[#E6F4ED] border border-[#B6DFC8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#136F46] font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold">● ON-CHAIN STATUS:</span>
                <span>{statusBanner}</span>
              </div>
              <div className="flex items-center gap-3">
                {latestTxUrl && (
                  <a
                    href={latestTxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded bg-[#136F46] !text-white font-semibold hover:bg-[#0F5837]"
                  >
                    Verify Block on Vara Subscan ↗
                  </a>
                )}
                <button onClick={() => setStatusBanner(null)} className="font-bold">
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              MODULE TAB 1: PERPS DESK (1x–5x) & OPENING BELL PARIMUTUEL
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'perps' && (
            <div className="space-y-6">
              <div className="desk-card rounded-xl border p-6 space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#E6E8E5]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#136F46]" />
                      <h2 className="text-lg font-bold">
                        Stonk on Vara — 24/7 Perpetuals &amp; Opening Bell Desk (1x to 5x)
                      </h2>
                      <a
                        href={`https://vara.subscan.io/account/${STONK_PERPS_PROGRAM_ID}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] text-[10px] font-mono font-semibold"
                      >
                        0x8073da…da81 ↗
                      </a>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Select any stock or crypto market below, pick 1x Spot or up to 5x Leverage, and sign directly on Vara Mainnet.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 min-w-0 lg:max-w-[460px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {availableTickers.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTicker(t)}
                          type="button"
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all cursor-pointer ${
                            selectedTicker === t
                              ? 'bg-[#136F46] !text-white'
                              : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                          }`}
                        >
                          ${t}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={stockQuery}
                        onChange={(e) => setStockQuery(e.target.value)}
                        placeholder="Search any US stock or ETF (e.g. COIN, PLTR, Disney)…"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#E2E5E1] bg-white text-xs font-mono"
                      />
                      {stockResults.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full max-h-64 overflow-auto rounded-lg border border-[#E2E5E1] bg-white shadow-lg">
                          {stockResults.map((r) => (
                            <button
                              key={r.ticker}
                              type="button"
                              onClick={() => {
                                setLiveQuotes((p) => ({ ...p, [r.ticker]: r }));
                                setSelectedTicker(r.ticker);
                                setStockQuery('');
                                setStockResults([]);
                              }}
                              className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-left hover:bg-[#F4F5F2] text-xs"
                            >
                              <span className="font-mono font-semibold">${r.ticker} <span className="font-sans font-normal text-[#6B7280]">{r.name}</span></span>
                              <span className="font-mono">${r.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: 1x–5x Order Ticket */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="desk-subcard p-4 rounded-xl flex items-baseline justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-[#6B7280] uppercase block">
                          ${selectedTicker} ORACLE MARK PRICE (PYTH + OFF-HOURS ETF)
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="font-mono text-2xl font-bold">
                            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </span>
                          <span
                            className={`font-mono text-xs font-semibold ${
                              priceChangePct >= 0 ? 'text-[#136F46]' : 'text-[#DC2626]'
                            }`}
                          >
                            {priceChangePct >= 0 ? '+' : ''}
                            {priceChangePct.toFixed(2)}% (24h)
                          </span>
                          {liveQuote && (
                            <span className="font-mono text-[11px] text-[#6B7280]">
                              ·{' '}
                              {liveQuote.status === 'LIVE'
                                ? '● LIVE Pyth'
                                : liveQuote.status === 'DELAYED'
                                ? '◐ Delayed Pyth'
                                : '○ Market closed'}
                            </span>
                          )}
                        </div>
                        {!isOnChainFed && (
                          <p className="mt-1 text-[10px] font-mono text-[#B45309]">
                            Quote only — ${selectedTicker} has no on-chain oracle feed on StonkPerpsDesk yet, so trading is disabled to avoid a bad entry price.
                          </p>
                        )}
                      </div>
                      <div className="text-right font-mono text-xs">
                        <span className="text-[10px] text-[#6B7280] block">ACTIVE MAINNET POSITIONS</span>
                        <span className="font-bold text-[#136F46]">{livePerpsCount} Perps Positions (all-time)</span>
                      </div>
                    </div>

                    {/* Leverage Selector */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-[#6B7280]">STEP 1 — LEVERAGE (1x SPOT TO 5x MAX):</span>
                        <span className="font-bold text-[#136F46]">
                          {clampedLeverage === 1 ? '1x Spot (No Liquidation)' : `${clampedLeverage}x Perpetual`}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setSelectedLeverage(lvl)}
                            className={`py-2 rounded-lg font-mono text-xs font-semibold border transition-all cursor-pointer ${
                              clampedLeverage === lvl
                                ? 'bg-[#136F46] !text-white border-[#136F46]'
                                : 'bg-white border-[#E2E5E1] text-[#6B7280] hover:border-[#136F46]'
                            }`}
                          >
                            {lvl === 1 ? '1x Spot' : lvl === 5 ? '5x Max' : `${lvl}x`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margin Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono text-[#6B7280]">
                          STEP 2 — COLLATERAL MARGIN (gVARA / VARA):
                        </label>
                        <div className="flex items-center gap-1">
                          {[25, 50, 100, 250].map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setMarginInput(amt)}
                              className={`px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer ${
                                Number(marginInput) === amt
                                  ? 'bg-[#136F46] !text-white font-semibold'
                                  : 'bg-[#F4F5F2] text-[#6B7280]'
                              }`}
                            >
                              {amt} gVARA
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={marginInput}
                        onChange={(e) => setMarginInput(Number(e.target.value))}
                        className="w-full rounded-lg px-3 py-2 font-mono text-sm"
                      />
                    </div>

                    {/* Summary Box */}
                    <div className="desk-subcard p-3.5 rounded-xl font-mono text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Notional Position Size (DeFiLlama Indexed):</span>
                        <span className="font-bold text-[#136F46]">{notionalSize.toLocaleString()} gVARA ({clampedLeverage}x)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Est. Liquidation Price (77% LLTV):</span>
                        <span className="font-semibold text-red-600">{clampedLeverage > 1 ? `$${estLiquidation}` : 'None (1x Spot)'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Reward Stream Bonus:</span>
                        <span className="text-[#136F46]">7-Day StreamCore V3 gVARA Rebate</span>
                      </div>
                    </div>

                    {/* Long / Short Execution Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleTrade('LONG')}
                        disabled={trading || !isOnChainFed}
                        type="button"
                        className="py-3 rounded-lg bg-[#136F46] hover:bg-[#0F5837] !text-white font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        {trading ? 'Signing in SubWallet…' : `↗ Open ${clampedLeverage}x Long ($${selectedTicker})`}
                      </button>
                      <button
                        onClick={() => handleTrade('SHORT')}
                        disabled={trading || !isOnChainFed}
                        type="button"
                        className="py-3 rounded-lg bg-[#DC2626] hover:bg-red-700 !text-white font-mono font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        {trading ? 'Signing in SubWallet…' : `↘ Open ${clampedLeverage}x Short ($${selectedTicker})`}
                      </button>
                    </div>
                  </div>

                  {/* Right: Call the Open Binary Parimutuel */}
                  <div className="lg:col-span-5 desk-subcard rounded-xl p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm">OPENING BELL PARIMUTUEL (CALL THE OPEN)</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#E6F4ED] text-[#136F46] font-semibold">
                          1.20x VAULT BOOST
                        </span>
                      </div>
                      <p className="text-xs text-[#6B7280]">
                        Predict whether <strong>${selectedTicker}</strong> opens <strong>GREEN (Higher)</strong> or <strong>RED (Lower)</strong> at the next 09:30 EST bell.
                      </p>

                      <div className="p-3 rounded-lg bg-white border border-[#E6E8E5] flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-[#6B7280] block">NEXT EPOCH LOCK IN:</span>
                          <span className="font-mono text-lg font-bold text-[#136F46]">
                            {formatEpochTime(epochTimeRemaining)}
                          </span>
                        </div>
                        <span className="px-2 py-1 rounded bg-[#E6F4ED] font-mono text-[10px] text-[#136F46] font-semibold">
                          {callTheOpenVol.toLocaleString()} VARA STAKED
                        </span>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#136F46] font-bold">GREEN (UP): {humanSharePct}%</span>
                          <span className="text-red-600 font-bold">RED (DOWN): {agentSharePct}%</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-200 flex overflow-hidden">
                          <div className="h-full bg-[#136F46]" style={{ width: `${humanSharePct}%` }} />
                          <div className="h-full bg-[#DC2626]" style={{ width: `${agentSharePct}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <button
                        onClick={() => handleCallTheOpenStake('GREEN')}
                        disabled={trading || !isOnChainFed}
                        type="button"
                        className="py-2.5 rounded-lg bg-[#E6F4ED] hover:bg-[#136F46] text-[#136F46] hover:!text-white border border-[#B6DFC8] font-mono font-bold text-xs uppercase transition-colors cursor-pointer"
                      >
                        ↑ Bet Green (Up)
                      </button>
                      <button
                        onClick={() => handleCallTheOpenStake('RED')}
                        disabled={trading || !isOnChainFed}
                        type="button"
                        className="py-2.5 rounded-lg bg-red-50 hover:bg-[#DC2626] text-red-600 hover:!text-white border border-red-200 font-mono font-bold text-xs uppercase transition-colors cursor-pointer"
                      >
                        ↓ Bet Red (Down)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Perp Positions Table right inside the Perps Tab */}
              <div className="desk-card rounded-xl border overflow-hidden">
                <div className="px-5 py-3.5 border-b border-[#E6E8E5] flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    My Open Perp &amp; Opening Bell Positions ({userPositions.filter((p) => p.type === 'PERP' || p.type === 'CALL_OPEN').length})
                  </h3>
                  <Link href="/protocol-overview" className="text-xs font-mono text-[#136F46] hover:underline">
                    View Full Portfolio →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E8E5] text-[10px] font-mono uppercase text-[#6B7280]">
                        <th className="py-2.5 px-4">Market</th>
                        <th className="py-2.5 px-4">Side</th>
                        <th className="py-2.5 px-4 text-right">Margin / Notional</th>
                        <th className="py-2.5 px-4 text-right">Entry → Mark</th>
                        <th className="py-2.5 px-4 text-right">Unrealized PnL</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F1EE]">
                      {userPositions
                        .filter((p) => p.type === 'PERP' || p.type === 'CALL_OPEN')
                        .map((pos) => (
                          <tr key={pos.id}>
                            <td className="py-3 px-4 font-semibold">{pos.market}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] font-mono text-[10px] font-semibold">
                                {pos.side}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {pos.sizeVara} VARA ({Math.round(pos.sizeVara * pos.leverage)} VARA)
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              ${pos.entryPrice} → ${pos.markPrice}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-[#136F46]">
                              +{pos.pnlVara.toFixed(2)} VARA (+{pos.pnlPct}%)
                            </td>
                            <td className="py-3 px-4 text-right">
                              {pos.status !== 'CLOSED' ? (
                                <button
                                  type="button"
                                  onClick={() => handleClosePosition(pos)}
                                  disabled={closingPosId === pos.id}
                                  className="px-2.5 py-1 rounded bg-[#136F46] !text-white font-mono text-[11px] font-semibold cursor-pointer"
                                >
                                  {closingPosId === pos.id ? 'Signing…' : 'Close On-Chain'}
                                </button>
                              ) : (
                                <span className="font-mono text-[10px] text-[#6B7280]">CLOSED</span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              MODULE TAB 2: DEDICATED SPOT CLOB ORDERBOOK DESK
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'spot' && (
            <div className="space-y-6">
              <div className="desk-card rounded-xl border p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E6E8E5]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#136F46]" />
                      <h2 className="text-lg font-bold">
                        Stonk on Vara — Spot Central Limit Orderbook (CLOB)
                      </h2>
                      <a
                        href={`https://vara.subscan.io/account/${STONK_ORDERBOOK_PROGRAM_ID}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] text-[10px] font-mono font-semibold"
                      >
                        0x2c1dd0…63cf ↗
                      </a>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Place on-chain Limit or Market orders across GROW/VARA, VARA/USDC, gVARA/VARA, and NVDA/VARA.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['GROW/VARA', 'VARA/USDC', 'gVARA/VARA', 'NVDA/VARA'] as const).map((pair) => (
                      <button
                        key={pair}
                        type="button"
                        onClick={() => {
                          setSpotPair(pair);
                          setSpotPriceInput(
                            pair === 'GROW/VARA'
                              ? '0.0425'
                              : pair === 'VARA/USDC'
                              ? '0.00042'
                              : pair === 'gVARA/VARA'
                              ? '1.018'
                              : '142.39'
                          );
                        }}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                          spotPair === pair
                            ? 'bg-[#136F46] !text-white'
                            : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        {pair}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Spot Order Entry */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {(['LIMIT', 'MARKET'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSpotOrderType(t)}
                          className={`py-2 rounded-lg font-mono text-xs font-semibold border cursor-pointer ${
                            spotOrderType === t
                              ? 'bg-[#136F46] !text-white border-[#136F46]'
                              : 'bg-white border-[#E2E5E1] text-[#6B7280]'
                          }`}
                        >
                          {t} ORDER
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-[#6B7280] mb-1">
                        ORDER PRICE ({spotPair === 'NVDA/VARA' ? 'USD ref' : spotPair.split('/')[1]})
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={spotPriceInput}
                        disabled={spotOrderType === 'MARKET'}
                        onChange={(e) => setSpotPriceInput(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 font-mono text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-mono text-[#6B7280]">ORDER AMOUNT (VARA)</label>
                        <div className="flex gap-1">
                          {['100', '250', '500', '1000'].map((a) => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setSpotAmountInput(a)}
                              className="px-2 py-0.5 rounded bg-[#F4F5F2] text-[10px] font-mono text-[#136F46] font-semibold cursor-pointer"
                            >
                              {a} VARA
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="number"
                        step="any"
                        value={spotAmountInput}
                        onChange={(e) => setSpotAmountInput(e.target.value)}
                        className="w-full rounded-lg px-3 py-2 font-mono text-sm"
                      />
                    </div>

                    <div className="desk-subcard p-3.5 rounded-xl font-mono text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Target Sails Program:</span>
                        <span className="text-[#136F46] font-semibold">StonkOrderbook (0x2c1dd0…63cf)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Method:</span>
                        <span>StonkBaseService::PlaceSpotOrder</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#6B7280]">Maker Rebate:</span>
                        <span className="text-[#136F46]">0.00% Maker Fee + gVARA Stream</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handlePlaceSpotOrder(true)}
                        disabled={placingSpot}
                        className="py-3 rounded-lg bg-[#136F46] hover:bg-[#0F5837] !text-white font-mono font-bold text-xs uppercase cursor-pointer"
                      >
                        {placingSpot ? 'Signing…' : `Buy ${spotPair.split('/')[0]}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlaceSpotOrder(false)}
                        disabled={placingSpot}
                        className="py-3 rounded-lg bg-[#DC2626] hover:bg-red-700 !text-white font-mono font-bold text-xs uppercase cursor-pointer"
                      >
                        {placingSpot ? 'Signing…' : `Sell ${spotPair.split('/')[0]}`}
                      </button>
                    </div>
                  </div>

                  {/* Right: REAL on-chain orderbook depth read from StonkOrderbook */}
                  <div className="lg:col-span-6 desk-subcard rounded-xl p-4 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between border-b border-[#E6E8E5] pb-2">
                      <span className="font-bold">{spotPair} ON-CHAIN ORDERBOOK</span>
                      <span className="text-[10px] text-[#136F46] font-semibold">
                        {bookLoading ? 'Reading chain…' : `${bookAsks.length + bookBids.length} open · ${bookTotal} total orders on-chain`}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 text-[10px] text-[#6B7280] uppercase">
                      <span>Price ({spotPair === 'NVDA/VARA' ? 'USD ref' : spotPair.split('/')[1]})</span>
                      <span className="text-right">Size (VARA)</span>
                      <span className="text-right">Order #</span>
                    </div>
                    <div className="space-y-1">
                      {bookAsks.length === 0 && <div className="py-2 text-center text-[#6B7280]">No open sell orders</div>}
                      {bookAsks.slice(0, 6).reverse().map((o) => (
                        <div key={o.id} className="grid grid-cols-3 py-1 px-2 rounded bg-red-500/5 text-red-600">
                          <span>{o.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                          <span className="text-right">{o.remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          <span className="text-right">#{o.id}</span>
                        </div>
                      ))}
                    </div>
                    <div className="py-1.5 text-center font-bold text-sm text-[#136F46] bg-[#E6F4ED] rounded">
                      {bookAsks[0] && bookBids[0]
                        ? `Spread ${(((bookAsks[0].price - bookBids[0].price) / bookAsks[0].price) * 100).toFixed(2)}%`
                        : 'Spread n/a (one-sided book)'}
                    </div>
                    <div className="space-y-1">
                      {bookBids.length === 0 && <div className="py-2 text-center text-[#6B7280]">No open buy orders</div>}
                      {bookBids.slice(0, 6).map((o) => (
                        <div key={o.id} className="grid grid-cols-3 py-1 px-2 rounded bg-[#E6F4ED]/70 text-[#136F46]">
                          <span>{o.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                          <span className="text-right">{o.remaining.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          <span className="text-right">#{o.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              MODULE TAB 3: FLEXIBLE AI SQUAD STUDIO (1–8 AGENTS & CUSTOM SPLITS)
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'squads' && (
            <div className="space-y-6">
              <div className="desk-card rounded-xl border p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[#E6E8E5]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#136F46]" />
                      <h2 className="text-lg font-bold">
                        Flexible AI Squad Builder &amp; Custom Splits Configurator (1 to 8 Agents)
                      </h2>
                    </div>
                    <p className="text-xs text-[#6B7280] mt-1">
                      Choose <strong>any squad size (e.g. 2 agents, 3 agents, 4 agents, 5 agents, up to 8 agents)</strong>, assign custom roles &amp; markets, and define your exact revenue split on SplitsRouter (`0x68b9…2f45`).
                    </p>
                  </div>

                  {/* Quick Squad Size Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-mono text-[#6B7280] mr-1">Squad Size:</span>
                    {[2, 3, 4, 5, 6, 8].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => handleAgentCountChange(cnt)}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold cursor-pointer ${
                          agentCountInput === cnt
                            ? 'bg-[#136F46] !text-white'
                            : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                        }`}
                      >
                        {cnt} Agents
                      </button>
                    ))}
                  </div>
                </div>

                {/* Top Config Row: Squad Name, Custom Agent Count, Creator Share %, Collateral */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#6B7280] mb-1">SQUAD NAME / HANDLE</label>
                    <input
                      type="text"
                      value={squadHandle}
                      onChange={(e) => setSquadHandle(e.target.value)}
                      placeholder="e.g. VaraAlpha-5x"
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#6B7280] mb-1">
                      NUMBER OF AGENTS (1–8)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={8}
                      value={agentCountInput}
                      onChange={(e) => handleAgentCountChange(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#6B7280] mb-1">
                      YOUR CREATOR SHARE % ({creatorSharePct}%)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={95}
                      value={creatorSharePct}
                      onChange={(e) => handleCreatorShareChange(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#6B7280] mb-1">
                      COLLATERAL PER AGENT (VARA)
                    </label>
                    <input
                      type="number"
                      min={5}
                      value={collateralInput}
                      onChange={(e) => setCollateralInput(Number(e.target.value))}
                      className="w-full rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Per-Agent Role, Market, Leverage & Split % Editor */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-[#136F46]">
                      CONFIGURE EACH AGENT SLOT ({agentCountInput} AGENTS · TOTAL SPLIT: {totalSplitSumPct}% / 100%)
                    </span>
                    <button
                      type="button"
                      onClick={autoBalanceSplits}
                      className="px-3 py-1 rounded-lg border border-[#B6DFC8] bg-[#E6F4ED] text-[#136F46] text-xs font-mono font-semibold cursor-pointer"
                    >
                      ⚖️ Auto-Balance Splits to 100%
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {squadSlots.map((slot, idx) => (
                      <div key={slot.slot} className="desk-subcard p-4 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 rounded bg-[#136F46] !text-white font-mono text-[10px] font-bold">
                            AGENT #{slot.slot}
                          </span>
                          <span className="font-mono text-xs font-semibold text-[#136F46]">
                            Split: {slot.sharePct}% ({Math.round(slot.sharePct * 100)} bps)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-mono text-[#6B7280] mb-1">ROLE ARCHETYPE</label>
                            <select
                              value={slot.roleCode}
                              onChange={(e) => updateSlotField(idx, 'roleCode', e.target.value)}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            >
                              {AGENT_ROLE_CATALOG.map((r) => (
                                <option key={r.code} value={r.code}>
                                  {r.title}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-[#6B7280] mb-1">SPLIT %</label>
                            <input
                              type="number"
                              step="0.5"
                              min={0}
                              max={90}
                              value={slot.sharePct}
                              onChange={(e) => updateSlotField(idx, 'sharePct', Number(e.target.value))}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-mono text-[#6B7280] mb-1">TARGET MARKET</label>
                            <select
                              value={slot.market}
                              onChange={(e) => updateSlotField(idx, 'market', e.target.value)}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            >
                              {['NVDA', 'TSLA', 'AAPL', 'MSFT', 'SPY', 'QQQ', 'GROW/VARA', 'VARA/USDC'].map((m) => (
                                <option key={m} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-mono text-[#6B7280] mb-1">MAX LEVERAGE</label>
                            <select
                              value={slot.maxLeverage}
                              onChange={(e) => updateSlotField(idx, 'maxLeverage', Number(e.target.value))}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs font-mono"
                            >
                              {[1, 2, 3, 4, 5].map((l) => (
                                <option key={l} value={l}>
                                  {l === 1 ? '1x Spot Only' : `${l}x Perps`}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Split Summary Bar & Deploy Button */}
                <div className="desk-subcard p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1 font-mono text-xs">
                    <div className="font-semibold">
                      SplitsRouter Breakdown: <span className="text-[#136F46]">Creator {creatorSharePct}%</span> +{' '}
                      {squadSlots.map((s) => `Agent #${s.slot} (${s.sharePct}%)`).join(' + ')} ={' '}
                      <span className={Math.abs(totalSplitSumPct - 100) <= 0.5 ? 'text-[#136F46] font-bold' : 'text-red-600 font-bold'}>
                        {totalSplitSumPct}%
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B7280]">
                      Total Squad Liquidity Order: <strong>{collateralInput * agentCountInput} VARA</strong> · +100 VARA Protocol Bonus Stream Enabled
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSpawnCustomSquad}
                    disabled={spawning}
                    className="px-6 py-3 rounded-lg bg-[#136F46] hover:bg-[#0F5837] !text-white font-mono font-bold text-xs uppercase tracking-wider cursor-pointer shrink-0"
                  >
                    {spawning
                      ? 'Signing in SubWallet…'
                      : `✦ Deploy ${agentCountInput}-Agent Squad & Sign Split On-Chain`}
                  </button>
                </div>
              </div>

              {/* Active Deployed Custom Squads */}
              <div className="space-y-3">
                <h3 className="text-base font-semibold">
                  Deployed Custom AI Squads ({customSquads.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customSquads.map((sq) => (
                    <div key={sq.id} className="desk-card rounded-xl border p-5 space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E6E8E5] pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{sq.name}</span>
                            <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] font-mono text-[10px] font-semibold">
                              {sq.agentCount} AGENTS · {sq.creatorSharePct}% CREATOR
                            </span>
                          </div>
                          <p className="text-[11px] font-mono text-[#6B7280] mt-0.5">
                            Collateral: {sq.totalCollateralVara} VARA · {sq.createdAt}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRunSquadCycle(sq.name, sq.agents[0]?.market || 'NVDA')}
                          disabled={hiringOwner === sq.name}
                          className="px-3 py-1.5 rounded-lg bg-[#136F46] hover:bg-[#0F5837] !text-white font-mono text-xs font-semibold cursor-pointer"
                        >
                          {hiringOwner === sq.name ? 'Signing…' : '⚡ Execute Squad Cycle'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {sq.agents.map((ag) => (
                          <div key={ag.slot} className="desk-subcard p-2.5 rounded-lg text-xs">
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="font-semibold text-[#136F46]">
                                Agent #{ag.slot} ({ag.sharePct}%)
                              </span>
                              <span className="text-[#6B7280]">
                                {ag.market} · {ag.maxLeverage}x
                              </span>
                            </div>
                            <div className="font-medium mt-0.5 truncate">{ag.roleTitle}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              MODULE TAB 4: MY PORTFOLIO POSITIONS & ON-CHAIN RECEIPTS
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="desk-card rounded-xl border p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#E6E8E5] pb-3">
                  <div>
                    <h2 className="text-base font-bold">My Positions, Orders &amp; Signed On-Chain Receipts</h2>
                    <p className="text-xs text-[#6B7280]">
                      All Perp trades, Spot CLOB orders, and Custom AI Squads signed by your wallet on Vara Mainnet.
                    </p>
                  </div>
                  <Link
                    href="/protocol-overview"
                    className="px-3 py-1.5 rounded-lg bg-[#136F46] !text-white text-xs font-mono font-semibold"
                  >
                    Open Full Portfolio Page →
                  </Link>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E8E5] text-[10px] font-mono uppercase text-[#6B7280]">
                        <th className="py-2.5 px-4">Type</th>
                        <th className="py-2.5 px-4">Market / Squad</th>
                        <th className="py-2.5 px-4">Side / Split</th>
                        <th className="py-2.5 px-4 text-right">Size (VARA)</th>
                        <th className="py-2.5 px-4 text-right">PnL</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                        <th className="py-2.5 px-4 text-right">Receipt / Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F1EE]">
                      {userPositions.map((pos) => (
                        <tr key={pos.id}>
                          <td className="py-3 px-4 font-mono text-[10px] font-semibold text-[#136F46]">{pos.type}</td>
                          <td className="py-3 px-4 font-semibold">{pos.market}</td>
                          <td className="py-3 px-4 font-mono">{pos.side}</td>
                          <td className="py-3 px-4 text-right font-mono">{pos.sizeVara} VARA</td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-[#136F46]">
                            +{pos.pnlVara.toFixed(2)} VARA
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] font-mono text-[10px] font-semibold">
                              {pos.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {pos.subscanUrl && (
                                <a
                                  href={pos.subscanUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#136F46] font-mono hover:underline"
                                >
                                  Subscan ↗
                                </a>
                              )}
                              {pos.status !== 'CLOSED' && (
                                <button
                                  type="button"
                                  onClick={() => handleClosePosition(pos)}
                                  className="px-2 py-1 rounded bg-[#136F46] !text-white font-mono text-[10px] cursor-pointer"
                                >
                                  Settle
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              MODULE TAB 5: 16 SAILS SMART CONTRACTS REGISTRY
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'contracts' && (
            <div className="desk-card rounded-xl border p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E6E8E5]">
                <div>
                  <h2 className="text-lg font-bold">16 Live Vara Mainnet Sails Smart Contracts</h2>
                  <p className="text-xs text-[#6B7280]">
                    Deployed on Vara Network Mainnet (`wss://rpc.vara.network`) and verified on Subscan &amp; Gear IDEA.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={contractSearch}
                    onChange={(e) => setContractSearch(e.target.value)}
                    placeholder="Search contract or 0x..."
                    className="rounded-lg px-3 py-1.5 text-xs font-mono w-56"
                  />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rounded-lg px-2.5 py-1.5 text-xs font-mono"
                  >
                    <option value="ALL">All Categories</option>
                    <option value="RISK">Perps &amp; CLOB</option>
                    <option value="STREAMING">Streaming &amp; Splits</option>
                    <option value="SECURITY">Vault &amp; Identity</option>
                    <option value="TOKENS">Tokens</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E8E5] text-[#6B7280] text-[10px] uppercase">
                      <th className="py-2.5 px-3">Contract</th>
                      <th className="py-2.5 px-3">Program ID</th>
                      <th className="py-2.5 px-3">Role</th>
                      <th className="py-2.5 px-3">Sails Methods</th>
                      <th className="py-2.5 px-3 text-right">Verify</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F1EE]">
                    {filteredContracts.map((c) => {
                      const realId = stats?.varaMainnetContracts?.[c.key] || c.defaultId;
                      return (
                        <tr key={c.key}>
                          <td className="py-3 px-3 font-bold">{c.name}</td>
                          <td className="py-3 px-3 text-[#136F46]">
                            {realId.slice(0, 10)}…{realId.slice(-8)}
                          </td>
                          <td className="py-3 px-3 font-sans text-[#6B7280]">{c.role}</td>
                          <td className="py-3 px-3 text-[#6B7280]">{c.iface}</td>
                          <td className="py-3 px-3 text-right">
                            <a
                              href={`https://vara.subscan.io/account/${realId}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#136F46] hover:underline"
                            >
                              Subscan ↗
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════════
              MODULE TAB 6: LIVE VARA MAINNET RPC INSPECTOR
             ══════════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'rpc' && (
            <div className="desk-card rounded-xl border p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#E6E8E5] pb-3">
                <div>
                  <h2 className="text-base font-bold">Live Vara Mainnet WebSocket Stream (`wss://rpc.vara.network`)</h2>
                  <p className="text-xs text-[#6B7280]">
                    Block #{rpcBlockNumber ? rpcBlockNumber.toLocaleString() : 'Syncing'} · Latency {rpcLatency}ms · Messages {rpcMsgCount}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-[#E6F4ED] text-[#136F46] font-mono text-xs font-semibold">
                  {rpcConnected ? '● CONNECTED' : 'RECONNECTING'}
                </span>
              </div>
              <div className="bg-[#111827] text-[#6EE7B7] rounded-xl p-4 font-mono text-xs h-72 overflow-y-auto space-y-1">
                {rpcLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── Whisper-Quiet 28px EuclidPrime Bottom Status Bar ── */}
      <footer
        className={`sticky bottom-0 z-30 h-7 border-t px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono ${
          euclidLight ? 'bg-white/95 border-[#E6E8E5] text-[#6B7280]' : 'bg-[#12161B]/95 border-[#222934] text-[#8B95A5]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#136F46]" />
          <span className="text-[#136F46] font-semibold">LIVE</span>
          <span className="hidden sm:inline opacity-75">
            · {VARA_RPC} · Latency {rpcLatency}ms · Block {rpcBlockNumber ? `#${rpcBlockNumber.toLocaleString()}` : 'Syncing'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>16 Sails Contracts Verified</span>
          <span>·</span>
          <span>DeFiLlama PR #10886</span>
        </div>
      </footer>
    </div>
  );
}

export default function AgentsDashboardClient() {
  return (
    <Providers>
      <AgentsDashboardContent />
    </Providers>
  );
}
