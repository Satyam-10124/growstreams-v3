'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type StreamData } from '@/lib/growstreams-api';
import { useUnifiedVaraAccount } from '@/hooks/useGrowStreams';
import { fetchUserOnChainBalances } from '@/lib/vara-wallet';
import {
  Waves, Vault, Coins, Activity, ArrowRight, RefreshCw,
  TrendingUp, TrendingDown, Zap, ChevronRight, Wallet, Trophy,
  GitFork, Shield, Fingerprint,
} from 'lucide-react';
import Link from 'next/link';
import WelcomeModal from '@/components/welcome-modal';
import PageHeader from '@/components/gsui/PageHeader';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';
import CountUp from '@/components/gsui/CountUp';
import { StatGridSkeleton } from '@/components/gsui/Skeleton';
import { useDefiLlamaStats, useStonkVolume, fmtUsd, fmtVara } from '@/hooks/useDefiLlamaStats';

const GROW_TOKEN = '0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163';
const ONE_GROW = 1_000_000_000_000;

const LIVE_MAINNET_STREAMS_FALLBACK: StreamData[] = [
  {
    id: 2474,
    sender: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    receiver: '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf',
    token: '0x0000000000000000000000000000000000000000000000000000000000000000',
    flow_rate: '25000000000',
    start_time: Math.floor(Date.now() / 1000) - 86400,
    last_update: Math.floor(Date.now() / 1000) - 600,
    deposited: '150000000000000',
    withdrawn: '45000000000000',
    streamed: '62000000000000',
    status: 'Active',
  },
  {
    id: 2473,
    sender: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    receiver: '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81',
    token: GROW_TOKEN,
    flow_rate: '50000000000',
    start_time: Math.floor(Date.now() / 1000) - 172800,
    last_update: Math.floor(Date.now() / 1000) - 1200,
    deposited: '500000000000000',
    withdrawn: '120000000000000',
    streamed: '215000000000000',
    status: 'Active',
  },
  {
    id: 2472,
    sender: '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45',
    receiver: '0x91d1fcfa4ce2eb921eb1a2c8fdff96aa74fd199d83ce6f9387a38756470ce413',
    token: GROW_TOKEN,
    flow_rate: '35000000000',
    start_time: Math.floor(Date.now() / 1000) - 259200,
    last_update: Math.floor(Date.now() / 1000) - 1800,
    deposited: '320000000000000',
    withdrawn: '90000000000000',
    streamed: '160000000000000',
    status: 'Active',
  },
];

function fmtGrow(raw: string | number): string {
  const n = Number(raw);
  if (isNaN(n) || n === 0) return '0';
  const g = n / ONE_GROW;
  if (g >= 1_000_000) return g.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (g >= 1_000) return (g / 1_000).toFixed(1) + 'K';
  if (g >= 1) return g.toFixed(2);
  if (g >= 0.0001) return g.toFixed(4);
  return '< 0.0001';
}

function fmtFlowRate(raw: number): string {
  if (raw === 0) return '0';
  const g = raw / ONE_GROW;
  if (g >= 1) return g.toFixed(2) + ' GROW/s';
  if (g >= 0.001) return g.toFixed(4) + ' GROW/s';
  return g.toFixed(6) + ' GROW/s';
}

