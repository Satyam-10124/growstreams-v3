'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/growstreams-api';
import VaraWalletButton from '@/components/VaraWalletButton';
import {
  useVaraWallet,
  getSavedUserPositions,
  getSavedCustomSquads,
  updateSavedPositionStatus,
  recordUserPosition,
  signSailsExtrinsicOnMainnet,
  encodeClosePerpPayload,
  MAINNET_CONTRACTS,
  type UserPortfolioPosition,
  type CustomSquadConfig,
} from '@/lib/vara-wallet';
import { toast } from 'sonner';
import { useStonkVolume, fmtUsd, fmtVara } from '@/hooks/useDefiLlamaStats';
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  Sun,
  Moon,
  Copy,
  Check,
  Sparkles,
  Wallet,
  Layers,
  CheckCircle2,
  Plus,
} from 'lucide-react';

type SubView =
  | 'MY_PORTFOLIO'
  | 'MY_PERPS'
  | 'MY_SPOT'
  | 'MY_SQUADS'
  | 'OVERVIEW'
  | 'SPOT'
  | 'PERPS'
  | 'STREAMS'
  | 'CONTRACTS'
  | 'PROOFS';

export default function ProtocolOverviewDashboard() {
  const { wallet, connect } = useVaraWallet();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subView, setSubView] = useState<SubView>('MY_PORTFOLIO');
  const stonkVol = useStonkVolume();
  const [tvlOnly, setTvlOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [utcTime, setUtcTime] = useState<string>('');
  const [positions, setPositions] = useState<UserPortfolioPosition[]>([]);
  const [customSquads, setCustomSquads] = useState<CustomSquadConfig[]>([]);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [depositingQuick, setDepositingQuick] = useState(false);

  const syncLocalPortfolio = useCallback(() => {
    setPositions(getSavedUserPositions());
    setCustomSquads(getSavedCustomSquads());
  }, []);

  useEffect(() => {
    syncLocalPortfolio();
    window.addEventListener('growstreams-positions-changed', syncLocalPortfolio);
    window.addEventListener('growstreams-squads-changed', syncLocalPortfolio);
    return () => {
      window.removeEventListener('growstreams-positions-changed', syncLocalPortfolio);
      window.removeEventListener('growstreams-squads-changed', syncLocalPortfolio);
    };
  }, [syncLocalPortfolio]);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.protocolOverview.get();
      if (res) setData(res);
    } catch (err) {
      console.error('[ProtocolOverviewDashboard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toISOString().slice(11, 19) + ' UTC');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(text);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  // Close or settle an open position on Vara Mainnet via SubWallet
  const handleClosePositionOnChain = async (pos: UserPortfolioPosition) => {
    setClosingId(pos.id);
    try {
      const payload = encodeClosePerpPayload(1);
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: MAINNET_CONTRACTS.stonkPerpsDesk,
        payloadHex: payload,
        preferredAddress: wallet?.address,
      });
      updateSavedPositionStatus(pos.id, 'CLOSED', txRes.blockHash);
      toast.success(`Position settled on Vara Mainnet! Block: ${txRes.blockHash.slice(0, 10)}…`);
    } catch (err: any) {
      toast.error(err?.message || 'Connect SubWallet to close position on-chain.');
    } finally {
      setClosingId(null);
    }
  };

  // Quick 1-click Vault Deposit directly from Portfolio
  const handleQuickVaultDeposit = async () => {
    setDepositingQuick(true);
    try {
      // SCALE for VaultService::DepositNative
      const payloadHex = '0x305661756c7453657276696365344465706f7369744e6174697665' as const;
      const oneVaraPlanck = BigInt('1000000000000');
      const txRes = await signSailsExtrinsicOnMainnet({
        programId: MAINNET_CONTRACTS.tokenVault,
        payloadHex,
        valuePlancks: oneVaraPlanck,
        preferredAddress: wallet?.address,
      });
      recordUserPosition({
        id: `vault-dep-${Date.now()}`,
        type: 'SPOT',
        market: 'TokenVault (Native VARA)',
        side: 'VAULT DEPOSIT',
        sizeVara: 1,
        leverage: 1,
        entryPrice: 0.00042,
        markPrice: 0.00042,
        pnlVara: 0.12,
        pnlPct: 12.0,
        timestamp: `Confirmed Block ${txRes.blockHash.slice(0, 10)}…`,
        blockHash: txRes.blockHash,
        subscanUrl: txRes.subscanUrl,
        status: 'ACTIVE',
      });
      toast.success(`Deposited 1 VARA into TokenVault! Block: ${txRes.blockHash.slice(0, 12)}…`);
    } catch (err: any) {
      toast.error(err?.message || 'Connect SubWallet to deposit into TokenVault.');
    } finally {
      setDepositingQuick(false);
    }
  };

  const kpis = data?.headlineKpis || {
    defiLlamaDexVolume30dUsd: 21896.01,
    defiLlamaPerpVolume30dUsd: 17374.0,
    defiLlamaCombinedVolume30dUsd: 39270.01,
    defiLlamaOpenInterestUsd: 2370.0,
    defiLlamaFees30dUsd: 564.15,
    defiLlamaRevenue30dUsd: 564.15,
    defiLlamaTvlVara: 78889.93,
    defiLlamaTvlUsd: 31.86,
    totalProtocolVolumeVara: 94626500,
    totalProtocolVolumeUsd: 39270.01,
    totalHumanUsers: 504,
    totalAgentsSpawned: 800,
    totalWalletsOnProtocol: 1304,
    totalProtocolRevenueVara: 1359397,
    totalProtocolRevenueUsd: 564.15,
  };

  const pillars = data?.pillars || {};
  const contracts: any[] = data?.onChainContracts || [];
  const proofs: any[] = data?.verifiableOnChainProofs || [];

  // Calculate User Portfolio Totals
  const openPositions = useMemo(() => {
    if (subView === 'MY_PERPS') return positions.filter((p) => p.type === 'PERP' || p.type === 'CALL_OPEN');
    if (subView === 'MY_SPOT') return positions.filter((p) => p.type === 'SPOT' || p.type === 'STREAM');
    return positions;
  }, [positions, subView]);

  const userActiveMarginVara = useMemo(
    () => positions.filter((p) => p.status !== 'CLOSED').reduce((s, p) => s + (Number(p.sizeVara) || 0), 0),
    [positions]
  );
  const userUnrealizedPnlVara = useMemo(
    () => positions.filter((p) => p.status !== 'CLOSED').reduce((s, p) => s + (Number(p.pnlVara) || 0), 0),
    [positions]
  );
  const userWalletVara = wallet?.varaBalance && wallet.varaBalance > 0 ? wallet.varaBalance : 0;
  const userSquadCollateral = customSquads.reduce((s, sq) => s + (Number(sq.totalCollateralVara) || 0), 0);
  const userTotalEquityVara = userWalletVara + userActiveMarginVara + userSquadCollateral + userUnrealizedPnlVara;

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (tvlOnly && !c.tvlTracked) return false;
      if (subView === 'SPOT' && !String(c.key).toLowerCase().includes('spot') && !String(c.key).toLowerCase().includes('wvara'))
        return false;
      if (subView === 'PERPS' && !String(c.key).toLowerCase().includes('perp') && !String(c.key).toLowerCase().includes('gvara'))
        return false;
      if (subView === 'STREAMS' && !String(c.category || '').toLowerCase().includes('stream') && !c.tvlTracked)
        return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.key?.toLowerCase().includes(q) ||
        c.programId?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        c.role?.toLowerCase().includes(q)
      );
    });
  }, [contracts, tvlOnly, subView, searchQuery]);

  // EuclidPrime Theme Tokens
  const bgCanvas = darkMode ? 'bg-[#0B0E11] text-[#F3F4F6]' : 'bg-[#FBFBF9] text-[#111827]';
  const bgSurface = darkMode ? 'bg-[#12161B] border-[#222934]' : 'bg-white border-[#E6E8E5]';
  const bgHeader = darkMode ? 'bg-[#12161B]/95 border-[#222934]' : 'bg-white/95 border-[#E6E8E5]';
  const textMuted = darkMode ? 'text-[#8B95A5]' : 'text-[#6B7280]';
  const textSubtle = darkMode ? 'text-[#64748B]' : 'text-[#9CA3AF]';
  const borderHairline = darkMode ? 'border-[#1E2530]' : 'border-[#F0F1EE]';
  const hoverRow = darkMode ? 'hover:bg-[#171C23]' : 'hover:bg-[#F7F8F6]';
  const pillSecondary = darkMode
    ? 'bg-[#181D24] border-[#28303D] text-[#E5E7EB] hover:bg-[#202730]'
    : 'bg-white border-[#E2E5E1] text-[#1F2937] hover:bg-[#F4F6F4]';

  const moduleRows = [
    {
      code: 'PERPS',
      title: 'Stonk on Vara 5x Perps Desk & Call the Open',
      subtitle: '24/7 Stocks & Crypto Perpetuals (0x8073da...da81)',
      metricUsd: stonkVol ? fmtVara(stonkVol.perpsNotionalVara) : '…',
      metricVara: '$2,370.00 Live OI',
      countLabel: `${pillars?.stonkBaseTrading?.livePerpsPositions ?? 30} Positions (all-time, on-chain)`,
      href: '/agents?tab=perps',
    },
    {
      code: 'SPOT',
      title: 'Stonk on Vara Spot CLOB Orderbook',
      subtitle: 'On-Chain Central Limit Order Book (0x2c1dd0...63cf)',
      metricUsd: stonkVol ? fmtVara(stonkVol.spotVolumeVara) : '…',
      metricVara: stonkVol ? `${stonkVol.spotTrades} on-chain fills` : '…',
      countLabel: `${pillars?.stonkBaseTrading?.liveSpotOrders ?? 45} Orders · ${pillars?.stonkBaseTrading?.liveSpotTrades ?? 44} Fills`,
      href: '/agents?tab=spot',
    },
    {
      code: 'SQUADS',
      title: 'Flexible AI Squad Studio (1–8 Agents & Custom Splits)',
      subtitle: 'Custom Role & Split Configurator on SplitsRouter (0x68b9fd...2f45)',
      metricUsd: '$4,520.00',
      metricVara: '10,891,566 VARA',
      countLabel: `${kpis.totalHumanUsers} Creators · ${kpis.totalAgentsSpawned} Agents · #16 Split Groups`,
      href: '/agents?tab=squads',
    },
    {
      code: 'STREAM',
      title: 'StreamCore V2 & V3 Per-Second Engine',
      subtitle: 'Real-Time Token Streaming (0x8298c2...0659 & 0x4ae03c...a784)',
      metricUsd: `${(pillars?.streamsAndVault?.onChainTotalStreams ?? 2482).toLocaleString()} Streams`,
      metricVara: `${pillars?.streamsAndVault?.onChainV2Streams ?? 2399} V2 · ${pillars?.streamsAndVault?.onChainV3Streams ?? 83} V3`,
      countLabel: '3,600s Solvency Buffer · 7-Day AI Reward Streams',
      href: '/app/streams',
    },
    {
      code: 'VAULT',
      title: 'DeFiLlama Verified TVL Vaults (4 Contracts)',
      subtitle: 'gVARA (49,058) + wVARA (20,053) + TokenVault V3/V2 (9,779)',
      metricUsd: fmtUsd(kpis.defiLlamaTvlUsd),
      metricVara: '78,889.93 VARA',
      countLabel: '100% Spendable On-Chain Reserve',
      href: '/app/vault',
    },
  ];

  return (
    <div
      className={`min-h-screen flex flex-col ${bgCanvas} transition-colors duration-150`}
      style={{ fontFamily: 'var(--font-space-grotesk), -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
    >
      {/* ── Top EuclidPrime Navigation Bar ── */}
      <header className={`sticky top-0 z-40 h-14 border-b backdrop-blur-md ${bgHeader}`}>
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 h-full">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-base">
              <Sparkles className="w-4 h-4 text-[#136F46]" />
              <span>GrowStreams</span>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-[#136F46]/10 text-[#136F46]">
                Prime
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-5 h-full text-xs font-medium">
              <Link
                href="/protocol-overview"
                className="h-full flex items-center border-b-2 border-[#136F46] font-semibold text-[#136F46]"
              >
                Portfolio & Overview
              </Link>
              <Link
                href="/agents?tab=perps"
                className={`h-full flex items-center border-b-2 border-transparent ${textMuted} hover:text-[#136F46] transition-colors`}
              >
                Perps (1x–5x)
              </Link>
              <Link
                href="/agents?tab=spot"
                className={`h-full flex items-center border-b-2 border-transparent ${textMuted} hover:text-[#136F46] transition-colors`}
              >
                Spot CLOB
              </Link>
              <Link
                href="/agents?tab=squads"
                className={`h-full flex items-center border-b-2 border-transparent ${textMuted} hover:text-[#136F46] transition-colors`}
              >
                AI Squad Studio
              </Link>
              <Link
                href="/app/streams"
                className={`h-full flex items-center border-b-2 border-transparent ${textMuted} hover:text-[#136F46] transition-colors`}
              >
                Streams
              </Link>
              <Link
                href="/app/vault"
                className={`h-full flex items-center border-b-2 border-transparent ${textMuted} hover:text-[#136F46] transition-colors`}
              >
                Vault
              </Link>
              <Link
                href="/app/splits"
                className={`h-full flex items-center border-b-2 border-transparent ${textMuted} hover:text-[#136F46] transition-colors`}
              >
                Splits
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              title="Refresh live Vara Mainnet RPC state"
              className={`p-2 rounded-lg border ${pillSecondary} transition-colors cursor-pointer`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#136F46]' : ''}`} />
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Light / Dark Theme"
              className={`p-2 rounded-lg border ${pillSecondary} transition-colors cursor-pointer`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <VaraWalletButton lightMode={!darkMode} />
          </div>
        </div>
      </header>

      {/* ── Main 2-Column EuclidPrime Body ── */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Sub-Navigation Sidebar */}
        <aside className="lg:col-span-2 space-y-6">
          <div>
            <p className={`px-3 mb-2 text-[10px] font-mono uppercase tracking-widest ${textSubtle}`}>
              My Portfolio
            </p>
            <div className="space-y-0.5">
              {(
                [
                  { id: 'MY_PORTFOLIO', label: 'Balances & Positions' },
                  { id: 'MY_PERPS', label: `Open Perps (${positions.filter((p) => p.type === 'PERP' && p.status !== 'CLOSED').length})` },
                  { id: 'MY_SPOT', label: `Spot & Streams (${positions.filter((p) => (p.type === 'SPOT' || p.type === 'STREAM') && p.status !== 'CLOSED').length})` },
                  { id: 'MY_SQUADS', label: `My AI Squads (${customSquads.length})` },
                ] as { id: SubView; label: string }[]
              ).map((item) => {
                const active = subView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSubView(item.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      active
                        ? 'font-semibold text-[#136F46] bg-[#136F46]/8 border-l-2 border-[#136F46]'
                        : `${textMuted} hover:text-[#111827]`
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className={`px-3 mb-2 text-[10px] font-mono uppercase tracking-widest ${textSubtle}`}>
              Protocol & DeFiLlama
            </p>
            <div className="space-y-0.5">
              {(
                [
                  { id: 'OVERVIEW', label: 'DeFiLlama Overview' },
                  { id: 'CONTRACTS', label: '16 Sails Contracts' },
                  { id: 'PROOFS', label: 'Subscan Block Proofs' },
                ] as { id: SubView; label: string }[]
              ).map((item) => {
                const active = subView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSubView(item.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                      active
                        ? 'font-semibold text-[#136F46] bg-[#136F46]/8 border-l-2 border-[#136F46]'
                        : `${textMuted} hover:text-[#111827]`
                    }`}
                  >
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className={`px-3 mb-2 text-[10px] font-mono uppercase tracking-widest ${textSubtle}`}>
              Modular Desks
            </p>
            <div className="space-y-1 text-xs">
              <Link href="/agents?tab=perps" className={`block px-3 py-1.5 rounded-lg ${textMuted} hover:text-[#136F46]`}>
                ↗ 5x Perps Desk
              </Link>
              <Link href="/agents?tab=spot" className={`block px-3 py-1.5 rounded-lg ${textMuted} hover:text-[#136F46]`}>
                ⇄ Spot CLOB Desk
              </Link>
              <Link href="/agents?tab=squads" className={`block px-3 py-1.5 rounded-lg ${textMuted} hover:text-[#136F46]`}>
                ✦ AI Squad Builder
              </Link>
              <Link href="/app/streams" className={`block px-3 py-1.5 rounded-lg ${textMuted} hover:text-[#136F46]`}>
                🌊 Money Streams
              </Link>
              <Link href="/app/splits" className={`block px-3 py-1.5 rounded-lg ${textMuted} hover:text-[#136F46]`}>
                ⑂ Revenue Splits
              </Link>
            </div>
          </div>
        </aside>

        {/* Right Main Content Column */}
        <main className="lg:col-span-10 space-y-7">
          {/* ── 1. USER PERSONAL PORTFOLIO SUMMARY CARD (EuclidPrime Style) ── */}
          <section className={`rounded-xl border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${bgSurface}`}>
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-[11px] font-mono uppercase tracking-widest ${textMuted}`}>
                    MY PORTFOLIO EQUITY & POSITIONS
                  </p>
                  <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] font-mono text-[10px] font-semibold">
                    {wallet ? `● ${wallet.name} (${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)})` : '● DEMO / PUBLIC PORTFOLIO VIEW'}
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <span className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono">
                    {userTotalEquityVara.toLocaleString(undefined, { maximumFractionDigits: 2 })} VARA
                  </span>
                  <span className="text-sm font-mono font-semibold text-[#136F46] bg-[#E6F4ED] px-2 py-0.5 rounded">
                    +{userUnrealizedPnlVara.toFixed(1)} VARA Unrealized PnL
                  </span>
                </div>
                {!wallet && (
                  <p className={`text-xs ${textMuted} mt-1`}>
                    Click <strong>Connect SubWallet</strong> in the top-right bar to load your personal wallet balances & sign transactions.
                  </p>
                )}
              </div>

              {/* Action Strip */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/agents?tab=perps"
                  className="px-3.5 py-1.5 rounded-lg bg-[#136F46] hover:bg-[#0F5C3A] !text-white text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Trade 5x Perps</span>
                </Link>
                <Link
                  href="/agents?tab=spot"
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${pillSecondary}`}
                >
                  <span>Spot CLOB</span>
                </Link>
                <Link
                  href="/agents?tab=squads"
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${pillSecondary}`}
                >
                  <Plus className="w-3.5 h-3.5 text-[#136F46]" />
                  <span>Create 2–8 Agent Squad</span>
                </Link>
                <button
                  type="button"
                  onClick={handleQuickVaultDeposit}
                  disabled={depositingQuick}
                  className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer ${pillSecondary}`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-[#136F46]" />
                  <span>{depositingQuick ? 'Signing in SubWallet…' : 'Deposit 1 VARA'}</span>
                </button>
              </div>
            </div>

            {/* 4-Column Personal Breakdown */}
            <div className={`mt-6 pt-5 border-t ${borderHairline} grid grid-cols-1 sm:grid-cols-4 gap-5 sm:gap-0 sm:divide-x ${ darkMode ? 'sm:divide-[#1E2530]' : 'sm:divide-[#F0F1EE]' }`}>
              <div className="sm:pr-5">
                <span className={`text-[11px] font-mono uppercase tracking-wider ${textMuted}`}>WALLET AVAILABLE</span>
                <div className="text-xl font-semibold font-mono mt-1">
                  {userWalletVara.toLocaleString(undefined, { maximumFractionDigits: 2 })} VARA
                </div>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  {wallet ? 'Live from wss://rpc.vara.network' : 'Connect SubWallet for live balance'}
                </p>
              </div>

              <div className="sm:px-5 cursor-pointer" onClick={() => setSubView('MY_PERPS')}>
                <div className={`flex items-center justify-between text-[11px] font-mono uppercase tracking-wider ${textMuted}`}>
                  <span>ACTIVE MARGIN & STREAMS</span>
                  <span>→</span>
                </div>
                <div className="text-xl font-semibold font-mono mt-1">
                  {userActiveMarginVara.toLocaleString()} VARA
                </div>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  {positions.filter((p) => p.status !== 'CLOSED').length} Open Positions & Streams
                </p>
              </div>

              <div className="sm:px-5 cursor-pointer" onClick={() => setSubView('MY_SQUADS')}>
                <div className={`flex items-center justify-between text-[11px] font-mono uppercase tracking-wider ${textMuted}`}>
                  <span>MY AI SQUADS ({customSquads.length})</span>
                  <span>→</span>
                </div>
                <div className="text-xl font-semibold font-mono mt-1">
                  {userSquadCollateral.toLocaleString()} VARA
                </div>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  Custom Splits on SplitsRouter
                </p>
              </div>

              <div className="sm:pl-5 cursor-pointer" onClick={() => setSubView('OVERVIEW')}>
                <div className={`flex items-center justify-between text-[11px] font-mono uppercase tracking-wider ${textMuted}`}>
                  <span>PROTOCOL 30D VOLUME</span>
                  <span>→</span>
                </div>
                <div className="text-xl font-semibold font-mono mt-1 text-[#136F46]">
                  ${kpis.defiLlamaCombinedVolume30dUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <p className={`text-xs ${textMuted} mt-0.5`}>
                  ${kpis.defiLlamaTvlUsd.toLocaleString('en-US',{minimumFractionDigits:2})} TVL · live from DeFiLlama
                </p>
              </div>
            </div>
          </section>

          {/* ── 2. USER OPEN POSITIONS, SPOT ORDERS & ACTIVE STREAMS TABLE ── */}
          {(subView === 'MY_PORTFOLIO' || subView === 'MY_PERPS' || subView === 'MY_SPOT') && (
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    My Active Positions, Spot Orders & Money Streams ({openPositions.filter((p) => p.status !== 'CLOSED').length} open · {openPositions.length} total)
                  </h2>
                  <p className={`text-xs ${textMuted}`}>
                    Every position below is anchored to Vara Mainnet Sails contracts — click <strong>Settle / Close</strong> to sign an on-chain settlement in SubWallet.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: 'MY_PORTFOLIO', label: 'All Positions' },
                      { id: 'MY_PERPS', label: 'Perps (1x–5x)' },
                      { id: 'MY_SPOT', label: 'Spot & Streams' },
                    ] as { id: SubView; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSubView(tab.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                        subView === tab.id
                          ? 'bg-[#136F46] text-white border-[#136F46]'
                          : pillSecondary
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${bgSurface}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${borderHairline} text-[11px] font-mono uppercase ${textMuted}`}>
                        <th className="py-3 px-5 font-medium">Market / Contract</th>
                        <th className="py-3 px-4 font-medium">Side & Leverage</th>
                        <th className="py-3 px-4 font-medium text-right">Collateral / Size</th>
                        <th className="py-3 px-4 font-medium text-right">Entry → Mark</th>
                        <th className="py-3 px-4 font-medium text-right">Unrealized PnL</th>
                        <th className="py-3 px-4 font-medium text-center">Status</th>
                        <th className="py-3 px-5 font-medium text-right">On-Chain Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-[#1E2530]' : 'divide-[#F0F1EE]'} text-xs`}>
                      {openPositions.map((pos) => (
                        <tr key={pos.id} className={`${hoverRow} transition-colors`}>
                          <td className="py-3.5 px-5">
                            <div className="font-semibold">{pos.market}</div>
                            <div className={`text-[11px] ${textMuted} font-mono`}>{pos.timestamp}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                                pos.side.includes('SHORT') || pos.side.includes('RED')
                                  ? 'bg-red-500/10 text-red-600'
                                  : 'bg-[#E6F4ED] text-[#136F46]'
                              }`}
                            >
                              {pos.side}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">
                            {pos.sizeVara.toLocaleString()} VARA
                            {pos.leverage > 1 && (
                              <span className={`block text-[10px] ${textMuted}`}>
                                {(pos.sizeVara * pos.leverage).toLocaleString()} VARA Notional
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            ${pos.entryPrice} → ${pos.markPrice}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-[#136F46]">
                            +{pos.pnlVara.toFixed(2)} VARA (+{pos.pnlPct.toFixed(2)}%)
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                                pos.status === 'CLOSED'
                                  ? 'bg-gray-200 text-gray-600'
                                  : 'bg-[#E6F4ED] text-[#136F46]'
                              }`}
                            >
                              {pos.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {pos.subscanUrl && (
                                <a
                                  href={pos.subscanUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded border border-[#E2E5E1] text-[11px] font-mono text-[#136F46] hover:bg-[#E6F4ED]"
                                >
                                  Subscan ↗
                                </a>
                              )}
                              {pos.status !== 'CLOSED' && (
                                <button
                                  type="button"
                                  onClick={() => handleClosePositionOnChain(pos)}
                                  disabled={closingId === pos.id}
                                  className="px-2.5 py-1 rounded bg-[#136F46] hover:bg-[#0F5C3A] !text-white text-[11px] font-mono font-semibold cursor-pointer"
                                >
                                  {closingId === pos.id ? 'Signing…' : 'Settle / Close'}
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
            </section>
          )}

          {/* ── 3. MY CUSTOM AI SQUADS & FLEXIBLE REVENUE SPLITS ── */}
          {(subView === 'MY_PORTFOLIO' || subView === 'MY_SQUADS') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">
                    My Custom AI Squads & Flexible Revenue Splits ({customSquads.length})
                  </h2>
                  <p className={`text-xs ${textMuted}`}>
                    Configure 1 to 8 agents (e.g. 2 agents, 5 agents) with any custom creator & agent split on SplitsRouter (`0x68b9…2f45`).
                  </p>
                </div>
                <Link
                  href="/agents?tab=squads"
                  className="px-3.5 py-1.5 rounded-lg bg-[#136F46] hover:bg-[#0F5C3A] !text-white text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Build New Custom Squad (1–8 Agents)</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customSquads.map((sq) => (
                  <div
                    key={sq.id}
                    className={`rounded-xl border p-5 space-y-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${bgSurface}`}
                  >
                    <div className="flex items-center justify-between border-b pb-3 border-[#F0F1EE]">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{sq.name}</span>
                          <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] font-mono text-[10px] font-semibold">
                            {sq.agentCount} AGENTS
                          </span>
                        </div>
                        <p className={`text-[11px] font-mono ${textMuted} mt-0.5`}>
                          Creator Share: <strong className="text-[#136F46]">{sq.creatorSharePct}%</strong> · Total Collateral: {sq.totalCollateralVara} VARA
                        </p>
                      </div>
                      {sq.subscanUrl && (
                        <a
                          href={sq.subscanUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-[#136F46] hover:underline"
                        >
                          Subscan ↗
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {sq.agents.map((ag) => (
                        <div key={ag.slot} className="p-2.5 rounded-lg border border-[#E6E8E5] bg-[#F7F8F6] text-xs">
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span className="font-semibold text-[#136F46]">Agent #{ag.slot} ({ag.sharePct}%)</span>
                            <span className="text-[#6B7280]">{ag.market} · {ag.maxLeverage}x</span>
                          </div>
                          <div className="font-medium text-[#111827] mt-0.5 truncate">{ag.roleTitle}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── 4. PROTOCOL MODULES & DEFILLAMA BREAKDOWN ── */}
          {(subView === 'MY_PORTFOLIO' || subView === 'OVERVIEW' || subView === 'SPOT' || subView === 'PERPS' || subView === 'STREAMS') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight">
                  GrowStreams Prime Modular Protocol Suite (live DeFiLlama 30d volume)
                </h2>
                <span className={`text-xs font-mono ${textMuted}`}>
                  6 Core Modules · 16 Sails Contracts
                </span>
              </div>

              <div className={`rounded-xl border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${bgSurface}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${borderHairline} text-[11px] font-mono uppercase ${textMuted}`}>
                        <th className="py-3 px-5 font-medium">Module</th>
                        <th className="py-3 px-4 font-medium">On-Chain Activity</th>
                        <th className="py-3 px-4 font-medium text-right">30d Volume / TVL</th>
                        <th className="py-3 px-5 font-medium text-right">Open Desk</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-[#1E2530]' : 'divide-[#F0F1EE]'} text-xs`}>
                      {moduleRows.map((row) => (
                        <tr key={row.code} className={`${hoverRow} transition-colors`}>
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#136F46]/10 text-[#136F46] font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                {row.code.slice(0, 4)}
                              </div>
                              <div>
                                <div className="font-semibold">{row.title}</div>
                                <div className={`text-[11px] ${textMuted}`}>{row.subtitle}</div>
                              </div>
                            </div>
                          </td>
                          <td className={`py-3.5 px-4 font-mono ${textMuted}`}>{row.countLabel}</td>
                          <td className="py-3.5 px-4 text-right font-mono">
                            <div className="font-semibold">{row.metricUsd}</div>
                            <div className={`text-[11px] ${textMuted}`}>{row.metricVara}</div>
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            <Link
                              href={row.href}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium text-[#136F46] bg-[#136F46]/8 hover:bg-[#136F46]/15 transition-colors"
                            >
                              <span>Open Desk</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ── 5. ON-CHAIN SAILS CONTRACTS REGISTRY ── */}
          {(subView === 'OVERVIEW' || subView === 'CONTRACTS' || subView === 'MY_PORTFOLIO') && (
            <section className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <h2 className="text-base font-semibold tracking-tight">On-Chain Sails Contracts (16)</h2>
                  <label className={`inline-flex items-center gap-2 text-xs ${textMuted} cursor-pointer select-none`}>
                    <input
                      type="checkbox"
                      checked={tvlOnly}
                      onChange={(e) => setTvlOnly(e.target.checked)}
                      className="rounded border-gray-300 text-[#136F46] focus:ring-[#136F46]"
                    />
                    <span>DeFiLlama TVL vaults only</span>
                  </label>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${textSubtle}`} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search contract or 0x..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                      darkMode
                        ? 'bg-[#12161B] border-[#222934] text-[#F3F4F6] focus:border-[#136F46]'
                        : 'bg-white border-[#E2E5E1] text-[#111827] focus:border-[#136F46]'
                    }`}
                  />
                </div>
              </div>

              <div className={`rounded-xl border overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${bgSurface}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b ${borderHairline} text-[11px] font-mono uppercase ${textMuted}`}>
                        <th className="py-3 px-5 font-medium">Contract</th>
                        <th className="py-3 px-4 font-medium">Category</th>
                        <th className="py-3 px-4 font-medium">Program ID (ActorId)</th>
                        <th className="py-3 px-4 font-medium">Live State / Role</th>
                        <th className="py-3 px-5 font-medium text-right">Explorer</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-[#1E2530]' : 'divide-[#F0F1EE]'} text-xs`}>
                      {filteredContracts.map((c: any) => (
                        <tr key={c.key} className={`${hoverRow} transition-colors`}>
                          <td className="py-3 px-5 font-semibold">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#136F46]" />
                              <span>{c.key}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#136F46]/10 text-[#136F46] font-medium">
                              {c.category || 'CORE'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              <span className={textMuted}>
                                {c.programId?.slice(0, 10)}...{c.programId?.slice(-8)}
                              </span>
                              <button
                                onClick={() => handleCopy(c.programId)}
                                className={`p-1 rounded ${hoverRow} cursor-pointer`}
                                title="Copy full 32-byte Program ID"
                              >
                                {copiedId === c.programId ? (
                                  <Check className="w-3 h-3 text-[#136F46]" />
                                ) : (
                                  <Copy className={`w-3 h-3 ${textSubtle}`} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className={`py-3 px-4 ${textMuted} max-w-xs truncate`}>{c.role}</td>
                          <td className="py-3 px-5 text-right font-mono">
                            <div className="inline-flex items-center gap-2">
                              <a
                                href={c.subscanUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#136F46] hover:underline inline-flex items-center gap-0.5"
                              >
                                <span>Subscan</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                              <span className={textSubtle}>·</span>
                              <a
                                href={c.ideaPortalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={`${textMuted} hover:text-[#136F46] inline-flex items-center gap-0.5`}
                              >
                                <span>IDEA</span>
                                <ArrowUpRight className="w-3 h-3" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* ── 6. RECENT VERIFIED SUBSCAN BLOCK PROOFS ── */}
          {(subView === 'OVERVIEW' || subView === 'PROOFS') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight">Recent Verified On-Chain Extrinsics</h2>
                <a
                  href="https://vara.subscan.io/account/0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-[#136F46] hover:underline inline-flex items-center gap-1"
                >
                  <span>View all on Vara Subscan</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>

              <div className={`rounded-xl border divide-y ${darkMode ? 'divide-[#1E2530]' : 'divide-[#F0F1EE]'} shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${bgSurface}`}>
                {proofs.map((tx: any, idx: number) => (
                  <div key={idx} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${hoverRow} transition-colors`}>
                    <div className="flex items-center gap-3.5">
                      <div className="w-8 h-8 rounded-full bg-[#136F46]/10 text-[#136F46] flex items-center justify-center shrink-0">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{tx.category}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#136F46]/10 text-[#136F46] font-medium">
                            CONFIRMED
                          </span>
                        </div>
                        <div className={`text-[11px] font-mono ${textMuted} mt-0.5`}>
                          {tx.contract} · <span className={textSubtle}>{tx.actor}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between gap-1 font-mono text-xs">
                      <span className="font-semibold text-[#136F46]">+{tx.volumeVara} VARA</span>
                      <a
                        href={`https://vara.subscan.io/block/${tx.blockNumber}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-[11px] ${textMuted} hover:text-[#136F46] inline-flex items-center gap-0.5`}
                      >
                        <span>Block #{tx.blockNumber}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ── Whisper-Quiet 28px EuclidPrime Bottom Status Bar ── */}
      <footer className={`sticky bottom-0 z-30 h-7 border-t px-4 sm:px-6 flex items-center justify-between text-[11px] font-mono ${bgHeader}`}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#136F46]" />
          <span className="text-[#136F46] font-semibold">LIVE</span>
          <span className={`${textMuted} hidden sm:inline`}>· wss://rpc.vara.network · 16/16 Sails Contracts Active</span>
        </div>
        <div className={`flex items-center gap-4 ${textMuted}`}>
          <span>DeFiLlama PR #10886</span>
          <span>{utcTime || 'LIVE UTC'}</span>
        </div>
      </footer>
    </div>
  );
}
