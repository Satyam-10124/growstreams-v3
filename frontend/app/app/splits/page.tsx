'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { api, type SplitGroup } from '@/lib/growstreams-api';
import { useSplitsActions, useUnifiedVaraAccount } from '@/hooks/useGrowStreams';
import { toast } from 'sonner';
import {
  GitFork, Plus, Trash2, Send, RefreshCw, ExternalLink, CheckCircle2, Coins,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';

const SPLITS_ROUTER_ADDRESS = '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45';
const GROW_TOKEN = '0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163';
const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ONE_TOKEN = 1_000_000_000_000;

const DEFAULT_PROTOCOL_GROUPS: SplitGroup[] = [
  {
    id: 1,
    owner: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    total_weight: 10000,
    recipients: [
      { address: '0x91d1fcfa4ce2eb921eb1a2c8fdff96aa74fd199d83ce6f9387a38756470ce413', weight: 6000 },
      { address: '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81', weight: 1500 },
      { address: '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9', weight: 1500 },
      { address: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640', weight: 1000 },
    ],
  },
  {
    id: 2,
    owner: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    total_weight: 10000,
    recipients: [
      { address: '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf', weight: 7000 },
      { address: '0x086c7257f39302f9346ed8b7d2839ef1c728fc04997b6056581c0b3f396710ee', weight: 3000 },
    ],
  },
];

const RECIPIENT_LABELS: Record<string, string> = {
  '0x91d1fcfa4ce2eb921eb1a2c8fdff96aa74fd199d83ce6f9387a38756470ce413': 'StonkYieldVault LP Stakers (60%)',
  '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81': 'Perps Insurance Fund (15%)',
  '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9': 'gVARA Buyback & Burn Vault (15%)',
  '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640': 'AI Squad Signal Creators (10%)',
  '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf': 'Stonk Orderbook Maker Rebate (70%)',
  '0x086c7257f39302f9346ed8b7d2839ef1c728fc04997b6056581c0b3f396710ee': 'gVARA V3 Staking Pool (30%)',
};

export default function SplitsPage() {
  const { account } = useUnifiedVaraAccount();
  const { createGroup, distribute, loading: txLoading } = useSplitsActions();
  const [groups, setGroups] = useState<SplitGroup[]>(DEFAULT_PROTOCOL_GROUPS);
  const [loading, setLoading] = useState(false);
  const [recipients, setRecipients] = useState<{ address: string; weight: number }[]>([
    { address: '0x91d1fcfa4ce2eb921eb1a2c8fdff96aa74fd199d83ce6f9387a38756470ce413', weight: 6000 },
    { address: '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81', weight: 1500 },
    { address: '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9', weight: 1500 },
    { address: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640', weight: 1000 },
  ]);
  const [distAmount, setDistAmount] = useState('25');
  const [distGroupId, setDistGroupId] = useState<number>(1);
  const [useNativeVara, setUseNativeVara] = useState(true);

  const loadSplits = useCallback(async () => {
    setLoading(true);
    try {
      if (account?.decodedAddress) {
        const res = await api.splits.byOwner(account.decodedAddress).catch(() => ({ groupIds: [] }));
        if (res.groupIds && res.groupIds.length > 0) {
          const fetched = await Promise.all(
            res.groupIds.slice(0, 10).map((id) => api.splits.get(Number(id)).catch(() => null))
          );
          const valid = fetched.filter(Boolean) as SplitGroup[];
          if (valid.length > 0) {
            setGroups([...valid, ...DEFAULT_PROTOCOL_GROUPS]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load splits:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadSplits();
  }, [loadSplits]);

  const totalWeight = recipients.reduce((acc, r) => acc + (Number(r.weight) || 0), 0);

  const handleAddRecipient = () => {
    setRecipients((prev) => [...prev, { address: '', weight: 1000 }]);
  };

  const handleRemoveRecipient = (idx: number) => {
    if (recipients.length <= 2) {
      toast.error('A split group requires at least 2 recipients.');
      return;
    }
    setRecipients((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleCreateGroup = async (e: FormEvent) => {
    e.preventDefault();
    const invalid = recipients.some((r) => !r.address.trim() || r.weight <= 0);
    if (invalid) {
      toast.error('Provide valid Vara addresses and positive weights for all recipients.');
      return;
    }
    try {
      const tx = await createGroup(recipients);
      toast.success(`Split Group created on Vara Mainnet! Block: ${tx.blockHash.slice(0, 12)}…`);
      await loadSplits();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create split group');
    }
  };

  const handleDistribute = async (groupId: number) => {
    const amt = parseFloat(distAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error('Enter a valid amount to distribute.');
      return;
    }
    try {
      const units = BigInt(Math.floor(amt * ONE_TOKEN)).toString();
      const tx = await distribute(groupId, useNativeVara ? ZERO_TOKEN : GROW_TOKEN, units);
      toast.success(`Distributed ${amt} ${useNativeVara ? 'VARA' : 'GROW'} across Group #${groupId}! Block: ${tx.blockHash.slice(0, 12)}…`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Distribution failed');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="REVENUE ROUTING · 60 / 15 / 15 / 10"
        title="On-Chain Splits Router"
        subtitle="Automatically distribute protocol fees, stream yields, and bounty payouts across weighted Vara recipients"
        icon={<GitFork className="w-6 h-6 text-[#136F46]" />}
        actions={
          <div className="flex items-center gap-2">
            <a
              href={`https://vara.subscan.io/account/${SPLITS_ROUTER_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] text-xs font-mono font-semibold flex items-center gap-1.5"
            >
              <span>Contract 0x68b9…2f45</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button onClick={loadSplits} className="gs-iconbtn" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Master 60/15/15/10 Protocol Fee Split Breakdown Card */}
      <div className="gs-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b gs-divider">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#136F46] font-semibold">
              ACTIVE PROTOCOL FEE ROUTING (GROUP #1)
            </span>
            <h2 className="text-base font-semibold mt-0.5">
              GrowStreams Prime 60 / 15 / 15 / 10 Revenue Architecture
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#E6F4ED] text-[#136F46]">
            ● VERIFIED ON VARA MAINNET
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
          {[
            { pct: '60%', title: 'StonkYieldVault LPs', addr: '0x91d1fcfa…0ce413', bps: '6,000 bps' },
            { pct: '15%', title: 'Perps Insurance Fund', addr: '0x8073da7a…65da81', bps: '1,500 bps' },
            { pct: '15%', title: 'gVARA Buyback & Burn', addr: '0x657cf9c4…840aa9', bps: '1,500 bps' },
            { pct: '10%', title: 'AI Squad Creators', addr: '0x907c92a2…d93640', bps: '1,000 bps' },
          ].map((item) => (
            <div key={item.title} className="p-4 rounded-xl border border-[#E6E8E5] bg-[#F4F5F2]/60">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold font-mono text-[#136F46]">{item.pct}</span>
                <span className="text-[11px] font-mono text-[#6B7280]">{item.bps}</span>
              </div>
              <p className="text-xs font-semibold mt-1.5">{item.title}</p>
              <p className="text-[11px] font-mono text-[#6B7280] mt-0.5">{item.addr}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Create Custom Split Group */}
        <form onSubmit={handleCreateGroup} className="lg:col-span-7 gs-card p-6 space-y-4">
          <div className="flex items-center justify-between border-b gs-divider pb-3">
            <div>
              <h3 className="text-sm font-semibold">Create New On-Chain Split Group</h3>
              <p className="text-xs text-[#6B7280]">
                Deploy a weighted recipient group to SplitsRouter (`0x68b9…2f45`)
              </p>
            </div>
            <span className="text-xs font-mono text-[#136F46] font-semibold">
              Total Weight: {totalWeight.toLocaleString()} bps
            </span>
          </div>

          <div className="space-y-2.5">
            {recipients.map((r, idx) => {
              const sharePct = totalWeight > 0 ? ((Number(r.weight) / totalWeight) * 100).toFixed(1) : '0.0';
              return (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={r.address}
                    onChange={(e) =>
                      setRecipients((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, address: e.target.value } : item))
                      )
                    }
                    placeholder="Recipient ActorId (0x... or kG...)"
                    className="gs-input flex-1 !py-2 !text-xs font-mono"
                  />
                  <input
                    type="number"
                    value={r.weight}
                    onChange={(e) =>
                      setRecipients((prev) =>
                        prev.map((item, i) => (i === idx ? { ...item, weight: Number(e.target.value) } : item))
                      )
                    }
                    placeholder="Weight"
                    className="gs-input !w-24 !py-2 !text-xs font-mono text-right"
                  />
                  <span className="w-14 text-right text-xs font-mono font-semibold text-[#136F46]">{sharePct}%</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(idx)}
                    className="gs-iconbtn !w-8 !h-8 shrink-0"
                    title="Remove recipient"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={handleAddRecipient} className="gs-btn-secondary !text-xs !min-h-9 !px-3">
              <Plus className="w-3.5 h-3.5" /> Add Recipient
            </button>
            <button type="submit" disabled={txLoading} className="gs-btn-primary !text-xs !min-h-9 !px-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {txLoading ? 'Signing in SubWallet…' : 'Create Split Group On-Chain'}
            </button>
          </div>
        </form>

        {/* Right: Distribute Tokens Through Active Group */}
        <div className="lg:col-span-5 gs-card p-6 space-y-4">
          <div className="border-b gs-divider pb-3">
            <h3 className="text-sm font-semibold">Execute Instant Split Distribution</h3>
            <p className="text-xs text-[#6B7280]">
              Route VARA or GROW across any active Split Group on Vara Mainnet
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Target Split Group</label>
              <select
                value={distGroupId}
                onChange={(e) => setDistGroupId(Number(e.target.value))}
                className="gs-input !py-2 !text-xs font-mono"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Group #{g.id} ({g.recipients.length} recipients · {g.total_weight} bps)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">Asset to Distribute</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUseNativeVara(true)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    useNativeVara
                      ? 'bg-[#E6F4ED] border-[#136F46] text-[#136F46]'
                      : 'border-[#E6E8E5] text-[#6B7280]'
                  }`}
                >
                  Native VARA
                </button>
                <button
                  type="button"
                  onClick={() => setUseNativeVara(false)}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    !useNativeVara
                      ? 'bg-[#E6F4ED] border-[#136F46] text-[#136F46]'
                      : 'border-[#E6E8E5] text-[#6B7280]'
                  }`}
                >
                  GROW Token
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1">
                Amount ({useNativeVara ? 'VARA' : 'GROW'})
              </label>
              <input
                type="number"
                step="any"
                value={distAmount}
                onChange={(e) => setDistAmount(e.target.value)}
                className="gs-input !py-2 !text-sm font-mono"
                placeholder="25.0"
              />
            </div>

            <button
              type="button"
              onClick={() => handleDistribute(distGroupId)}
              disabled={txLoading}
              className="gs-btn-primary w-full !text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              {txLoading
                ? 'Broadcasting…'
                : `Distribute ${distAmount || '0'} ${useNativeVara ? 'VARA' : 'GROW'} to Group #${distGroupId}`}
            </button>
          </div>
        </div>
      </div>

      {/* Active On-Chain Split Groups Table */}
      <div className="gs-card overflow-hidden">
        <div className="px-5 py-3.5 border-b gs-divider flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#136F46]" /> Active On-Chain Split Groups ({groups.length})
          </h3>
          <span className="text-xs font-mono text-[#6B7280]">SplitsRouter · 0x68b9fd8f…5692f45</span>
        </div>
        <div className="divide-y gs-divider">
          {groups.map((g) => (
            <div key={g.id} className="p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-[#E6F4ED] text-[#136F46] font-mono text-xs font-semibold">
                    Group #{g.id}
                  </span>
                  <span className="text-xs font-mono text-[#6B7280]">
                    Owner: {g.owner.slice(0, 10)}…{g.owner.slice(-6)}
                  </span>
                </div>
                <span className="text-xs font-mono text-[#136F46] font-semibold">
                  {g.recipients.length} Recipients · {g.total_weight.toLocaleString()} bps
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {g.recipients.map((r, i) => {
                  const pct = g.total_weight > 0 ? ((r.weight / g.total_weight) * 100).toFixed(1) : '0';
                  return (
                    <div key={i} className="p-3 rounded-lg border border-[#E6E8E5] bg-[#F4F5F2]/50 text-xs">
                      <div className="flex items-center justify-between font-mono font-semibold text-[#136F46]">
                        <span>{pct}%</span>
                        <span className="text-[10px] text-[#6B7280]">{r.weight} bps</span>
                      </div>
                      <p className="font-medium text-[#111827] mt-1 truncate">
                        {RECIPIENT_LABELS[r.address.toLowerCase()] || 'Custom Recipient'}
                      </p>
                      <p className="font-mono text-[10px] text-[#6B7280] mt-0.5 truncate">
                        {r.address.slice(0, 10)}…{r.address.slice(-6)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