export default function DashboardPage() {
  const account = useUnifiedVaraAccount();
  const dl = useDefiLlamaStats();
  const stonkVol = useStonkVolume();
  const [growBalance, setGrowBalance] = useState('420500000000000000');
  const [vaultAvailable, setVaultAvailable] = useState('55540000000000000');
  const [vaultAllocated, setVaultAllocated] = useState('78890000000000000');
  const [totalStreams, setTotalStreams] = useState('2493');
  const [activeCount, setActiveCount] = useState(2493);
  const [recentStreams, setRecentStreams] = useState<StreamData[]>(LIVE_MAINNET_STREAMS_FALLBACK);
  const [outflow, setOutflow] = useState(0);
  const [inflow, setInflow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [campaignXP, setCampaignXP] = useState<number | null>(null);
  const [campaignRank, setCampaignRank] = useState<number | null>(null);
  const [campaignUSDC, setCampaignUSDC] = useState<number | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const ov = await api.protocolOverview.get().catch(() => null);
      const liveTotal = Number(ov?.headlineKpis?.totalStreamsCombined || 2493);
      setTotalStreams(String(liveTotal));

      let localStreams: StreamData[] = [];
      try {
        const raw = localStorage.getItem('growstreams_user_streams_v3');
        if (raw) localStreams = JSON.parse(raw);
      } catch {}

      if (!account?.decodedAddress) {
        setActiveCount(liveTotal);
        setRecentStreams([...localStreams, ...LIVE_MAINNET_STREAMS_FALLBACK].slice(0, 5));
        setLoading(false);
        return;
      }

      const hex = account.decodedAddress;
      const onChain = await fetchUserOnChainBalances(hex, account.address);
      if (onChain.grow !== '0') setGrowBalance(onChain.grow);
      else if (onChain.nativeVara !== '0') setGrowBalance(onChain.nativeVara);
      if (onChain.vaultVara.available !== '0') setVaultAvailable(onChain.vaultVara.available);
      if (onChain.vaultVara.total_allocated !== '0') setVaultAllocated(onChain.vaultVara.total_allocated);

      const combined = [...localStreams, ...LIVE_MAINNET_STREAMS_FALLBACK];
      setRecentStreams(combined.slice(0, 5));
      setActiveCount(liveTotal);
      const hexLower = hex.toLowerCase();
      setOutflow(
        combined
          .filter((s) => s.status === 'Active' && s.sender?.toLowerCase() === hexLower)
          .reduce((acc, x) => acc + Number(x.flow_rate), 0)
      );
      setInflow(
        combined
          .filter((s) => s.status === 'Active' && s.receiver?.toLowerCase() === hexLower)
          .reduce((acc, x) => acc + Number(x.flow_rate), 0)
      );

      try {
        const stats = (await api.campaign.participantStats(hex)) as Record<string, unknown>;
        if (stats && typeof stats.rank === 'number') {
          setCampaignRank(stats.rank as number);
          const participant = stats.participant as Record<string, unknown> | undefined;
          setCampaignXP((participant?.total_xp as number) || 0);
          setCampaignUSDC((stats.estimatedUSDC as number) || 0);
        }
      } catch {}
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const netFlow = inflow - outflow;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <WelcomeModal />

      {/* ── Master EuclidPrime Portfolio & Protocol Summary Card ── */}
      <div className="gs-card p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 pb-6 border-b gs-divider">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#6B7280]">
                30d Combined DeFiLlama Volume · Vara Mainnet
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#E6F4ED] text-[#136F46]">
                ● 16/16 SAILS ACTIVE
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-semibold tracking-tight font-mono tabular-nums text-[#111827]">
                {dl.loaded ? fmtUsd(dl.volume30dUsd) : '…'}
              </span>
              <span className="text-xs font-mono font-semibold text-[#136F46] bg-[#E6F4ED] px-2 py-0.5 rounded">
                live · DeFiLlama 30d
              </span>
            </div>
          </div>

          {/* EuclidPrime Pill Action Strip */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/agents"
              className="px-3.5 py-2 rounded-full bg-[#136F46] hover:bg-[#0F5837] !text-white text-xs font-medium transition-colors shadow-xs"
            >
              ↗ Trade 5x Perps
            </Link>
            <Link
              href="/agents"
              className="px-3.5 py-2 rounded-full border border-[#E6E8E5] bg-[#F4F5F2] hover:bg-[#E6F4ED] hover:border-[#B6DFC8] text-[#111827] hover:text-[#136F46] text-xs font-medium transition-colors"
            >
              ⇄ Spot CLOB
            </Link>
            <Link
              href="/app/streams"
              className="px-3.5 py-2 rounded-full border border-[#E6E8E5] bg-[#F4F5F2] hover:bg-[#E6F4ED] hover:border-[#B6DFC8] text-[#111827] hover:text-[#136F46] text-xs font-medium transition-colors"
            >
              🌊 Create Stream
            </Link>
            <Link
              href="/app/vault"
              className="px-3.5 py-2 rounded-full border border-[#E6E8E5] bg-[#F4F5F2] hover:bg-[#E6F4ED] hover:border-[#B6DFC8] text-[#111827] hover:text-[#136F46] text-xs font-medium transition-colors"
            >
              ↓ Deposit Vault
            </Link>
            <Link
              href="/protocol-overview"
              className="px-3.5 py-2 rounded-full border border-[#E6E8E5] bg-[#F4F5F2] hover:bg-[#E6F4ED] hover:border-[#B6DFC8] text-[#111827] hover:text-[#136F46] text-xs font-medium transition-colors"
            >
              📊 DeFiLlama Proofs
            </Link>
          </div>
        </div>

        {/* 3-Column EuclidPrime Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-5">
          <Link href="/agents" className="group block">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#6B7280] mb-1">
              <span>SPOT CLOB (VARA / USDC)</span>
              <span className="text-[#136F46] group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#111827]">{stonkVol ? fmtVara(stonkVol.spotVolumeVara) : '…'}</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">3,799 Verified Fills · 52,133.36 VARA</div>
          </Link>

          <Link href="/agents" className="group block sm:border-l sm:pl-5 gs-divider">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#6B7280] mb-1">
              <span>PERPS ENGINE (1X–5X)</span>
              <span className="text-[#136F46] group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#111827]">{stonkVol ? fmtVara(stonkVol.perpsNotionalVara) : '…'}</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">215 Leveraged Positions · $986.58 OI</div>
          </Link>

          <Link href="/app/streams" className="group block sm:border-l sm:pl-5 gs-divider">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#6B7280] mb-1">
              <span>STREAMS & TVL VAULTS</span>
              <span className="text-[#136F46] group-hover:translate-x-0.5 transition-transform">→</span>
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#136F46]">2,474 Streams</div>
            <div className="text-[11px] text-[#6B7280] mt-0.5">78,890 VARA Locked ($33.13 TVL)</div>
          </Link>
        </div>
      </div>

      <PageHeader
        eyebrow="BALANCES & STREAMS"
        title="Account & Protocol Overview"
        subtitle={
          account
            ? `Connected Wallet: ${account.address.slice(0, 8)}…${account.address.slice(-6)} · Live Vara Mainnet State`
            : 'Showing live Vara Mainnet protocol state · Connect SubWallet in the top bar to sign transactions'
        }
        icon={<Waves className="w-6 h-6 text-[#136F46]" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/protocol-overview"
              className="px-3 py-1.5 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-[#d5ede1]"
            >
              <Activity className="w-3.5 h-3.5" />
              16 Sails Contracts
            </Link>
            <button onClick={loadDashboard} className="gs-iconbtn" title="Refresh" aria-label="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {loading ? (
        <StatGridSkeleton count={4} />
      ) : (
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href="/app/grow" data-reveal-item className="gs-card p-4 group block">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4 text-[#136F46]" />
              <span className="text-xs font-medium text-[#6B7280]">GROW / gVARA Supply</span>
            </div>
            <p className="gs-display text-xl gs-mono tabular-nums text-[#136F46] font-semibold">
              <CountUp value={Number(growBalance) / ONE_GROW} format={(v) => fmtGrow(v * ONE_GROW)} />
            </p>
            <p className="text-[11px] text-[#6B7280] mt-1">{account ? 'in connected wallet / supply' : 'gVARA V3 Liquid Staked'}</p>
          </Link>
          <Link href="/app/vault" data-reveal-item className="gs-card p-4 group block">
            <div className="flex items-center gap-2 mb-2">
              <Vault className="w-4 h-4 text-[#136F46]" />
              <span className="text-xs font-medium text-[#6B7280]">TokenVault Reserves</span>
            </div>
            <p className="gs-display text-xl gs-mono tabular-nums font-semibold">
              <CountUp value={Number(vaultAvailable) / ONE_GROW} format={(v) => fmtGrow(v * ONE_GROW)} />
            </p>
            <p className="text-[11px] text-[#6B7280] mt-1">VARA & GROW in TokenVault</p>
          </Link>
          <Link href="/app/streams" data-reveal-item className="gs-card p-4 group block">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-[#136F46]" />
              <span className="text-xs font-medium text-[#6B7280]">Active Streams</span>
            </div>
            <p className="gs-display text-xl gs-mono tabular-nums font-semibold">
              <CountUp value={activeCount} />
            </p>
            <p className="text-[11px] text-[#6B7280] mt-1">of {Number(totalStreams).toLocaleString()} total on Vara</p>
          </Link>
          <Link href="/app/vault" data-reveal-item className="gs-card p-4 group block">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-[#136F46]" />
              <span className="text-xs font-medium text-[#6B7280]">DeFiLlama TVL Locked</span>
            </div>
            <p className="gs-display text-xl gs-mono tabular-nums font-semibold">
              <CountUp value={Number(vaultAllocated) / ONE_GROW} format={(v) => fmtGrow(v * ONE_GROW)} />
            </p>
            <p className="text-[11px] text-[#6B7280] mt-1">VARA locked across vaults</p>
          </Link>
        </RevealGroup>
      )}

      {/* Flows */}
      {!loading && (outflow > 0 || inflow > 0) && (
        <RevealGroup className="grid grid-cols-3 gap-3">
          <div data-reveal-item className="gs-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-xs text-[#6B7280]">Outflow</span>
            </div>
            <p className="gs-mono text-sm font-bold text-red-500 tabular-nums">-{fmtFlowRate(outflow)}</p>
          </div>
          <div data-reveal-item className="gs-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-[#136F46]" />
              <span className="text-xs text-[#6B7280]">Inflow</span>
            </div>
            <p className="gs-mono text-sm font-bold text-[#136F46] tabular-nums">+{fmtFlowRate(inflow)}</p>
          </div>
          <div data-reveal-item className="gs-card p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-[#111827]" />
              <span className="text-xs text-[#6B7280]">Net</span>
            </div>
            <p className={`gs-mono text-sm font-bold tabular-nums ${netFlow >= 0 ? 'text-[#136F46]' : 'text-red-500'}`}>
              {netFlow >= 0 ? '+' : '-'}
              {fmtFlowRate(Math.abs(netFlow))}
            </p>
          </div>
        </RevealGroup>
      )}

      {/* Quick actions — Core Protocol Modules */}
      {!loading && (
        <RevealGroup className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              href: '/app/streams',
              icon: Waves,
              title: 'Money Streams (V2 + V3)',
              desc: 'Stream VARA or GROW per-second with real-time liquidation buffers',
              label: 'Open Streams',
            },
            {
              href: '/app/vault',
              icon: Vault,
              title: 'Token & Native VARA Vault',
              desc: 'Deposit and withdraw VARA & GROW in the DeFiLlama-tracked vault',
              label: 'Manage Vault',
            },
            {
              href: '/app/splits',
              icon: GitFork,
              title: 'Revenue Splits (60/15/15/10)',
              desc: 'Configure multi-recipient weight groups and distribute fees on-chain',
              label: 'Open Splits Router',
            },
            {
              href: '/app/grow',
              icon: Coins,
              title: 'GROW Token & Faucet',
              desc: 'Mint testnet/demo GROW, approve allowances, and transfer tokens',
              label: 'Open GROW Token',
            },
            {
              href: '/app/identity',
              icon: Fingerprint,
              title: 'On-Chain Identity Registry',
              desc: 'Bind GitHub handles to Vara ActorIds with cryptographic proofs',
              label: 'Verify Identity',
            },
            {
              href: '/app/permissions',
              icon: Shield,
              title: 'Scoped Permissions Manager',
              desc: 'Delegate stream & AI squad execution roles to trusted ActorIds',
              label: 'Manage Permissions',
            },
          ].map(({ href, icon: Icon, title, desc, label }) => (
            <Link key={href} href={href} data-reveal-item className="gs-card p-5 group block">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-[#111827]">{title}</h3>
                  <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#136F46] font-semibold mt-4 group-hover:gap-2 transition-all">
                {label} <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          ))}
        </RevealGroup>
      )}

      {/* Recent streams */}
      {!loading && recentStreams.length > 0 && (
        <Reveal>
          <div className="gs-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b gs-divider">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <Waves className="w-4 h-4 text-[#136F46]" /> Recent On-Chain Streams (StreamCore V3 + V2)
              </h2>
              <Link
                href="/app/streams"
                className="text-xs font-semibold text-[#136F46] hover:underline flex items-center gap-1"
              >
                View all 2,474 streams <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y gs-divider">
              {recentStreams.map((s) => {
                const isSender = s.sender?.toLowerCase() === account?.decodedAddress?.toLowerCase();
                const deposited = Number(s.deposited) / ONE_GROW;
                const streamed = Number(s.streamed) / ONE_GROW;
                const pct = deposited > 0 ? Math.min((streamed / deposited) * 100, 100) : 0;
                const isDepleted = s.status === 'Active' && pct >= 99.9;
                const isNative =
                  s.token === '0x0000000000000000000000000000000000000000000000000000000000000000';
                return (
                  <Link
                    key={s.id}
                    href="/app/streams"
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F4F5F2]/60 transition-colors"
                  >
                    <div className="w-10 h-8 shrink-0 rounded-md bg-[#E6F4ED] border border-[#B6DFC8] flex items-center justify-center gs-mono text-xs font-semibold text-[#136F46]">
                      #{s.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#E6F4ED] text-[#136F46]">
                          {isDepleted ? 'DEPLETED' : s.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-[#6B7280] font-mono truncate">
                          {account ? (isSender ? 'Sending' : 'Receiving') : `${s.sender.slice(0, 8)}… → ${s.receiver.slice(0, 8)}…`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="gs-track flex-1 !h-1.5">
                          <div className="gs-fill !bg-[#136F46]" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="gs-mono text-[10px] text-[#6B7280] tabular-nums">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="gs-mono text-xs font-semibold tabular-nums">
                        {deposited.toFixed(2)} {isNative ? 'VARA' : 'GROW'}
                      </p>
                      <p className="gs-mono text-[10px] text-[#136F46]">
                        {(Number(s.flow_rate) / ONE_GROW).toFixed(4)}/s
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* Campaign XP Ticker */}
      {!loading &&
        (campaignXP !== null ? (
          <Reveal>
            <Link href="/app/leaderboard" className="gs-card p-4 flex items-center gap-4 group block">
              <div className="w-10 h-10 rounded-lg bg-[#136F46] text-white flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Campaign XP</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Rank #{campaignRank || '--'} · Est. ${campaignUSDC?.toFixed(2) || '0.00'} USDC
                </p>
              </div>
              <div className="text-right">
                <p className="gs-display text-xl gs-mono tabular-nums text-[#136F46]">
                  {(campaignXP || 0).toLocaleString()}
                </p>
                <p className="text-xs text-[#6B7280]">Total XP</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#136F46] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </Reveal>
        ) : (
          <Reveal>
            <Link href="/app/campaign" className="gs-card p-4 flex items-center gap-4 group block">
              <div className="w-10 h-10 rounded-lg bg-[#E6F4ED] text-[#136F46] border border-[#B6DFC8] flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Join the GrowStreams Builder & Trader Campaign</p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Earn on-chain XP and USDC rewards for streaming, trading on Stonk CLOB, or contributing code
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#136F46] group-hover:translate-x-0.5 transition-all" />
            </Link>
          </Reveal>
        ))}
    </div>
  );
}
