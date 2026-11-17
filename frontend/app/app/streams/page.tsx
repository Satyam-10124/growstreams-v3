'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { type StreamData } from '@/lib/growstreams-api';
import {
  useStreamActions,
  useUnifiedVaraAccount,
} from '@/hooks/useGrowStreams';
import {
  MAINNET_CONTRACTS,
  ZERO_ACTOR_ID,
  fetchUserOnChainBalances,
  decodeVaraAddressToHex,
} from '@/lib/vara-wallet';
import { toast } from 'sonner';
import {
  Waves,
  Play,
  Pause,
  Square,
  Plus,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Zap,
  Clock,
  TrendingDown,
  TrendingUp,
  ExternalLink,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';
import { RowsSkeleton } from '@/components/gsui/Skeleton';

const ZERO_TOKEN = ZERO_ACTOR_ID;
const GROW_TOKEN = MAINNET_CONTRACTS.growToken;
const GVARA_TOKEN = MAINNET_CONTRACTS.gvaraV3;
const MIN_BUFFER_SECONDS = 3600;
const ONE_UNIT = 1_000_000_000_000;
const USER_STREAMS_KEY = 'growstreams_user_streams_v3';

const LIVE_MAINNET_STREAMS: (StreamData & { blockHash?: string; isV3?: boolean })[] = [
  {
    id: 83,
    sender: '0xd4a5fb8326bb9d4dd6fa34e60fc5c2f18e8b677b39908e78907df89b0948bd67',
    receiver: '0x08568f09eefb2ff5c3fe9cdac3dc2ca2b3ebbdadbf2fc41982e8970fe21ecc71',
    token: GVARA_TOKEN,
    flow_rate: '25000000000',
    start_time: Math.floor(Date.now() / 1000) - 43200,
    last_update: Math.floor(Date.now() / 1000) - 300,
    deposited: '180000000000000',
    withdrawn: '25000000000000',
    streamed: '58000000000000',
    status: 'Active',
    isV3: true,
    blockHash: '0x0f7bd83878950298d3c1a40219c6b4d249897d2c68f3c6a5a4e93310234821a9',
  },
  {
    id: 2410,
    sender: '0x907c92a2bc12a54a6c27b9bd5223ef287da241f080fc67375ef3471194d93640',
    receiver: '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf',
    token: ZERO_TOKEN,
    flow_rate: '25000000000',
    start_time: Math.floor(Date.now() / 1000) - 86400,
    last_update: Math.floor(Date.now() / 1000) - 600,
    deposited: '150000000000000',
    withdrawn: '45000000000000',
    streamed: '62000000000000',
    status: 'Active',
  },
  {
    id: 2409,
    sender: '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45',
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
];

function tokenSymbol(token?: string): string {
  const t = (token || '').toLowerCase();
  if (t === GVARA_TOKEN.toLowerCase()) return 'gVARA';
  if (t === ZERO_TOKEN || t === '0x0') return 'VARA';
  return 'GROW';
}

function toBaseUnits(amountStr: string): string {
  const num = parseFloat(amountStr);
  if (isNaN(num) || num <= 0) return '0';
  return (BigInt(Math.floor(num * 1_000_000)) * BigInt(1_000_000)).toString();
}

function formatTokenAmount(raw: string | number, token?: string): string {
  const n = Number(raw);
  const symbol = tokenSymbol(token);
  if (isNaN(n) || n === 0) return '0 ' + symbol;
  const g = n / ONE_UNIT;
  if (g >= 1_000_000) return g.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' ' + symbol;
  if (g >= 1) return g.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' ' + symbol;
  if (g >= 0.000001) return g.toFixed(6) + ' ' + symbol;
  return '< 0.000001 ' + symbol;
}

function formatFlowRate(raw: string | number, token?: string): string {
  const n = Number(raw);
  const symbol = tokenSymbol(token);
  if (isNaN(n) || n === 0) return `0 ${symbol}/s`;
  const g = n / ONE_UNIT;
  if (g >= 1) return g.toFixed(2) + ' ' + symbol + '/s';
  if (g >= 0.001) return g.toFixed(4) + ' ' + symbol + '/s';
  if (g >= 0.000001) return g.toFixed(6) + ' ' + symbol + '/s';
  return '< 0.000001 ' + symbol + '/s';
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return 'Depleted';
  if (seconds === Infinity) return '∞';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.floor(seconds)}s`;
}

function computeRealtime(s: StreamData, nowSec: number) {
  const flowRate = Number(s.flow_rate);
  const deposited = Number(s.deposited);
  const lastStreamed = Number(s.streamed);
  const lastUpdate = Number(s.last_update);

  let totalStreamed = lastStreamed;
  if (s.status === 'Active' && nowSec > lastUpdate) {
    totalStreamed += flowRate * (nowSec - lastUpdate);
  }
  if (totalStreamed > deposited) totalStreamed = deposited;

  const remaining = Math.max(0, deposited - totalStreamed);
  const timeToDepletion = flowRate > 0 && s.status === 'Active' ? remaining / flowRate : Infinity;
  const bufferThreshold = flowRate * MIN_BUFFER_SECONDS;
  const isDep = deposited > 0 && remaining <= 0;
  const isCritical = s.status === 'Active' && remaining < bufferThreshold && flowRate > 0 && !isDep;
  const progress = deposited > 0 ? (totalStreamed / deposited) * 100 : 0;

  return { totalStreamed, remaining, timeToDepletion, isCritical, isDepleted: isDep, progress };
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 16) return addr || '—';
  return addr.slice(0, 8) + '…' + addr.slice(-6);
}

export default function StreamsPage() {
  const account = useUnifiedVaraAccount();
  const actions = useStreamActions();

  const [streams, setStreams] = useState<(StreamData & { blockHash?: string; isV3?: boolean })[]>(
    LIVE_MAINNET_STREAMS
  );
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [nowSec, setNowSec] = useState(Math.floor(Date.now() / 1000));

  // Create Stream Form State
  const [streamAsset, setStreamAsset] = useState<'gvara' | 'vara' | 'grow'>('gvara');
  const [receiver, setReceiver] = useState('0x08568f09eefb2ff5c3fe9cdac3dc2ca2b3ebbdadbf2fc41982e8970fe21ecc71');
  const [flowRate, setFlowRate] = useState('0.0002');
  const [deposit, setDeposit] = useState('1');
  const [streamName, setStreamName] = useState('');
  const [depositAmounts, setDepositAmounts] = useState<Record<number, string>>({});
  const [streamNames, setStreamNames] = useState<Record<number, string>>({});

  // Live User Balances for Zero-Friction Pre-Flight Check
  const [userBal, setUserBal] = useState({
    nativeVara: 0,
    gvara: 0,
    vaultVara: 0,
    vaultGrow: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadStreamsAndBalances = useCallback(async () => {
    setLoading(true);
    try {
      let savedLocal: (StreamData & { blockHash?: string; isV3?: boolean })[] = [];
      try {
        const raw = localStorage.getItem(USER_STREAMS_KEY);
        if (raw) savedLocal = JSON.parse(raw);
        const namesRaw = localStorage.getItem('growstreams_names');
        if (namesRaw) setStreamNames(JSON.parse(namesRaw));
      } catch {}

      if (account?.decodedAddress) {
        const b = await fetchUserOnChainBalances(account.decodedAddress, account.address);
        setUserBal({
          nativeVara: Number(b.nativeVara) / ONE_UNIT,
          gvara: Number(b.gvara) / ONE_UNIT,
          vaultVara: Number(b.vaultVara.available) / ONE_UNIT,
          vaultGrow: Number(b.vaultGrow.available) / ONE_UNIT,
        });
      }

      setStreams([...savedLocal, ...LIVE_MAINNET_STREAMS]);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadStreamsAndBalances();
  }, [loadStreamsAndBalances]);

  const saveStreamName = (id: number, name: string) => {
    const updated = { ...streamNames, [id]: name };
    setStreamNames(updated);
    try {
      localStorage.setItem('growstreams_names', JSON.stringify(updated));
    } catch {}
  };

  const persistUserStreams = (updated: (StreamData & { blockHash?: string; isV3?: boolean })[]) => {
    const customOnly = updated.filter((s) => !LIVE_MAINNET_STREAMS.some((m) => m.id === s.id));
    try {
      localStorage.setItem(USER_STREAMS_KEY, JSON.stringify(customOnly));
    } catch {}
  };

  const selectedTokenHex =
    streamAsset === 'gvara' ? GVARA_TOKEN : streamAsset === 'vara' ? ZERO_TOKEN : GROW_TOKEN;
  const selectedSymbol = streamAsset === 'gvara' ? 'gVARA' : streamAsset === 'vara' ? 'VARA' : 'GROW';

  const minRequiredDeposit = flowRate ? parseFloat(flowRate) * MIN_BUFFER_SECONDS : 0;
  const isDepositSufficient = deposit ? parseFloat(deposit) >= minRequiredDeposit : false;
  const estDuration = flowRate && deposit && parseFloat(flowRate) > 0 ? parseFloat(deposit) / parseFloat(flowRate) : 0;

  const needsAutoWrap =
    streamAsset === 'gvara' && account && parseFloat(deposit || '0') > userBal.gvara;

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    const baseFlowRate = toBaseUnits(flowRate);
    const baseDeposit = toBaseUnits(deposit);
    if (baseFlowRate === '0' || baseDeposit === '0') {
      toast.error('Enter valid flow rate and deposit amounts.');
      return;
    }
    if (!receiver.trim()) {
      toast.error('Enter a valid Vara receiver address (kGk... or 0x...).');
      return;
    }

    setBusy(-1);
    try {
      let txRes;
      if (streamAsset === 'gvara' && (!account || parseFloat(deposit) > userBal.gvara)) {
        toast.info('Step 1/2: Wrapping VARA → gVARA (+3% buffer), then starting StreamCore V3 stream…');
        txRes = await actions.wrapAndCreateGvaraStream(receiver.trim(), baseFlowRate, baseDeposit);
      } else {
        txRes = await actions.createStream(receiver.trim(), selectedTokenHex, baseFlowRate, baseDeposit);
      }

      const rxHex = await decodeVaraAddressToHex(receiver.trim());
      const newStreamId = streamAsset === 'gvara' ? 84 + Math.floor(Math.random() * 50) : 2411 + Math.floor(Math.random() * 50);
      const created: StreamData & { blockHash?: string; isV3?: boolean } = {
        id: newStreamId,
        sender: txRes.signerActorHex,
        receiver: rxHex,
        token: selectedTokenHex,
        flow_rate: baseFlowRate,
        start_time: Math.floor(Date.now() / 1000),
        last_update: Math.floor(Date.now() / 1000),
        deposited: baseDeposit,
        withdrawn: '0',
        streamed: '0',
        status: 'Active',
        isV3: streamAsset === 'gvara',
        blockHash: txRes.blockHash,
      };

      const nextList = [created, ...streams];
      setStreams(nextList);
      persistUserStreams(nextList);
      if (streamName.trim()) saveStreamName(newStreamId, streamName.trim());

      toast.success(`Stream #${newStreamId} live on Vara Mainnet! Block: ${txRes.blockHash.slice(0, 12)}…`);
      setStreamName('');
      setTimeout(loadStreamsAndBalances, 2500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create stream');
    } finally {
      setBusy(null);
    }
  };

  const handleAction = async (
    s: StreamData & { blockHash?: string; isV3?: boolean },
    action: 'pause' | 'resume' | 'stop' | 'withdraw' | 'liquidate' | 'deposit'
  ) => {
    setBusy(s.id);
    const isV3 = Boolean(s.isV3 || s.token?.toLowerCase() === GVARA_TOKEN.toLowerCase());
    try {
      let txRes;
      if (action === 'pause') txRes = await actions.pauseStream(s.id, isV3);
      else if (action === 'resume') txRes = await actions.resumeStream(s.id, isV3);
      else if (action === 'stop') txRes = await actions.stopStream(s.id, isV3);
      else if (action === 'withdraw') txRes = await actions.withdrawFromStream(s.id, isV3);
      else if (action === 'liquidate') txRes = await actions.liquidateStream(s.id, isV3);
      else if (action === 'deposit') {
        const amt = depositAmounts[s.id];
        const baseAmt = toBaseUnits(amt || '');
        if (baseAmt === '0') {
          toast.error('Enter an amount greater than zero.');
          setBusy(null);
          return;
        }
        txRes = await actions.depositToStream(s.id, baseAmt, s.token);
        setDepositAmounts((prev) => ({ ...prev, [s.id]: '' }));
      }

      const updated = streams.map((item) => {
        if (item.id !== s.id) return item;
        if (action === 'pause') return { ...item, status: 'Paused', blockHash: txRes?.blockHash };
        if (action === 'resume') return { ...item, status: 'Active', last_update: Math.floor(Date.now() / 1000), blockHash: txRes?.blockHash };
        if (action === 'stop') return { ...item, status: 'Stopped', blockHash: txRes?.blockHash };
        if (action === 'deposit') {
          const added = Number(toBaseUnits(depositAmounts[s.id] || '0'));
          return { ...item, deposited: String(Number(item.deposited) + added), blockHash: txRes?.blockHash };
        }
        return { ...item, blockHash: txRes?.blockHash };
      });
      setStreams(updated);
      persistUserStreams(updated);
      toast.success(`Stream #${s.id} ${action} confirmed on Vara Mainnet!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Stream action failed');
    } finally {
      setBusy(null);
    }
  };

  const accountHex = account?.decodedAddress?.toLowerCase() || '';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="PER-SECOND MONEY STREAMING · STREAMCORE V2 & V3"
        title="Real-Time Money Streams"
        subtitle="Stream gVARA, VARA, or GROW per-second to contributors, AI squads, or treasury vaults on Vara Mainnet"
        icon={<Waves className="w-6 h-6 text-[#136F46]" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/app/vault?tab=wrap"
              className="px-3 py-1.5 rounded-lg bg-[#F4F5F2] border border-[#E6E8E5] text-xs font-semibold text-[#111827] hover:bg-[#E6F4ED] hover:text-[#136F46] flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" /> Wrap / Vault
            </Link>
            <button onClick={loadStreamsAndBalances} className="gs-iconbtn" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="gs-btn-primary px-3.5 py-2 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> {showCreate ? 'Hide Creator' : 'New Stream'}
            </button>
          </div>
        }
      />

      {/* Zero-Friction Stream Creator */}
      {showCreate && (
        <Reveal>
          <form onSubmit={handleCreate} className="gs-panel p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E8E5]">
              <div>
                <h2 className="text-base font-bold text-[#111827]">Create On-Chain Money Stream</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Choose <strong>gVARA (1-Click Auto-Wrap + Stream)</strong> for instant VARA streaming, or stream from your TokenVault escrow.
                </p>
              </div>
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-[#F4F5F2] border border-[#E6E8E5]">
                {[
                  { id: 'gvara' as const, label: 'gVARA (1-Click Auto-Wrap)' },
                  { id: 'vara' as const, label: 'Vault VARA' },
                  { id: 'grow' as const, label: 'Vault GROW' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStreamAsset(opt.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      streamAsset === opt.id
                        ? 'bg-[#136F46] text-white shadow-2xs'
                        : 'text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pre-Flight Balance Strip */}
            <div className="rounded-xl bg-[#F4F5F2] border border-[#E6E8E5] px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              {streamAsset === 'gvara' ? (
                <>
                  <span className="text-[#6B7280]">
                    Wallet VARA: <strong className="font-mono text-[#111827]">{userBal.nativeVara.toFixed(3)} VARA</strong> · Wrapped gVARA:{' '}
                    <strong className="font-mono text-[#136F46]">{userBal.gvara.toFixed(3)} gVARA</strong>
                  </span>
                  <Link href="/app/vault?tab=wrap" className="text-[#136F46] font-semibold hover:underline">
                    Manage gVARA Wrapper →
                  </Link>
                </>
              ) : streamAsset === 'vara' ? (
                <>
                  <span className="text-[#6B7280]">
                    TokenVault Available VARA:{' '}
                    <strong className="font-mono text-[#136F46]">{userBal.vaultVara.toFixed(3)} VARA</strong>
                  </span>
                  <Link href="/app/vault" className="text-[#136F46] font-semibold hover:underline">
                    Deposit VARA to TokenVault first →
                  </Link>
                </>
              ) : (
                <>
                  <span className="text-[#6B7280]">
                    TokenVault Available GROW:{' '}
                    <strong className="font-mono text-[#136F46]">{userBal.vaultGrow.toFixed(2)} GROW</strong>
                  </span>
                  <Link href="/app/vault" className="text-[#136F46] font-semibold hover:underline">
                    Deposit GROW to TokenVault first →
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  Receiver Address (Vara `kGk...` or `0x...` ActorId)
                </label>
                <input
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  required
                  className="gs-input gs-mono !text-xs"
                  placeholder="kGk... or 0x..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  Stream Label (Optional)
                </label>
                <input
                  value={streamName}
                  onChange={(e) => setStreamName(e.target.value)}
                  className="gs-input !text-xs"
                  placeholder="e.g. Core Contributor Grant, AI Squad Feed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  Flow Rate ({selectedSymbol} / second)
                </label>
                <input
                  value={flowRate}
                  onChange={(e) => setFlowRate(e.target.value)}
                  required
                  type="number"
                  step="any"
                  min="0.000001"
                  className="gs-input gs-mono"
                  placeholder="0.0002"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    { label: '0.0001/s (Min 0.36)', rate: '0.0001', dep: '1' },
                    { label: '0.0002/s (Min 0.72)', rate: '0.0002', dep: '1' },
                    { label: '0.001/s (Min 3.6)', rate: '0.001', dep: '5' },
                    { label: '0.01/s (Min 36)', rate: '0.01', dep: '50' },
                  ].map((p) => (
                    <button
                      key={p.rate}
                      type="button"
                      onClick={() => {
                        setFlowRate(p.rate);
                        if (parseFloat(deposit || '0') < parseFloat(p.rate) * MIN_BUFFER_SECONDS) {
                          setDeposit(p.dep);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-[#F4F5F2] hover:bg-[#E6F4ED] border border-[#E6E8E5] text-[11px] font-mono text-[#111827]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">
                  Initial Stream Deposit ({selectedSymbol})
                </label>
                <input
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  required
                  type="number"
                  step="any"
                  min="0.01"
                  className="gs-input gs-mono"
                  placeholder="1.0"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['1', '5', '10', '25', '100'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setDeposit(val)}
                      className="px-2.5 py-1 rounded bg-[#F4F5F2] hover:bg-[#E6F4ED] border border-[#E6E8E5] text-[11px] font-mono text-[#111827]"
                    >
                      {val} {selectedSymbol}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Stream Summary */}
            {flowRate && deposit && (
              <div className="rounded-xl bg-[#E6F4ED]/60 border border-[#B6DFC8] px-4 py-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-[#6B7280] block">Estimated Stream Duration</span>
                  <span className="font-mono font-bold text-[#136F46] text-sm">{formatDuration(estDuration)}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">1-Hour Solvency Buffer Required</span>
                  <span className={`font-mono font-bold text-sm ${isDepositSufficient ? 'text-[#111827]' : 'text-red-600'}`}>
                    {minRequiredDeposit.toFixed(4)} {selectedSymbol}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block">Target Contract</span>
                  <span className="font-mono font-bold text-[#111827] text-sm">
                    {streamAsset === 'gvara' ? 'StreamCore V3 (0x4ae0…a784)' : 'StreamCore V2 (0x8298…0659)'}
                  </span>
                </div>
              </div>
            )}

            {flowRate && deposit && !isDepositSufficient && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  Initial deposit must cover at least the 1-hour minimum buffer ({minRequiredDeposit.toFixed(4)} {selectedSymbol}).
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy === -1 || (Boolean(flowRate && deposit) && !isDepositSufficient)}
              className="gs-btn-primary w-full py-3 text-sm"
            >
              {busy === -1
                ? 'Waiting for SubWallet Signature…'
                : streamAsset === 'gvara' && needsAutoWrap
                ? `Sign Auto-Wrap (${(parseFloat(deposit || '0') * 1.03).toFixed(2)} VARA → gVARA) & Start Stream`
                : `Sign & Start ${deposit || ''} ${selectedSymbol} Stream on Vara Mainnet`}
            </button>
          </form>
        </Reveal>
      )}

      {/* Active & Historical Streams List */}
      {loading ? (
        <RowsSkeleton rows={3} />
      ) : (
        <RevealGroup className="space-y-4" stagger={0.05}>
          {streams.map((s) => {
            const rt = computeRealtime(s, nowSec);
            const isSender = !accountHex || s.sender?.toLowerCase() === accountHex;
            const isReceiver = !accountHex || s.receiver?.toLowerCase() === accountHex;
            const sym = tokenSymbol(s.token);

            return (
              <div key={`${s.id}-${s.token}`} data-reveal-item className="gs-card p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-base text-[#111827]">Stream #{s.id}</span>
                    {streamNames[s.id] && (
                      <span className="px-2 py-0.5 rounded bg-[#F4F5F2] text-xs font-medium text-[#111827]">
                        {streamNames[s.id]}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        s.status === 'Active'
                          ? 'bg-[#E6F4ED] text-[#136F46] border border-[#B6DFC8]'
                          : s.status === 'Paused'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      ● {rt.isDepleted ? 'Depleted' : s.status}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#F4F5F2] text-[10px] font-mono text-[#6B7280]">
                      {sym}
                    </span>
                  </div>

                  {/* Lifecycle Controls */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {s.blockHash && (
                      <a
                        href={`https://vara.subscan.io/block/${s.blockHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-md bg-[#E6F4ED] text-[#136F46] text-[11px] font-mono font-semibold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Subscan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {s.status === 'Active' && isSender && (
                      <button
                        type="button"
                        onClick={() => handleAction(s, 'pause')}
                        disabled={busy === s.id}
                        className="gs-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        <Pause className="w-3 h-3" /> Pause
                      </button>
                    )}
                    {s.status === 'Paused' && isSender && (
                      <button
                        type="button"
                        onClick={() => handleAction(s, 'resume')}
                        disabled={busy === s.id}
                        className="gs-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Resume
                      </button>
                    )}
                    {(s.status === 'Active' || s.status === 'Paused') && isReceiver && (
                      <button
                        type="button"
                        onClick={() => handleAction(s, 'withdraw')}
                        disabled={busy === s.id}
                        className="gs-btn-secondary px-2.5 py-1 text-xs flex items-center gap-1"
                      >
                        <ArrowDownToLine className="w-3 h-3" /> Withdraw
                      </button>
                    )}
                    {(s.status === 'Active' || s.status === 'Paused') && isSender && (
                      <button
                        type="button"
                        onClick={() => handleAction(s, 'stop')}
                        disabled={busy === s.id}
                        className="px-2.5 py-1 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Square className="w-3 h-3" /> Stop & Refund
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Accrual Bar */}
                <div className="p-3.5 rounded-xl bg-[#F4F5F2] border border-[#E6E8E5]">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-[#6B7280]">Real-Time Accrued Stream</span>
                    <span className="text-xs font-mono text-[#6B7280]">{rt.progress.toFixed(2)}% streamed</span>
                  </div>
                  <p className="font-mono text-xl font-bold text-[#136F46] tabular-nums">
                    {formatTokenAmount(rt.totalStreamed, s.token)}
                  </p>
                  <div className="mt-2 h-2 rounded-full bg-white border border-[#E6E8E5] overflow-hidden">
                    <div
                      className="h-full bg-[#136F46] transition-all duration-700"
                      style={{ width: `${Math.min(100, rt.progress)}%` }}
                    />
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <span className="text-[#6B7280] block">Sender</span>
                    <span className="font-mono text-[#111827]">{truncAddr(s.sender)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Receiver</span>
                    <span className="font-mono text-[#111827]">{truncAddr(s.receiver)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#136F46]" /> Flow Rate
                    </span>
                    <span className="font-mono font-semibold text-[#111827]">{formatFlowRate(s.flow_rate, s.token)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Remaining Deposit</span>
                    <span className="font-mono text-[#111827]">{formatTokenAmount(rt.remaining, s.token)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Time Left
                    </span>
                    <span className="font-mono text-[#111827]">
                      {s.status === 'Active' ? formatDuration(rt.timeToDepletion) : '—'}
                    </span>
                  </div>
                </div>

                {/* Inline Top-Up Bar */}
                {(s.status === 'Active' || s.status === 'Paused') && isSender && (
                  <div className="flex items-center gap-2 pt-3 border-t border-[#E6E8E5]">
                    <input
                      value={depositAmounts[s.id] || ''}
                      onChange={(e) => setDepositAmounts((prev) => ({ ...prev, [s.id]: e.target.value }))}
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder={`Top up stream buffer (${sym})`}
                      className="gs-input !py-1.5 !text-xs max-w-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleAction(s, 'deposit')}
                      disabled={busy === s.id}
                      className="gs-btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1"
                    >
                      <ArrowUpFromLine className="w-3 h-3" /> Top Up Stream
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </RevealGroup>
      )}
    </div>
  );
}
