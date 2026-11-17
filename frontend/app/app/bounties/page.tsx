'use client';

import { useState, FormEvent } from 'react';
import { useBountyActions, useUnifiedVaraAccount } from '@/hooks/useGrowStreams';
import { MAINNET_CONTRACTS } from '@/lib/vara-wallet';
import { toast } from 'sonner';
import {
  Briefcase,
  Search,
  Plus,
  ExternalLink,
  CheckCircle2,
  ShieldCheck,
  Coins,
  Users,
  Clock,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';

interface OnChainBountyCard {
  id: number;
  title: string;
  org: string;
  track: 'SAILS RUST' | 'AI AGENTS' | 'FRONTEND' | 'DEFI';
  budgetGrow: number;
  maxFlowPerDay: number;
  minScore: number;
  status: 'OPEN' | 'CLAIMED' | 'STREAMING';
  submissions: number;
  shortDesc: string;
  blockHash?: string;
}

const VERIFIED_MAINNET_BOUNTIES: OnChainBountyCard[] = [
  {
    id: 47,
    title: 'Build Autonomous Sails Delayed-Message Liquidation Keeper',
    org: 'GrowStreams Core Protocol',
    track: 'SAILS RUST',
    budgetGrow: 25000,
    maxFlowPerDay: 1200,
    minScore: 80,
    status: 'OPEN',
    submissions: 4,
    shortDesc:
      'Implement a self-waking Sails actor using msg::send_delayed to monitor StreamCore V3 buffers and execute gas-refunded liquidations.',
  },
  {
    id: 46,
    title: 'Integrate Custom Multi-Agent Perps Hedging Strategy on StonkPerpsDesk',
    org: 'EuclidPrime AI Syndicate',
    track: 'AI AGENTS',
    budgetGrow: 18000,
    maxFlowPerDay: 900,
    minScore: 75,
    status: 'OPEN',
    submissions: 6,
    shortDesc:
      'Build an open-source multi-agent strategy module routing delta-neutral NVDA & TSLA Perps spreads through SplitsRouter.',
  },
  {
    id: 45,
    title: 'SubWallet & Talisman Deep-Link Mobile Signing SDK Widget',
    org: 'Vara Ecosystem Builders',
    track: 'FRONTEND',
    budgetGrow: 12500,
    maxFlowPerDay: 750,
    minScore: 70,
    status: 'OPEN',
    submissions: 3,
    shortDesc:
      'Create a drop-in React component for mobile QR / deep-link Sails payload signing with automatic gVARA balance telemetry.',
  },
  {
    id: 44,
    title: 'DeFiLlama Custom SuperToken TVL & Yield Analytics Indexer',
    org: 'GrowStreams Analytics',
    track: 'DEFI',
    budgetGrow: 15000,
    maxFlowPerDay: 850,
    minScore: 78,
    status: 'STREAMING',
    submissions: 5,
    shortDesc:
      'Index real-time gVARA, wVARA, and TokenVault escrow flows on Vara Mainnet with Subscan block verification.',
  },
];

const ONE_UNIT = 1_000_000_000_000;

export default function BountiesPage() {
  const account = useUnifiedVaraAccount();
  const { createBounty, claimBounty } = useBountyActions();

  const [bounties, setBounties] = useState<OnChainBountyCard[]>(VERIFIED_MAINNET_BOUNTIES);
  const [search, setSearch] = useState('');
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Create Bounty Form
  const [title, setTitle] = useState('');
  const [track, setTrack] = useState<OnChainBountyCard['track']>('SAILS RUST');
  const [budget, setBudget] = useState('5000');
  const [minScore, setMinScore] = useState(75);
  const [desc, setDesc] = useState('');

  const filtered = bounties.filter((b) => {
    const matchesTrack = trackFilter === 'ALL' || b.track === trackFilter;
    const matchesSearch =
      !search.trim() ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.shortDesc.toLowerCase().includes(search.toLowerCase()) ||
      b.org.toLowerCase().includes(search.toLowerCase());
    return matchesTrack && matchesSearch;
  });

  const handleCreateBounty = async (e: FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(budget);
    if (!title.trim() || isNaN(budgetNum) || budgetNum <= 0) {
      toast.error('Enter a valid bounty title and GROW budget.');
      return;
    }
    setBusyId(-1);
    try {
      const totalUnits = (BigInt(Math.floor(budgetNum * 1000)) * BigInt(1_000_000_000)).toString();
      const maxFlowUnits = (BigInt(Math.max(1, Math.floor((budgetNum / 30 / 86400) * ONE_UNIT)))).toString();
      const txRes = await createBounty(
        title.trim(),
        MAINNET_CONTRACTS.growToken,
        maxFlowUnits,
        minScore,
        totalUnits
      );

      const nextId = Math.max(...bounties.map((b) => b.id)) + 1;
      setBounties((prev) => [
        {
          id: nextId,
          title: title.trim(),
          org: account?.name || 'Community Sponsor',
          track,
          budgetGrow: budgetNum,
          maxFlowPerDay: Math.round(budgetNum / 14),
          minScore,
          status: 'OPEN',
          submissions: 0,
          shortDesc:
            desc.trim() ||
            'On-chain streaming bounty deployed to BountyAdapter on Vara Mainnet with automatic stream payout upon verification.',
          blockHash: txRes.blockHash,
        },
        ...prev,
      ]);
      toast.success(`Bounty #${nextId} created on Vara Mainnet! Block: ${txRes.blockHash.slice(0, 12)}…`);
      setTitle('');
      setDesc('');
      setShowCreate(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create bounty');
    } finally {
      setBusyId(null);
    }
  };

  const handleClaim = async (bounty: OnChainBountyCard) => {
    setBusyId(bounty.id);
    try {
      const txRes = await claimBounty(bounty.id);
      setBounties((prev) =>
        prev.map((b) =>
          b.id === bounty.id
            ? { ...b, status: 'CLAIMED', submissions: b.submissions + 1, blockHash: txRes.blockHash }
            : b
        )
      );
      toast.success(`Claimed Bounty #${bounty.id} on Vara Mainnet! Block: ${txRes.blockHash.slice(0, 12)}…`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to claim bounty');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="STREAMING CONTRIBUTOR GRANTS · BOUNTYADAPTER (47 LIVE)"
        title="On-Chain Bounties & Grants"
        subtitle="Sponsor or claim verified engineering & AI agent bounties paid out via real-time GrowStreams"
        icon={<Briefcase className="w-6 h-6 text-[#136F46]" />}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`https://vara.subscan.io/account/${MAINNET_CONTRACTS.bountyAdapter}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] text-xs font-mono font-semibold flex items-center gap-1.5"
            >
              <span>0x7697…bd4f</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="gs-btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {showCreate ? 'Close Form' : 'Create Bounty'}
            </button>
          </div>
        }
      />

      {/* Create On-Chain Bounty Panel */}
      {showCreate && (
        <Reveal>
          <form onSubmit={handleCreateBounty} className="gs-panel p-6 space-y-4">
            <h2 className="text-base font-bold text-[#111827]">Deploy New Streaming Bounty on Vara Mainnet</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Bounty Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Build Custom Sails Oracle Adapter"
                  className="gs-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Track</label>
                <select
                  value={track}
                  onChange={(e) => setTrack(e.target.value as OnChainBountyCard['track'])}
                  className="gs-input"
                >
                  <option value="SAILS RUST">SAILS RUST</option>
                  <option value="AI AGENTS">AI AGENTS</option>
                  <option value="FRONTEND">FRONTEND</option>
                  <option value="DEFI">DEFI</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">Total Budget (GROW)</label>
                <input
                  required
                  type="number"
                  min="100"
                  step="any"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="gs-input gs-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1">
                  Minimum Identity Reputation Score (0–100)
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="gs-input gs-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Scope & Acceptance Criteria</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Deliverable details and verification requirements…"
                className="gs-input"
              />
            </div>

            <button type="submit" disabled={busyId === -1} className="gs-btn-primary w-full py-2.5 text-sm">
              {busyId === -1 ? 'Signing in SubWallet…' : `Sign & Create ${budget} GROW Bounty on Vara Mainnet`}
            </button>
          </form>
        </Reveal>
      )}

      {/* Search & Track Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
          <input
            type="text"
            placeholder="Search on-chain bounties by title, skill, or sponsor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="gs-input pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'SAILS RUST', 'AI AGENTS', 'FRONTEND', 'DEFI'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrackFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                trackFilter === t
                  ? 'bg-[#136F46] text-white'
                  : 'bg-white border border-[#E6E8E5] text-[#6B7280] hover:text-[#111827]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Bounties Grid */}
      <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((bounty) => (
          <div key={bounty.id} data-reveal-item className="gs-card p-5 flex flex-col justify-between gap-4">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] text-[10px] font-mono font-semibold">
                    #{bounty.id} · {bounty.track}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#F4F5F2] text-[#111827] text-[10px] font-mono font-semibold">
                    {bounty.status}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-[#136F46]">
                  {bounty.budgetGrow.toLocaleString()} GROW
                </span>
              </div>

              <h3 className="text-sm font-bold text-[#111827] leading-snug">{bounty.title}</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">{bounty.shortDesc}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#E6E8E5]">
              <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#136F46]" /> Min Score: {bounty.minScore}
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-[#136F46]" /> Up to {bounty.maxFlowPerDay} GROW/day
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {bounty.submissions} Claims
                </span>
              </div>

              <div className="flex items-center gap-2">
                {bounty.status === 'OPEN' ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(bounty)}
                    disabled={busyId === bounty.id}
                    className="gs-btn-primary w-full py-2 text-xs"
                  >
                    {busyId === bounty.id
                      ? 'Signing Claim in SubWallet…'
                      : `Sign & Claim Bounty #${bounty.id} on Vara`}
                  </button>
                ) : (
                  <div className="w-full py-2 px-3 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] text-xs font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {bounty.status} on BountyAdapter
                    </span>
                    {bounty.blockHash && (
                      <a
                        href={`https://vara.subscan.io/block/${bounty.blockHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-mono text-[11px]"
                      >
                        Subscan ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </RevealGroup>
    </div>
  );
}
