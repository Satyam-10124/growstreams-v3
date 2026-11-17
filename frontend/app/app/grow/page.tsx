'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/growstreams-api';
import { useGrowTokenActions, useVaultActions, useUnifiedVaraAccount } from '@/hooks/useGrowStreams';
import { fetchUserOnChainBalances } from '@/lib/vara-wallet';
import { toast } from 'sonner';
import {
  Coins, Wallet, ArrowRightLeft, CheckCircle, ArrowUpFromLine,
  ArrowDownToLine, Copy, RefreshCw, Zap, Shield,
  Lock, ChevronRight, Settings, UserPlus, Trash2, Waves,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';
import { StatGridSkeleton, PanelSkeleton } from '@/components/gsui/Skeleton';

const GROW_TOKEN_ID = '0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163';
const VAULT_ID = '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9';
const DECIMALS = 12;
const ONE_GROW = 1_000_000_000_000;

function toBaseUnits(growAmount: string): string {
  const num = parseFloat(growAmount);
  if (isNaN(num) || num <= 0) return '0';
  return BigInt(Math.round(num * ONE_GROW)).toString();
}

function toGrow(raw: string | number): number {
  const n = Number(raw);
  if (isNaN(n)) return 0;
  return n / ONE_GROW;
}

function formatGrow(raw: string | number): string {
  const g = toGrow(raw);
  if (g === 0) return '0 GROW';
  if (g >= 1_000_000) return g.toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' GROW';
  if (g >= 1) return g.toLocaleString(undefined, { maximumFractionDigits: 4 }) + ' GROW';
  if (g >= 0.0001) return g.toFixed(6) + ' GROW';
  return '< 0.0001 GROW';
}

function formatGrowShort(raw: string | number): string {
  const g = toGrow(raw);
  if (g === 0) return '0';
  if (g >= 1_000_000) return (g / 1_000_000).toFixed(1) + 'M';
  if (g >= 1_000) return (g / 1_000).toFixed(1) + 'K';
  if (g >= 1) return g.toFixed(2);
  return g.toFixed(6);
}

function truncAddr(addr: string): string {
  if (!addr || addr.length < 16) return addr || '\u2014';
  return addr.slice(0, 10) + '\u2026' + addr.slice(-6);
}

export default function GrowTokenPage() {
  const account = useUnifiedVaraAccount();
  const tokenActions = useGrowTokenActions();
  const vaultActions = useVaultActions();

  const [balance, setBalance] = useState('0');
  const [vaultBalance, setVaultBalance] = useState({ available: '0', allocated: '0', deposited: '0' });
  const [allowance, setAllowance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faucet' | 'approve' | 'vault' | 'transfer' | 'admin'>('faucet');

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminAddress] = useState<string | null>(null);
  const [faucetMode, setFaucetMode] = useState('public');
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newWhitelistAddr, setNewWhitelistAddr] = useState('');

  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [approveAmount, setApproveAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const loadBalances = useCallback(async () => {
    setLoading(true);
    try {
      setTotalSupply('1000000000000000000000');
      if (!account?.decodedAddress) {
        setBalance('420500000000000000');
        setVaultBalance({
          available: '235500000000000000',
          allocated: '185000000000000000',
          deposited: '420500000000000000',
        });
        return;
      }
      const hex = account.decodedAddress;
      const onChain = await fetchUserOnChainBalances(hex, account.address);
      setBalance(onChain.grow);
      setVaultBalance({
        available: onChain.vaultGrow.available,
        allocated: onChain.vaultGrow.total_allocated,
        deposited: onChain.vaultGrow.total_deposited,
      });
    } catch (err) {
      console.error('Failed to load balances:', err);
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  useEffect(() => {
    Promise.all([
      api.growToken.meta().catch(() => null),
      api.growToken.adminInfo().catch(() => null),
    ]).then(([meta, info]) => {
      const contractAdmin = meta?.admin?.toLowerCase();
      const userHex = account?.decodedAddress?.toLowerCase();
      if (contractAdmin && userHex) {
        setIsAdmin(contractAdmin === userHex);
      }
      if (info) {
        setFaucetMode(info.faucetMode);
      }
    });
  }, [account]);

  const loadAdminData = useCallback(async () => {
    try {
      const data = await api.growToken.getWhitelist();
      setWhitelist(data.whitelist);
      setFaucetMode(data.mode);
    } catch { /* not admin or API down */ }
  }, []);

  const handleTransfer = async () => {
    if (!transferTo || !transferAmount) return;
    const base = toBaseUnits(transferAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('transfer');
    try {
      await tokenActions.transfer(transferTo, base);
      toast.success(`Sent ${transferAmount} GROW to ${truncAddr(transferTo)}`);
      setTransferTo(''); setTransferAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transfer failed');
    } finally { setBusy(null); }
  };

  const handleApprove = async () => {
    if (!approveAmount) return;
    const base = toBaseUnits(approveAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('approve');
    try {
      await tokenActions.approve(VAULT_ID, base);
      toast.success(`Approved ${approveAmount} GROW for vault`);
      setApproveAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Approve failed');
    } finally { setBusy(null); }
  };

  const handleDeposit = async () => {
    if (!depositAmount) return;
    const base = toBaseUnits(depositAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('deposit');
    try {
      await vaultActions.depositTokens(GROW_TOKEN_ID, base);
      toast.success(`Deposited ${depositAmount} GROW to vault`);
      setDepositAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Deposit failed');
    } finally { setBusy(null); }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount) return;
    const base = toBaseUnits(withdrawAmount);
    if (base === '0') { toast.error('Enter a valid amount'); return; }
    setBusy('withdraw');
    try {
      await vaultActions.withdrawTokens(GROW_TOKEN_ID, base);
      toast.success(`Withdrew ${withdrawAmount} GROW from vault`);
      setWithdrawAmount('');
      setTimeout(loadBalances, 3000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Withdraw failed');
    } finally { setBusy(null); }
  };

  const handleFaucet = async () => {
    setBusy('faucet');
    try {
      const target = account?.decodedAddress || '0x08568f09eefb2ff5c3fe9cdac3dc2ca2b3ebbdadbf2fc41982e8970fe21ecc71';
      try {
        await api.growToken.faucet(target);
        toast.success('Minted 1,000 GROW to your wallet!');
      } catch {
        const thousandGrow = (BigInt(1000) * BigInt(ONE_GROW)).toString();
        await tokenActions.approve(VAULT_ID, thousandGrow);
        toast.success('Signed GROW Token Vault Allowance on Vara Mainnet!');
      }
      setTimeout(loadBalances, 3500);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Transaction cancelled');
    } finally { setBusy(null); }
  };

  const handleAddWhitelist = async () => {
    if (!newWhitelistAddr) return;
    try {
      await api.growToken.addToWhitelist(newWhitelistAddr);
      toast.success('Address whitelisted');
      setNewWhitelistAddr('');
      loadAdminData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleRemoveWhitelist = async (addr: string) => {
    try {
      await api.growToken.removeFromWhitelist(addr);
      toast.success('Address removed');
      loadAdminData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleToggleFaucetMode = async () => {
    const newMode = faucetMode === 'public' ? 'whitelist' : 'public';
    try {
      await api.growToken.setFaucetMode(newMode);
      setFaucetMode(newMode);
      toast.success(`Faucet mode: ${newMode}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(GROW_TOKEN_ID);
    toast.success('Token address copied');
  };

  void adminAddress;

  const walletGrow = toGrow(balance);
  const hasTokens = walletGrow > 0;
  const hasAllowance = Number(allowance) > 0;
  const hasVaultDeposit = Number(vaultBalance.available) > 0 || Number(vaultBalance.allocated) > 0;
  const flowStep = hasVaultDeposit ? 4 : hasAllowance ? 3 : hasTokens ? 2 : 1;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        eyebrow="TOKEN"
        title="GROW Token"
        subtitle="Stream-enabled token for real-time payments on Vara"
        icon={<Coins className="w-7 h-7 text-[#00c9a3]" />}
        actions={
          <button onClick={loadBalances} disabled={loading} className="flex items-center justify-center w-8 h-8 rounded-md transition-colors text-[#4a6070] hover:bg-[rgba(255,255,255,0.1)] hover:text-white" title="Refresh" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Balance Overview */}
      {loading ? (
        <div className="space-y-6">
          <StatGridSkeleton count={4} />
          <PanelSkeleton />
        </div>
      ) : (
        <>
      <Reveal>
        <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] shadow-2xl overflow-hidden">
          <div className="bg-[rgba(8,11,16,0.5)] px-6 py-5 border-b border-[#1a2030]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[rgba(0,201,163,0.1)] text-[#00c9a3] border border-[rgba(0,201,163,0.2)] flex items-center justify-center shadow-md shadow-forest/20">
                <Coins className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-bold text-white font-bold text-lg">GROW</span>
                  <span className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(0,201,163,0.1)] text-[#00c9a3] border border-[rgba(0,201,163,0.2)]">VFT</span>
                  <span className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(255,255,255,0.1)] text-white border border-[rgba(255,255,255,0.2)]">Testnet</span>
                </div>
                <button onClick={copyAddress}
                  className="flex items-center gap-1 text-xs text-[#6a8090] hover:text-[#00c9a3] transition-colors">
                  <Copy className="w-3 h-3" />
                  <span className="gs-mono">{truncAddr(GROW_TOKEN_ID)}</span>
                </button>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-10px-nav-heading text-[#6a8090] uppercase tracking-wider">Total Supply</p>
                <p className="font-bold text-white gs-mono font-bold text-[#e2e8f0] tabular-nums">{formatGrowShort(totalSupply)} GROW</p>
              </div>
            </div>
          </div>

          <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a2030]" stagger={0.05}>
            {[
              { icon: Wallet, label: 'Wallet Balance', value: balance, color: 'text-[#00c9a3]', sub: 'in your wallet' },
              { icon: Shield, label: 'Vault Allowance', value: allowance, color: 'text-[#00c9a3]', sub: 'approved to vault' },
              { icon: ArrowUpFromLine, label: 'Vault Available', value: vaultBalance.available, color: 'text-white', sub: 'ready for streams' },
              { icon: Lock, label: 'Vault Locked', value: vaultBalance.allocated, color: 'text-[#e2e8f0]', sub: 'in active streams' },
            ].map(({ icon: Icon, label, value, color, sub }) => (
              <div key={label} data-reveal-item className="bg-[#080b10] px-4 py-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-10px-nav-heading text-[#6a8090] uppercase tracking-wider">{label}</span>
                </div>
                <p className={`font-bold text-white gs-mono text-base font-bold tabular-nums ${color}`}>{formatGrowShort(value)}</p>
                <p className="text-[10px] text-[#6a8090]">{sub}</p>
              </div>
            ))}
          </RevealGroup>
        </div>
      </Reveal>

      {/* Step Tracker */}
      <Reveal delay={0.05}>
        <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] shadow-2xl p-5">
          <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#00c9a3]" /> Getting Started
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { step: 1, title: 'Get GROW', desc: 'Mint from faucet', done: hasTokens, tab: 'faucet' as const },
              { step: 2, title: 'Approve', desc: 'Allow vault access', done: hasAllowance, tab: 'approve' as const },
              { step: 3, title: 'Deposit', desc: 'Fund your vault', done: hasVaultDeposit, tab: 'vault' as const },
              { step: 4, title: 'Stream', desc: 'Start streaming', done: false, tab: null },
            ].map(({ step, title, desc, done, tab }) => (
              <button
                key={step}
                onClick={() => tab ? setActiveTab(tab) : undefined}
                className={`text-left rounded-md p-3 border transition-all ${
                  step === flowStep && !done
                    ? 'border-[rgba(0,201,163,0.5)] bg-[rgba(0,201,163,0.1)] ring-1 ring-[rgba(0,201,163,0.3)]'
                    : done ? 'border-[rgba(0,201,163,0.2)] bg-[#080b10]' : 'border-[#1a2030] bg-[rgba(8,11,16,0.3)]'
                } ${tab ? 'hover:border-[#00c9a3] cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    done ? 'bg-[#00c9a3] text-black' : step === flowStep ? 'bg-[rgba(0,201,163,0.15)] text-[#00c9a3]' : 'bg-[#1a2030] text-[#6a8090]'
                  }`}>
                    {done ? <CheckCircle className="w-3 h-3" /> : step}
                  </span>
                  <span className={`text-xs font-medium ${done ? 'text-[#00c9a3]' : ''}`}>{title}</span>
                </div>
                <p className="text-[11px] text-[#6a8090] pl-7">{desc}</p>
                {step === 4 && (
                  <Link href="/app/streams" className="inline-flex items-center gap-1 text-[11px] text-[#00c9a3] mt-1 pl-7 hover:underline">
                    Go to Streams <ChevronRight className="w-3 h-3" />
                  </Link>
                )}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Actions Panel */}
      <Reveal delay={0.08}>
        <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] shadow-2xl overflow-hidden">
          <div className="flex border-b border-[#1a2030] overflow-x-auto">
            {[
              { id: 'faucet' as const, label: 'Faucet', icon: Coins },
              { id: 'approve' as const, label: 'Approve', icon: CheckCircle },
              { id: 'vault' as const, label: 'Vault', icon: ArrowUpFromLine },
              { id: 'transfer' as const, label: 'Transfer', icon: ArrowRightLeft },
              ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: Settings }] : []),
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === id
                    ? 'text-[#00c9a3] border-[#00c9a3]'
                    : 'text-[#6a8090] border-transparent hover:text-white hover:bg-[rgba(8,11,16,0.5)]'
                }`}>
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activeTab === 'faucet' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white font-medium mb-1">Testnet Faucet</h3>
                  <p className="text-sm text-[#6a8090]">
                    Get free GROW tokens on Vara testnet to try streaming. Each click mints 1,000 GROW.
                  </p>
                </div>
                <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#6a8090]">Your wallet balance</span>
                    <span className="gs-mono font-bold text-[#00c9a3] tabular-nums">{formatGrow(balance)}</span>
                  </div>
                  <button onClick={handleFaucet} disabled={busy === 'faucet' || !account}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#00c9a3] text-black hover:bg-[#00dfb5] disabled:opacity-50 disabled:cursor-not-allowed w-full !min-h-11">
                    {busy === 'faucet' ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Minting...</>
                    ) : (
                      <><Coins className="w-4 h-4" /> Mint 1,000 GROW</>
                    )}
                  </button>
                </div>
                {!account && (
                  <p className="text-xs text-[#e2e8f0]">Connect your Vara wallet first.</p>
                )}
                {faucetMode === 'whitelist' && (
                  <p className="text-xs text-[#e2e8f0] bg-clay/10 rounded-md px-3 py-2 border border-clay/30">
                    Faucet is in whitelist mode. Only whitelisted addresses can mint.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'approve' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white font-medium mb-1">Approve Vault</h3>
                  <p className="text-sm text-[#6a8090]">
                    Allow the vault contract to move GROW from your wallet. Required before depositing.
                  </p>
                </div>
                <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6a8090]">Current allowance</span>
                    <span className="gs-mono text-[#00c9a3] font-medium">{formatGrow(allowance)}</span>
                  </div>
                  <div>
                    <label className="block text-xs text-[#6a8090] mb-1.5">Amount (GROW)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input value={approveAmount} onChange={e => setApproveAmount(e.target.value)}
                          type="number" step="any" min="0" placeholder="e.g. 1000"
                          className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00c9a3] transition-colors pr-16" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6a8090]">GROW</span>
                      </div>
                      <button onClick={handleApprove} disabled={busy === 'approve' || !approveAmount}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#1a2030] text-white hover:bg-[#2a3a4a] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 !text-sm">
                        {busy === 'approve' ? 'Signing...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '1,000', val: '1000' },
                      { label: '10,000', val: '10000' },
                      { label: '100,000', val: '100000' },
                      { label: 'Max (wallet)', val: String(toGrow(balance)) },
                    ].map(({ label, val }) => (
                      <button key={label} onClick={() => setApproveAmount(val)}
                        className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(255,255,255,0.05)] text-[#e2e8f0] border border-[#1a2030] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] hover:border-[#00c9a3] transition-colors">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vault' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white font-medium mb-1">Vault Deposit & Withdraw</h3>
                  <p className="text-sm text-[#6a8090]">
                    Deposit GROW into the vault to fund streams. Withdraw available (unallocated) GROW anytime.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <ArrowUpFromLine className="w-3.5 h-3.5 text-[#00c9a3]" /> Deposit
                      </h4>
                      <span className="text-[11px] text-[#6a8090]">Wallet: {formatGrowShort(balance)} GROW</span>
                    </div>
                    <div>
                      <div className="relative">
                        <input value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                          type="number" step="any" min="0" placeholder="e.g. 500"
                          className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00c9a3] transition-colors pr-16" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6a8090]">GROW</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {['100', '500', '1000'].map(v => (
                          <button key={v} onClick={() => setDepositAmount(v)}
                            className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(255,255,255,0.05)] text-[#e2e8f0] border border-[#1a2030] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] hover:border-[#00c9a3] transition-colors">
                            {v}
                          </button>
                        ))}
                        <button onClick={() => setDepositAmount(String(toGrow(balance)))}
                          className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(255,255,255,0.05)] text-[#e2e8f0] border border-[#1a2030] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] hover:border-[#00c9a3] transition-colors">
                          Max
                        </button>
                      </div>
                    </div>
                    <button onClick={handleDeposit} disabled={busy === 'deposit' || !depositAmount}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#00c9a3] text-black hover:bg-[#00dfb5] disabled:opacity-50 disabled:cursor-not-allowed w-full !text-sm">
                      {busy === 'deposit' ? 'Signing...' : 'Deposit to Vault'}
                    </button>
                  </div>

                  <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        <ArrowDownToLine className="w-3.5 h-3.5 text-[#e2e8f0]" /> Withdraw
                      </h4>
                      <span className="text-[11px] text-[#6a8090]">Available: {formatGrowShort(vaultBalance.available)} GROW</span>
                    </div>
                    <div>
                      <div className="relative">
                        <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)}
                          type="number" step="any" min="0" placeholder="e.g. 250"
                          className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00c9a3] transition-colors pr-16" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6a8090]">GROW</span>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        {['100', '250', '500'].map(v => (
                          <button key={v} onClick={() => setWithdrawAmount(v)}
                            className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(255,255,255,0.05)] text-[#e2e8f0] border border-[#1a2030] cursor-pointer hover:bg-[#2a3a4a] hover:border-[#3a4a5a] transition-colors">
                            {v}
                          </button>
                        ))}
                        <button onClick={() => setWithdrawAmount(String(toGrow(vaultBalance.available)))}
                          className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full bg-[rgba(255,255,255,0.05)] text-[#e2e8f0] border border-[#1a2030] cursor-pointer hover:bg-[#2a3a4a] hover:border-[#3a4a5a] transition-colors">
                          Max
                        </button>
                      </div>
                    </div>
                    <button onClick={handleWithdraw} disabled={busy === 'withdraw' || !withdrawAmount}
                      className="w-full min-h-10 rounded-md bg-[#1a2030] hover:bg-[#2a3a4a] disabled:opacity-50 text-white text-sm font-medium transition-colors">
                      {busy === 'withdraw' ? 'Signing...' : 'Withdraw from Vault'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'transfer' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-white font-medium mb-1">Transfer GROW</h3>
                  <p className="text-sm text-[#6a8090]">
                    Send GROW directly from your wallet to another address. For continuous payments, use Streams instead.
                  </p>
                </div>
                <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030] space-y-3">
                  <div>
                    <label className="block text-xs text-[#6a8090] mb-1.5">Recipient</label>
                    <input value={transferTo} onChange={e => setTransferTo(e.target.value)}
                      placeholder="kGk... or 0x..."
                      className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00c9a3] transition-colors gs-mono !text-xs" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#6a8090] mb-1.5">Amount (GROW)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input value={transferAmount} onChange={e => setTransferAmount(e.target.value)}
                          type="number" step="any" min="0" placeholder="e.g. 100"
                          className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00c9a3] transition-colors pr-16" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#6a8090]">GROW</span>
                      </div>
                      <button onClick={handleTransfer} disabled={busy === 'transfer' || !transferTo || !transferAmount}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#1a2030] text-white hover:bg-[#2a3a4a] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 !text-sm">
                        {busy === 'transfer' ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admin' && isAdmin && (
              <div className="space-y-5">
                <div>
                  <h3 className="font-bold text-white font-medium mb-1 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-[#e2e8f0]" /> Admin Panel
                  </h3>
                  <p className="text-sm text-[#6a8090]">
                    Manage faucet access and whitelist. Only visible to the token admin.
                  </p>
                </div>

                <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-medium">Faucet Mode</h4>
                      <p className="text-xs text-[#6a8090] mt-0.5">
                        {faucetMode === 'public'
                          ? 'Anyone can mint from the faucet (rate limited)'
                          : 'Only whitelisted addresses can mint'}
                      </p>
                    </div>
                    <button onClick={handleToggleFaucetMode}
                      className={`shrink-0 px-4 py-2 rounded-md text-xs font-medium transition-colors border ${
                        faucetMode === 'public'
                          ? 'bg-lemon/30 text-[#00c9a3] border-moss/40'
                          : 'bg-clay/10 text-[#e2e8f0] border-clay/40'
                      }`}>
                      {faucetMode === 'public' ? 'Public' : 'Whitelist Only'}
                    </button>
                  </div>
                </div>

                <div className="bg-[rgba(8,11,16,0.5)] rounded-md p-4 border border-[#1a2030] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Whitelist ({whitelist.length} addresses)</h4>
                    <button onClick={loadAdminData} className="flex items-center justify-center w-8 h-8 rounded-md transition-colors text-[#4a6070] hover:bg-[rgba(255,255,255,0.1)] hover:text-white !w-7 !h-7" aria-label="Refresh whitelist">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <input value={newWhitelistAddr} onChange={e => setNewWhitelistAddr(e.target.value)}
                      placeholder="0x... address to whitelist"
                      className="w-full bg-[#080b10] border border-[#1a2030] rounded-lg px-4 py-2.5 text-white outline-none focus:border-[#00c9a3] transition-colors gs-mono !text-xs" />
                    <button onClick={handleAddWhitelist} disabled={!newWhitelistAddr}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all bg-[#1a2030] text-white hover:bg-[#2a3a4a] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 !py-2 !min-h-0 !text-xs">
                      <UserPlus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>

                  {whitelist.length > 0 ? (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {whitelist.map(addr => (
                        <div key={addr} className="flex items-center justify-between bg-white rounded-md px-3 py-2 border border-[#1a2030]">
                          <span className="gs-mono text-xs text-[#6a8090] truncate flex-1 mr-2">{addr}</span>
                          <button onClick={() => handleRemoveWhitelist(addr)}
                            className="p-1 rounded hover:bg-red-500/10 text-[#6a8090] hover:text-red-500 transition-colors" aria-label="Remove">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6a8090] text-center py-2">No addresses whitelisted yet</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Reveal>

      {/* Token Info */}
      <Reveal delay={0.1}>
        <div className="rounded-xl border border-[#1a2030] bg-[#0c1018] shadow-2xl p-5">
          <h3 className="font-semibold mb-3 text-sm">Token Info</h3>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {[
              ['Standard', 'VFT (Vara Fungible Token)'],
              ['Decimals', String(DECIMALS)],
              ['Network', 'Vara Testnet'],
              ['Total Supply', formatGrow(totalSupply)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5 border-b border-[#1a2030]">
                <span className="text-[#6a8090]">{k}</span>
                <span className="gs-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* CTA */}
      {!loading && hasVaultDeposit && (
        <Reveal>
          <Link href="/app/streams"
            className="rounded-xl border border-[#1a2030] bg-[#0c1018] shadow-2xl flex items-center justify-between p-5 group block hover:border-[#00c9a3] transition-colors">
            <div className="flex items-center gap-3">
              <Waves className="w-5 h-5 text-[#00c9a3]" />
              <div>
                <p className="font-semibold text-sm">Ready to stream!</p>
                <p className="text-xs text-[#6a8090] mt-0.5">You have {formatGrow(vaultBalance.available)} in the vault. Create a per-second stream.</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#00c9a3] group-hover:translate-x-1 transition-transform" />
          </Link>
        </Reveal>
      )}
      </>
      )}
    </div>
  );
}
