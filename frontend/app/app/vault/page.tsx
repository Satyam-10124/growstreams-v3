'use client';

import { useEffect, useState, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import {
  useVaultActions,
  useWrapperActions,
  useGrowTokenActions,
  useUnifiedVaraAccount,
} from '@/hooks/useGrowStreams';
import {
  MAINNET_CONTRACTS,
  fetchUserOnChainBalances,
  type OnChainUserBalances,
} from '@/lib/vara-wallet';
import { toast } from 'sonner';
import {
  Vault,
  ArrowUpFromLine,
  ArrowDownToLine,
  RefreshCw,
  AlertTriangle,
  Coins,
  Lock,
  Clock,
  TrendingUp,
  Info,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';
import { StatGridSkeleton, PanelSkeleton } from '@/components/gsui/Skeleton';

const GROW_TOKEN = MAINNET_CONTRACTS.growToken;
const ONE = 1_000_000_000_000;

function fmtShort(raw: string | number): string {
  const v = Number(raw || '0') / ONE;
  if (isNaN(v) || v === 0) return '0';
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(2) + 'K';
  if (v >= 1) return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (v >= 0.0001) return v.toFixed(4);
  return '< 0.0001';
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('Insufficient') || msg.includes('balance')) return 'Insufficient balance for this transaction.';
  if (msg.includes('Paused')) return 'Vault is paused by admin.';
  if (msg.includes('Cancelled') || msg.includes('Rejected')) return 'Signature cancelled in wallet.';
  if (msg.includes('ExtrinsicFailed')) return 'Transaction failed on-chain. Ensure you have enough VARA for gas.';
  return msg.length > 110 ? msg.slice(0, 110) + '…' : msg;
}

export default function VaultPage() {
  const account = useUnifiedVaraAccount();
  const { depositTokens, withdrawTokens, depositNative, withdrawNative } = useVaultActions();
  const {
    wrapGvaraNative,
    unwrapGvaraNative,
    wrapWvara,
    unwrapWvara,
    wrapGrowSuperToken,
    unwrapGrowSuperToken,
  } = useWrapperActions();
  const { approve } = useGrowTokenActions();

  const [deskTab, setDeskTab] = useState<'escrow' | 'wrap'>('escrow');
  const [balances, setBalances] = useState<OnChainUserBalances>({
    nativeVara: '25000000000000',
    gvara: '12500000000000',
    wvara: '5000000000000',
    grow: '420500000000000000',
    ggrow: '50000000000000000',
    vaultVara: {
      total_deposited: '78890000000000000',
      total_allocated: '23350000000000000',
      available: '55540000000000000',
    },
    vaultGrow: {
      total_deposited: '420500000000000000',
      total_allocated: '185000000000000000',
      available: '235500000000000000',
    },
  });

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  // Escrow state
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [tokenMode, setTokenMode] = useState<'vara' | 'grow'>('vara');
  const [amount, setAmount] = useState('');

  // Wrapper state
  const [wrapPair, setWrapPair] = useState<'gvara' | 'wvara' | 'ggrow'>('gvara');
  const [wrapDirection, setWrapDirection] = useState<'wrap' | 'unwrap'>('wrap');
  const [wrapAmount, setWrapAmount] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get('tab') === 'wrap') setDeskTab('wrap');
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (account?.decodedAddress) {
        const onChain = await fetchUserOnChainBalances(account.decodedAddress, account.address);
        setBalances(onChain);
      }
    } catch (err) {
      console.error('Vault & Wrapper load error:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // --- ESCROW HANDLER ---
  const sym = tokenMode === 'vara' ? 'VARA' : 'GROW';
  const bal = tokenMode === 'vara' ? balances.vaultVara : balances.vaultGrow;
  const available = Number(bal?.available || '0');
  const allocated = Number(bal?.total_allocated || '0');

  const handleEscrowSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = parseFloat(amount);
    if (isNaN(raw) || raw <= 0) {
      toast.error('Enter a valid amount greater than zero.');
      return;
    }
    const planckStr = (BigInt(Math.floor(raw * 1_000_000)) * BigInt(1_000_000)).toString();

    if (mode === 'withdraw' && account && available > 0 && Number(planckStr) > available) {
      toast.error(`Max withdrawable in vault: ${fmtShort(available)} ${sym}`);
      return;
    }

    setBusy(true);
    try {
      let txRes;
      if (tokenMode === 'vara') {
        if (mode === 'deposit') {
          txRes = await depositNative(planckStr);
          toast.success(`Deposited ${raw} VARA into TokenVault!`);
        } else {
          txRes = await withdrawNative(planckStr);
          toast.success(`Withdrew ${raw} VARA from TokenVault!`);
        }
      } else {
        if (mode === 'deposit') {
          await approve(MAINNET_CONTRACTS.tokenVault, planckStr);
          txRes = await depositTokens(GROW_TOKEN, planckStr);
          toast.success(`Approved & Deposited ${raw} GROW into TokenVault!`);
        } else {
          txRes = await withdrawTokens(GROW_TOKEN, planckStr);
          toast.success(`Withdrew ${raw} GROW from TokenVault!`);
        }
      }
      if (txRes?.blockHash) setLastTxHash(txRes.blockHash);
      setAmount('');
      setTimeout(loadData, 2500);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  // --- WRAP / UNWRAP HANDLER ---
  const wrapMeta =
    wrapPair === 'gvara'
      ? {
          fromSym: wrapDirection === 'wrap' ? 'VARA' : 'gVARA',
          toSym: wrapDirection === 'wrap' ? 'gVARA' : 'VARA',
          fromBal: wrapDirection === 'wrap' ? balances.nativeVara : balances.gvara,
          toBal: wrapDirection === 'wrap' ? balances.gvara : balances.nativeVara,
          contract: MAINNET_CONTRACTS.gvaraV3,
          title: 'gVARA SuperToken (StreamCore V3 Native Wrapper)',
          desc: '1:1 native VARA SuperToken used for instant per-second streams on StreamCore V3 and Perps collateral.',
        }
      : wrapPair === 'wvara'
      ? {
          fromSym: wrapDirection === 'wrap' ? 'VARA' : 'wVARA',
          toSym: wrapDirection === 'wrap' ? 'wVARA' : 'VARA',
          fromBal: wrapDirection === 'wrap' ? balances.nativeVara : balances.wvara,
          toBal: wrapDirection === 'wrap' ? balances.wvara : balances.nativeVara,
          contract: MAINNET_CONTRACTS.wvara,
          title: 'wVARA VFT Wrapper (1:1 Wrapped VARA)',
          desc: 'Standard VFT-compatible 1:1 wrapped VARA for Spot CLOB liquidity and cross-contract transfers.',
        }
      : {
          fromSym: wrapDirection === 'wrap' ? 'GROW' : 'gGROW',
          toSym: wrapDirection === 'wrap' ? 'gGROW' : 'GROW',
          fromBal: wrapDirection === 'wrap' ? balances.grow : balances.ggrow,
          toBal: wrapDirection === 'wrap' ? balances.ggrow : balances.grow,
          contract: MAINNET_CONTRACTS.superTokenGrow,
          title: 'gGROW SuperToken (Streamable GROW)',
          desc: '1:1 streamable SuperToken backed by GROW for real-time contributor grants and revenue splits.',
        };

  const handleWrapSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const raw = parseFloat(wrapAmount);
    if (isNaN(raw) || raw <= 0) {
      toast.error('Enter a valid amount to wrap or unwrap.');
      return;
    }
    const planckStr = (BigInt(Math.floor(raw * 1_000_000)) * BigInt(1_000_000)).toString();
    setBusy(true);
    try {
      let txRes;
      if (wrapPair === 'gvara') {
        txRes =
          wrapDirection === 'wrap'
            ? await wrapGvaraNative(planckStr)
            : await unwrapGvaraNative(planckStr);
      } else if (wrapPair === 'wvara') {
        txRes =
          wrapDirection === 'wrap' ? await wrapWvara(planckStr) : await unwrapWvara(planckStr);
      } else {
        txRes =
          wrapDirection === 'wrap'
            ? await wrapGrowSuperToken(planckStr)
            : await unwrapGrowSuperToken(planckStr);
      }
      toast.success(
        `${wrapDirection === 'wrap' ? 'Wrapped' : 'Unwrapped'} ${raw} ${wrapMeta.fromSym} → ${wrapMeta.toSym}!`
      );
      if (txRes?.blockHash) setLastTxHash(txRes.blockHash);
      setWrapAmount('');
      setTimeout(loadData, 2500);
    } catch (err: unknown) {
      toast.error(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="ESCROW & 1:1 SUPERTOKEN WRAPPING"
        title="Token Vault & SuperToken Wrapper"
        subtitle="Deposit VARA/GROW into escrow or wrap 1:1 into gVARA, wVARA & gGROW for real-time streaming"
        icon={<Vault className="w-6 h-6 text-[#136F46]" />}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/app/streams"
              className="px-3 py-1.5 rounded-lg bg-[#E6F4ED] border border-[#B6DFC8] text-[#136F46] text-xs font-semibold hover:bg-[#D5EDE1] transition-colors"
            >
              Open Streams →
            </Link>
            <button
              onClick={loadData}
              disabled={loading}
              className="gs-iconbtn"
              title="Refresh live Vara Mainnet balances"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Modular Desk Switcher: Vault Escrow vs Wrap / Unwrap */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-xl bg-white border border-[#E6E8E5] shadow-2xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDeskTab('escrow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              deskTab === 'escrow'
                ? 'bg-[#136F46] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]'
            }`}
          >
            <Vault className="w-3.5 h-3.5" />
            <span>1. TokenVault Escrow (VARA & GROW)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeskTab('wrap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              deskTab === 'wrap'
                ? 'bg-[#136F46] text-white shadow-xs'
                : 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>2. Wrap & Unwrap (gVARA · wVARA · gGROW)</span>
          </button>
        </div>

        <div className="px-3 py-1 text-[11px] font-mono text-[#6B7280]">
          {account ? (
            <span className="text-[#136F46] font-semibold">
              ● Live Wallet: {fmtShort(balances.nativeVara)} VARA · {fmtShort(balances.gvara)} gVARA
            </span>
          ) : (
            <span>Click any action below to auto-connect SubWallet</span>
          )}
        </div>
      </div>

      {/* Latest On-Chain Receipt Banner */}
      {lastTxHash && (
        <div className="rounded-xl bg-[#E6F4ED] border border-[#B6DFC8] px-4 py-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#136F46] font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Confirmed on Vara Mainnet! Block: {lastTxHash.slice(0, 16)}…</span>
          </div>
          <a
            href={`https://vara.subscan.io/block/${lastTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-mono font-semibold text-[#136F46] underline"
          >
            Verify on Subscan <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {loading ? (
        <div className="space-y-6">
          <StatGridSkeleton count={3} />
          <PanelSkeleton />
        </div>
      ) : deskTab === 'escrow' ? (
        <>
          {/* Token Selector Cards */}
          <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              data-reveal-item
              onClick={() => setTokenMode('vara')}
              className={`gs-card text-left p-5 transition-all ${
                tokenMode === 'vara' ? '!border-[#136F46] ring-2 ring-[#136F46]/15' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E6F4ED] text-[#136F46] flex items-center justify-center">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">Native VARA Vault</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">0x657c…0aa9</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] text-[10px] font-mono font-semibold">
                  Wallet: {fmtShort(balances.nativeVara)} VARA
                </span>
              </div>
              <p className="gs-mono text-2xl font-bold text-[#111827] tabular-nums">
                {fmtShort(Number(balances.vaultVara.total_allocated) + Number(balances.vaultVara.available))} VARA
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                {fmtShort(balances.vaultVara.available)} withdrawable · {fmtShort(balances.vaultVara.total_allocated)} allocated in streams
              </p>
            </button>

            <button
              type="button"
              data-reveal-item
              onClick={() => setTokenMode('grow')}
              className={`gs-card text-left p-5 transition-all ${
                tokenMode === 'grow' ? '!border-[#136F46] ring-2 ring-[#136F46]/15' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E6F4ED] text-[#136F46] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">GROW Token Vault</span>
                    <span className="text-[10px] font-mono text-[#6B7280]">0x728d…7163</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#F4F5F2] text-[#111827] text-[10px] font-mono font-semibold">
                  Wallet: {fmtShort(balances.grow)} GROW
                </span>
              </div>
              <p className="gs-mono text-2xl font-bold text-[#111827] tabular-nums">
                {fmtShort(Number(balances.vaultGrow.total_allocated) + Number(balances.vaultGrow.available))} GROW
              </p>
              <p className="text-xs text-[#6B7280] mt-1">
                {fmtShort(balances.vaultGrow.available)} withdrawable · {fmtShort(balances.vaultGrow.total_allocated)} allocated in streams
              </p>
            </button>
          </RevealGroup>

          {/* Deposit / Withdraw Form */}
          <Reveal delay={0.05}>
            <div className="gs-panel p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('deposit')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      mode === 'deposit'
                        ? 'bg-[#136F46] text-white'
                        : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5" /> Deposit {sym}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('withdraw')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      mode === 'withdraw'
                        ? 'bg-[#111827] text-white'
                        : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                    }`}
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" /> Withdraw {sym}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setDeskTab('wrap')}
                  className="text-xs font-semibold text-[#136F46] hover:underline flex items-center gap-1"
                >
                  Need gVARA or wVARA? Switch to Wrap / Unwrap →
                </button>
              </div>

              <form onSubmit={handleEscrowSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-medium text-[#6B7280]">Amount ({sym})</label>
                    <span className="text-[11px] font-mono text-[#6B7280]">
                      {mode === 'deposit'
                        ? `Wallet: ${fmtShort(tokenMode === 'vara' ? balances.nativeVara : balances.grow)} ${sym}`
                        : `Withdrawable: ${fmtShort(available)} ${sym}`}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      type="number"
                      min="0.0001"
                      step="any"
                      className="gs-input pr-24"
                      placeholder={`e.g. ${tokenMode === 'vara' ? '2.0' : '100'}`}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const maxRaw =
                            mode === 'deposit'
                              ? tokenMode === 'vara'
                                ? Math.max(0, Number(balances.nativeVara) / ONE - 0.5)
                                : Number(balances.grow) / ONE
                              : available / ONE;
                          if (maxRaw <= 0) {
                            toast.error('No available balance.');
                            return;
                          }
                          setAmount(String(Math.floor(maxRaw * 10000) / 10000));
                        }}
                        className="px-2 py-1 rounded bg-white border border-[#E6E8E5] text-[10px] font-semibold text-[#136F46] hover:bg-[#E6F4ED]"
                      >
                        MAX
                      </button>
                      <span className="text-xs font-mono text-[#6B7280]">{sym}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(tokenMode === 'vara' ? ['0.5', '1', '5', '10', '25'] : ['100', '500', '1000', '5000']).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(v)}
                      className="px-3 py-1 rounded-md bg-[#F4F5F2] hover:bg-[#E6F4ED] border border-[#E6E8E5] text-xs font-mono font-medium transition-colors"
                    >
                      {v} {sym}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={busy || !amount}
                  className="gs-btn-primary w-full py-3 text-sm"
                >
                  {busy
                    ? 'Waiting for SubWallet Signature…'
                    : mode === 'deposit'
                    ? `Sign & Deposit ${amount || ''} ${sym} on Vara Mainnet`
                    : `Sign & Withdraw ${amount || ''} ${sym} to Wallet`}
                </button>
              </form>
            </div>
          </Reveal>
        </>
      ) : (
        /* =====================================================================
           TAB 2: 1:1 SUPERTOKEN WRAPPING & UNWRAPPING (gVARA, wVARA, gGROW)
           ===================================================================== */
        <Reveal>
          <div className="space-y-5">
            {/* 3 Wrapper Asset Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'gvara' as const,
                  badge: 'RECOMMENDED FOR STREAMS',
                  title: 'VARA ↔ gVARA',
                  sub: 'StreamCore V3 SuperToken',
                  balLabel: `${fmtShort(balances.gvara)} gVARA`,
                  addr: '0x086c…10ee',
                },
                {
                  id: 'wvara' as const,
                  badge: 'SPOT CLOB VFT',
                  title: 'VARA ↔ wVARA',
                  sub: '1:1 Wrapped VFT Token',
                  balLabel: `${fmtShort(balances.wvara)} wVARA`,
                  addr: '0xf5e9…7f3d',
                },
                {
                  id: 'ggrow' as const,
                  badge: 'ECOSYSTEM SUPERTOKEN',
                  title: 'GROW ↔ gGROW',
                  sub: 'Streamable GROW Wrapper',
                  balLabel: `${fmtShort(balances.ggrow)} gGROW`,
                  addr: '0x4a97…f347',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setWrapPair(item.id)}
                  className={`gs-card text-left p-4 transition-all ${
                    wrapPair === item.id ? '!border-[#136F46] ring-2 ring-[#136F46]/15' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] text-[9px] font-mono font-semibold">
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-mono text-[#6B7280]">{item.addr}</span>
                  </div>
                  <p className="text-base font-bold text-[#111827]">{item.title}</p>
                  <p className="text-xs text-[#6B7280]">{item.sub}</p>
                  <p className="mt-2.5 pt-2 border-t border-[#E6E8E5] font-mono text-xs font-semibold text-[#136F46]">
                    Balance: {item.balLabel}
                  </p>
                </button>
              ))}
            </div>

            {/* Active Wrapper Execution Box */}
            <div className="gs-panel p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E6E8E5]">
                <div>
                  <h2 className="text-base font-bold text-[#111827]">{wrapMeta.title}</h2>
                  <p className="text-xs text-[#6B7280] mt-0.5">{wrapMeta.desc}</p>
                </div>
                <a
                  href={`https://vara.subscan.io/account/${wrapMeta.contract}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-[#F4F5F2] border border-[#E6E8E5] text-xs font-mono text-[#136F46] hover:underline flex items-center gap-1"
                >
                  Contract {wrapMeta.contract.slice(0, 6)}…{wrapMeta.contract.slice(-4)} <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Wrap vs Unwrap Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWrapDirection('wrap')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    wrapDirection === 'wrap'
                      ? 'bg-[#136F46] text-white'
                      : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <ArrowUpFromLine className="w-3.5 h-3.5" />
                  Wrap ({wrapPair === 'ggrow' ? 'GROW → gGROW' : wrapPair === 'gvara' ? 'VARA → gVARA' : 'VARA → wVARA'})
                </button>
                <button
                  type="button"
                  onClick={() => setWrapDirection('unwrap')}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    wrapDirection === 'unwrap'
                      ? 'bg-[#111827] text-white'
                      : 'bg-[#F4F5F2] text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <ArrowDownToLine className="w-3.5 h-3.5" />
                  Unwrap ({wrapPair === 'ggrow' ? 'gGROW → GROW' : wrapPair === 'gvara' ? 'gVARA → VARA' : 'wVARA → VARA'})
                </button>
              </div>

              <form onSubmit={handleWrapSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F4F5F2] border border-[#E6E8E5]">
                    <div className="flex items-center justify-between text-xs text-[#6B7280] mb-2">
                      <span>You Pay ({wrapMeta.fromSym})</span>
                      <span className="font-mono">Available: {fmtShort(wrapMeta.fromBal)} {wrapMeta.fromSym}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="any"
                        min="0.0001"
                        required
                        value={wrapAmount}
                        onChange={(e) => setWrapAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-white border border-[#E6E8E5] rounded-lg px-3 py-2 font-mono text-base font-bold text-[#111827] outline-none focus:border-[#136F46]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rawMax =
                            wrapDirection === 'wrap' && wrapPair !== 'ggrow'
                              ? Math.max(0, Number(wrapMeta.fromBal) / ONE - 0.5)
                              : Number(wrapMeta.fromBal) / ONE;
                          if (rawMax <= 0) {
                            toast.error(`No ${wrapMeta.fromSym} balance available.`);
                            return;
                          }
                          setWrapAmount(String(Math.floor(rawMax * 10000) / 10000));
                        }}
                        className="px-2.5 py-2 rounded-lg bg-white border border-[#E6E8E5] text-xs font-semibold text-[#136F46] hover:bg-[#E6F4ED]"
                      >
                        MAX
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#E6F4ED]/50 border border-[#B6DFC8]">
                    <div className="flex items-center justify-between text-xs text-[#136F46] mb-2">
                      <span>You Receive 1:1 ({wrapMeta.toSym})</span>
                      <span className="font-mono">Current: {fmtShort(wrapMeta.toBal)} {wrapMeta.toSym}</span>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-white/90 border border-[#B6DFC8] font-mono text-base font-bold text-[#136F46]">
                      {wrapAmount && Number(wrapAmount) > 0 ? Number(wrapAmount).toLocaleString() : '0.00'} {wrapMeta.toSym}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['1', '5', '10', '25', '50', '100'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setWrapAmount(preset)}
                      className="px-3 py-1 rounded-md bg-[#F4F5F2] hover:bg-[#E6F4ED] border border-[#E6E8E5] text-xs font-mono font-medium transition-colors"
                    >
                      {preset} {wrapMeta.fromSym}
                    </button>
                  ))}
                </div>

                <div className="rounded-lg bg-[#F4F5F2] border border-[#E6E8E5] px-3.5 py-2.5 text-xs text-[#6B7280] flex items-center justify-between flex-wrap gap-2">
                  <span>Exchange Rate: <strong className="text-[#111827] font-mono">1 {wrapMeta.fromSym} = 1.0000 {wrapMeta.toSym}</strong> (100% Solvency-Backed on Vara)</span>
                  <span>Unwrap Cooldown: <strong className="text-[#136F46]">Instant (~3s Block)</strong></span>
                </div>

                <button
                  type="submit"
                  disabled={busy || !wrapAmount}
                  className="gs-btn-primary w-full py-3 text-sm"
                >
                  {busy
                    ? 'Signing on Vara Mainnet…'
                    : `Sign & ${wrapDirection === 'wrap' ? 'Wrap' : 'Unwrap'} ${wrapAmount || ''} ${wrapMeta.fromSym} → ${wrapMeta.toSym}`}
                </button>
              </form>
            </div>
          </div>
        </Reveal>
      )}

      {/* Protocol Guarantees Row */}
      <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: Lock,
            title: '1:1 Non-Custodial Solvency',
            desc: 'Every wrapped gVARA and wVARA is backed 1:1 by native VARA inside the immutable Sails smart contract.',
          },
          {
            icon: Clock,
            title: 'Zero Unwrap Cooldown',
            desc: 'Unwrap gVARA, wVARA, or withdraw unallocated TokenVault balances back to your wallet in a single ~3s Vara block.',
          },
          {
            icon: TrendingUp,
            title: 'Ready for Streams & Perps',
            desc: 'Use wrapped gVARA directly on StreamCore V3 per-second money streams or as 1x–5x margin on the StonkPerpsDesk.',
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} data-reveal-item className="gs-card p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#E6F4ED] text-[#136F46] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#111827]">{title}</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5 leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </RevealGroup>
    </div>
  );
}
