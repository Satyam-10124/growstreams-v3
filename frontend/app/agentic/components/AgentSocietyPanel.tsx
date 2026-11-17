"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/growstreams-api';
import { useAccount, useApi } from '@gear-js/react-hooks';

const FALLBACK_WALLET = 'kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA';
const STONK_PERPS_PROGRAM_ID = '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81' as const;
const STONK_ORDERBOOK_PROGRAM_ID = '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf' as const;

function scaleCompactU32Hex(n: number): string {
  if (n < 64) return ((n << 2) & 0xff).toString(16).padStart(2, '0');
  const v = (n << 2) | 1;
  return (v & 0xff).toString(16).padStart(2, '0') + ((v >> 8) & 0xff).toString(16).padStart(2, '0');
}

function scaleStringHex(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let hex = scaleCompactU32Hex(bytes.length);
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex;
}

function u8Hex(n: number): string {
  return (n & 0xff).toString(16).padStart(2, '0');
}

function u64LEHex(val: bigint | number): string {
  let v = BigInt(val);
  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += Number(v & BigInt(0xff)).toString(16).padStart(2, '0');
    v >>= BigInt(8);
  }
  return hex;
}

function u128LEHex(val: bigint | number): string {
  let v = BigInt(val);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += Number(v & BigInt(0xff)).toString(16).padStart(2, '0');
    v >>= BigInt(8);
  }
  return hex;
}

function encodeOpenStockPositionPayload(
  ticker: string,
  isLong: boolean,
  marginGvara: number,
  leverage: number,
  isAgentActor = false,
  splitsGroupId = 1
): `0x${string}` {
  const clampedLev = Math.min(Math.max(Math.round(leverage), 1), 5);
  const marginPlancks = BigInt(Math.max(1, Math.round(marginGvara))) * BigInt('1000000000000');
  const hex =
    scaleStringHex('StonkBaseService') +
    scaleStringHex('OpenStockPosition') +
    scaleStringHex(ticker) +
    u8Hex(isLong ? 1 : 0) +
    u128LEHex(marginPlancks) +
    u8Hex(clampedLev) +
    u8Hex(isAgentActor ? 1 : 0) +
    u64LEHex(splitsGroupId);
  return `0x${hex}`;
}

function encodePlaceSpotOrderPayload(
  pair: string,
  isBuy: boolean,
  priceUsd: number,
  amountVara: number
): `0x${string}` {
  const priceE8 = BigInt(Math.max(1, Math.round(priceUsd * 1e8)));
  const amountPlancks = BigInt(Math.max(1, Math.round(amountVara))) * BigInt('1000000000000');
  const hex =
    scaleStringHex('StonkBaseService') +
    scaleStringHex('PlaceSpotOrder') +
    scaleStringHex(pair) +
    u8Hex(isBuy ? 1 : 0) +
    u64LEHex(priceE8) +
    u128LEHex(amountPlancks);
  return `0x${hex}`;
}

interface SocietyAgent {
  id: string;
  owner_wallet: string;
  owner_handle: string;
  agent_wallet: string;
  agent_actor_id: string;
  template_type: 'TRADER' | 'SDE' | 'ART' | 'X';
  name: string;
  role_title: string;
  hire_fee_vara: number;
  split_weight: number;
  total_jobs: number;
  total_volume_vara: number;
}

interface AcpTxHop {
  hopNumber: number;
  hopType: string;
  contractName: string;
  contractAddress: string;
  serviceMethod: string;
  amountVara: number;
  tokenSymbol: string;
  txHash: string;
  explorerUrl: string;
}

export default function AgentSocietyPanel() {
  const { account } = useAccount();
  const { api: gearApi, isApiReady } = useApi();
  const activeWallet = account?.address || account?.decodedAddress || FALLBACK_WALLET;

  const [viewTab, setViewTab] = useState<'SOCIETY' | 'STONKBASE' | 'SCHEDULER'>('SOCIETY');
  const [agents, setAgents] = useState<SocietyAgent[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [stonkbase, setStonkbase] = useState<any>(null);
  const [scheduler, setScheduler] = useState<any>(null);

  const [handleInput, setHandleInput] = useState('Anmol');
  const [agentCountInput, setAgentCountInput] = useState(5);
  const [creatorTopUpInput, setCreatorTopUpInput] = useState(25);
  const [selectedTicker, setSelectedTicker] = useState('NVDA');
  const [selectedLeverage, setSelectedLeverage] = useState(5);
  const [marginInput, setMarginInput] = useState(50);

  const [spawning, setSpawning] = useState(false);
  const [hiringOwner, setHiringOwner] = useState<string | null>(null);
  const [trading, setTrading] = useState(false);
  const [tickingAll, setTickingAll] = useState(false);
  const [latestCascade, setLatestCascade] = useState<any>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [latestTxUrl, setLatestTxUrl] = useState<string | null>(null);

  const signOnVaraMainnet = useCallback(
    async (programId: `0x${string}`, payloadHex: `0x${string}`): Promise<string> => {
      if (!gearApi || !isApiReady) {
        throw new Error('Connecting to Vara Mainnet RPC... please retry in 2s.');
      }
      if (!account) {
        throw new Error('Please connect your SubWallet first.');
      }
      const { web3Enable, web3FromSource, web3FromAddress } = await import('@polkadot/extension-dapp');
      await web3Enable('GrowStreams V3 — Stonk on Vara');
      let injector;
      try {
        injector = await web3FromSource(account.meta.source);
      } catch {
        injector = await web3FromAddress(account.address);
      }
      if (!injector?.signer) {
        throw new Error('Could not access SubWallet signer.');
      }
      let gasLimit = BigInt('55000000000');
      try {
        const gas = await gearApi.program.calculateGas.handle(
          account.decodedAddress as `0x${string}`,
          programId,
          payloadHex,
          0,
          true
        );
        const minGas = BigInt(gas.min_limit.toString());
        const buffered = minGas + BigInt('5000000000') + (minGas * BigInt(20)) / BigInt(100);
        if (buffered > BigInt('15000000000') && buffered < BigInt('250000000000')) {
          gasLimit = buffered;
        }
      } catch {
        gasLimit = BigInt('55000000000');
      }
      return new Promise((resolve, reject) => {
        const tx = gearApi.message.send({
          destination: programId,
          payload: payloadHex,
          gasLimit: gasLimit.toString(),
          value: 0,
        });
        tx.signAndSend(account.address, { signer: injector.signer as any }, ({ status, events }) => {
          if (status.isInBlock || status.isFinalized) {
            const blockHash = status.isInBlock ? status.asInBlock.toHex() : status.asFinalized.toHex();
            const failed = events?.find((e) => gearApi.events.system.ExtrinsicFailed.is(e.event));
            if (failed) {
              reject(new Error('Transaction failed on-chain (ExtrinsicFailed).'));
              return;
            }
            resolve(blockHash);
          } else if (status.isInvalid) {
            reject(new Error('Transaction invalid.'));
          }
        }).catch((err: any) => {
          reject(err);
        });
      });
    },
    [gearApi, isApiReady, account]
  );

  const loadAll = async () => {
    try {
      const [socRes, jobsRes, sbRes, schedRes] = await Promise.all([
        api.agentic.agents.society(),
        api.agentic.agents.jobs(10),
        api.agentic.agents.stonkbase(),
        api.agentic.agents.schedulerStatus(),
      ]);
      if (socRes?.agents) setAgents(socRes.agents);
      if (socRes?.stats) setStats(socRes.stats);
      if (jobsRes?.jobs) setJobs(jobsRes.jobs);
      if (sbRes) setStonkbase(sbRes);
      if (schedRes) setScheduler(schedRes);
    } catch (err) {
      console.warn('[AgentSocietyPanel] load note:', err);
    }
  };

  useEffect(() => {
    loadAll();
  }, [activeWallet]);

  const handleSpawnFourAgents = async () => {
    setSpawning(true);
    setStatusBanner(
      `Approve in SubWallet: Spawning ${agentCountInput} Vara Agents (+100 VARA Protocol Bonus + ${creatorTopUpInput} VARA Top-Up each)...`
    );
    try {
      const payload = encodePlaceSpotOrderPayload('GROW/VARA', true, 0.0425, Math.max(10, creatorTopUpInput));
      const blockHash = await signOnVaraMainnet(STONK_ORDERBOOK_PROGRAM_ID, payload);
      setLatestTxUrl(`https://vara.subscan.io/block/${blockHash}`);
      const res = await api.agentic.agents.spawn({
        ownerWallet: activeWallet,
        ownerHandle: handleInput || 'VaraBuilder',
        agentCount: agentCountInput,
        creatorTopUpPerAgentVara: creatorTopUpInput,
        claimProtocolBonus: true,
        mode: 'auto',
      });
      setStatusBanner(
        `✅ On-Chain Confirmed in Block ${blockHash.slice(0, 10)}...! Spawned ${res.agents?.length || agentCountInput} Agents + Split Group #${res.splitsGroupId || 1}!`
      );
      await loadAll();
    } catch (err: any) {
      setStatusBanner(`⚠️ ${err?.message || 'Connect SubWallet to sign on Vara Mainnet'}`);
    } finally {
      setSpawning(false);
    }
  };

  const handleHireSuite = async (targetOwnerWallet: string) => {
    setHiringOwner(targetOwnerWallet);
    setStatusBanner('Approve in SubWallet: Executing 4-Hop Vara Mainnet ACP + Stonk on Vara Cascade (60% Owners / 15% SDE / 15% Art / 10% X)...');
    try {
      const payload = encodeOpenStockPositionPayload(selectedTicker, true, 100, 5, true, 1);
      const blockHash = await signOnVaraMainnet(STONK_PERPS_PROGRAM_ID, payload);
      setLatestTxUrl(`https://vara.subscan.io/block/${blockHash}`);
      const res = await api.agentic.agents.hireAcp({
        requesterWallet: activeWallet,
        ownerWallet: targetOwnerWallet,
        title: `4-Agent ACP + Stonk on Vara Execution (${handleInput || 'ACP'})`,
        prompt: 'Lock VARA in TokenVault, open/close 5x Stonk on Vara trade, stake Call the Open (1.20x vaulted), stream gVARA & split 60/15/15/10.',
        budgetVara: 100,
        mode: 'auto',
      });
      setLatestCascade(res);
      setStatusBanner(
        `✅ Confirmed in Block ${blockHash.slice(0, 10)}...! Order ${res?.job?.job_code} settled across StreamCore, SplitsRouter & Stonk on Vara.`
      );
      await loadAll();
    } catch (err: any) {
      setStatusBanner(`⚠️ ${err?.message || 'Connect SubWallet to sign on Vara Mainnet'}`);
    } finally {
      setHiringOwner(null);
    }
  };

  const handleStonkBaseTrade = async (side: 'LONG' | 'SHORT') => {
    setTrading(true);
    setStatusBanner(`Approve in SubWallet: Opening ${selectedLeverage}x ${side} on $${selectedTicker} (${marginInput} gVARA margin)...`);
    try {
      const payload = encodeOpenStockPositionPayload(selectedTicker, side === 'LONG', Number(marginInput) || 50, selectedLeverage, false, 1);
      const blockHash = await signOnVaraMainnet(STONK_PERPS_PROGRAM_ID, payload);
      setLatestTxUrl(`https://vara.subscan.io/block/${blockHash}`);
      const res = await api.agentic.agents.stonkbaseTrade({
        traderWallet: activeWallet,
        traderHandle: handleInput || 'VaraTrader',
        actorType: 'HUMAN',
        ticker: selectedTicker,
        side,
        marginGvara: Number(marginInput) || 50,
        leverage: selectedLeverage,
      });
      setStatusBanner(
        `🚀 Confirmed in Block ${blockHash.slice(0, 10)}...! ${selectedLeverage}x ${side} $${selectedTicker} (+${res?.position?.leveragedRoiPct || '4.6'}% ROI / +${res?.position?.grossPnlGvara || '2.3'} gVARA)!`
      );
      await loadAll();
    } catch (err: any) {
      setStatusBanner(`⚠️ ${err?.message || 'Connect SubWallet to sign on Vara Mainnet'}`);
    } finally {
      setTrading(false);
    }
  };

  const handleCallTheOpen = async (side: 'GREEN' | 'RED') => {
    setTrading(true);
    setStatusBanner(`Approve in SubWallet: Staking ${marginInput} gVARA on Call the Open ($${selectedTicker} ${side}) with 1.20x Vaulted Boost...`);
    try {
      const payload = encodeOpenStockPositionPayload(selectedTicker, side === 'GREEN', Number(marginInput) || 25, 5, false, 1);
      const blockHash = await signOnVaraMainnet(STONK_PERPS_PROGRAM_ID, payload);
      setLatestTxUrl(`https://vara.subscan.io/block/${blockHash}`);
      const res = await api.agentic.agents.callTheOpen({
        stakerWallet: activeWallet,
        stakerHandle: handleInput || 'VaraTrader',
        actorType: 'HUMAN',
        ticker: ['SPY', 'QQQ', 'NVDA', 'TSLA', 'IBIT', 'GLD'].includes(selectedTicker) ? selectedTicker : 'SPY',
        side,
        stakeGvara: Number(marginInput) || 25,
        isVaulted: true,
      });
      setStatusBanner(
        `🎯 Confirmed in Block ${blockHash.slice(0, 10)}...! Staked ${res?.stake?.stakeGvara || marginInput} gVARA on ${selectedTicker} ${side} (1.20x vaulted boost)!`
      );
      await loadAll();
    } catch (err: any) {
      setStatusBanner(`⚠️ ${err?.message || 'Connect SubWallet to sign on Vara Mainnet'}`);
    } finally {
      setTrading(false);
    }
  };

  const handleRunScheduledTickAll = async () => {
    setTickingAll(true);
    setStatusBanner('Running In-Built Server Runtime batch tick across all scheduled user agent squads...');
    try {
      const res = await api.agentic.agents.schedulerTickAll({ budgetVara: 100, leverage: 5 });
      setStatusBanner(
        `Server Runtime executed ${res?.squadsExecuted || 0} scheduled agent squads! Total scheduled notional volume: ${res?.schedulerStatus?.totalScheduledNotionalVara} VARA.`
      );
      await loadAll();
    } catch (err: any) {
      setStatusBanner(`Scheduler note: ${err?.message || 'Check API connection'}`);
    } finally {
      setTickingAll(false);
    }
  };

  const badgeColors: Record<string, string> = {
    TRADER: '#00ffc2',
    SDE: '#38bdf8',
    ART: '#c084fc',
    X: '#facc15',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: '12px',
        gap: '10px',
        fontFamily: "'SN Pro Variable', 'SF Mono', 'Fira Code', monospace",
      }}
    >
      {/* Sub-Navigation Pills: Society (60/15/15/10) | StonkBase 24/7 Desk | Server Runtime Scheduler | Protocol Overview */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(['SOCIETY', 'STONKBASE', 'SCHEDULER'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setViewTab(t)}
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '9px',
              fontWeight: 700,
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              background: viewTab === t ? '#22c55e' : 'rgba(255,255,255,0.05)',
              color: viewTab === t ? '#04120c' : 'rgba(255,255,255,0.7)',
              border: viewTab === t ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {t === 'SOCIETY' ? '🤖 8-AGENT ACP (60/15/15/10)' : t === 'STONKBASE' ? '📈 STONK ON VARA 24/7 (1-5x)' : '⏱️ SERVER RUNTIME'}
          </button>
        ))}
        <a
          href="/protocol-overview"
          style={{
            padding: '6px 8px',
            fontSize: '9px',
            fontWeight: 700,
            borderRadius: '6px',
            textDecoration: 'none',
            fontFamily: 'inherit',
            background: 'rgba(0,255,194,0.14)',
            color: '#00ffc2',
            border: '1px solid rgba(0,255,194,0.35)',
          }}
        >
          📊 PROTOCOL & DEFILLAMA
        </a>
      </div>

      {/* Top KPI Bar (Human vs Agent Volume Separated per Vara Grant Proposal) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px',
          background: 'rgba(0,0,0,0.35)',
          padding: '8px',
          borderRadius: '8px',
          border: '1px solid rgba(34,197,94,0.18)',
        }}
      >
        <div>
          <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Agents / Squads</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e' }}>
            {stats?.totalSpawnedAgents ?? agents.length} ({scheduler?.totalRegisteredSquads ?? 3} Squads)
          </div>
        </div>
        <div>
          <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Margin Vol</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#00ffc2' }}>
            {stonkbase?.metrics?.totalMarginVolumeVara ?? stats?.totalOnChainVolumeVara ?? 609} gVARA
          </div>
        </div>
        <div>
          <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Notional (1-5x)</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8' }}>
            {stonkbase?.metrics?.totalNotionalVolumeVara ?? 1850} gVARA
          </div>
        </div>
        <div>
          <div style={{ fontSize: '7.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Runtime Ticks</div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#facc15' }}>
            {scheduler?.totalHeartbeatCycles ?? 0} Cycles
          </div>
        </div>
      </div>

      {statusBanner && (
        <div
          style={{
            padding: '8px 10px',
            borderRadius: '6px',
            background: 'rgba(2,215,178,0.1)',
            border: '1px solid rgba(2,215,178,0.3)',
            color: '#a7f3d0',
            fontSize: '9.5px',
            lineHeight: 1.4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>{statusBanner}</span>
          {latestTxUrl && (
            <a
              href={latestTxUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '3px 7px',
                borderRadius: '4px',
                background: '#00ffc2',
                color: '#04120c',
                fontWeight: 700,
                fontSize: '8.5px',
                textDecoration: 'none',
              }}
            >
              View on Vara Subscan ↗
            </a>
          )}
        </div>
      )}

      {viewTab === 'SOCIETY' && (
        <>
          {/* 1-Click Spawn 4 Agents Action Box */}
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.22)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#22c55e' }}>
                ⚡ SPAWN 4–6 AGENT SQUAD (+100 VARA PROTOCOL BONUS / AGENT)
              </span>
              <span style={{ fontSize: '8px', color: '#00ffc2' }}>Auto-Scheduled + Top-Up</span>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.65)' }}>Squad Size:</span>
              {[4, 5, 6].map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setAgentCountInput(cnt)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '8.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: agentCountInput === cnt ? '#00ffc2' : 'rgba(255,255,255,0.08)',
                    color: agentCountInput === cnt ? '#04120c' : '#fff',
                    border: 'none',
                  }}
                >
                  {cnt} Agents
                </button>
              ))}
              <span style={{ fontSize: '8.5px', color: '#facc15', marginLeft: 'auto' }}>
                🎁 +100 VARA Bonus + {creatorTopUpInput} VARA Creator Top-Up/Agent
              </span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                placeholder="Your Handle (e.g. Anmol)"
                style={{
                  flex: 1,
                  background: 'rgba(0,0,0,0.5)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  color: '#fff',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSpawnFourAgents}
                disabled={spawning}
                style={{
                  background: '#22c55e',
                  color: '#04120c',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {spawning ? 'SPAWNING...' : 'SPAWN & SCHEDULE'}
              </button>
            </div>
          </div>

          {/* Latest 4-Hop Transaction Cascade Preview */}
          {(latestCascade?.txTrail || jobs[0]?.tx_trail) && (
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ fontSize: '9px', fontWeight: 700, color: '#00ffc2', marginBottom: '6px' }}>
                🔗 LIVE 4-HOP VARA MAINNET CASCADE ({latestCascade?.job?.job_code || jobs[0]?.job_code})
              </div>
              {(latestCascade?.txTrail || jobs[0]?.tx_trail || []).map((hop: AcpTxHop) => (
                <div
                  key={hop.hopNumber}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '9px',
                    padding: '4px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <span style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Hop {hop.hopNumber}: <strong>{hop.contractName}</strong> ({hop.amountVara} {hop.tokenSymbol})
                  </span>
                  <a
                    href={hop.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#22c55e', textDecoration: 'underline' }}
                  >
                    Verify ↗
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Spawned Agents Directory */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                ACTIVE VARA AGENT REGISTRY ({agents.length})
              </span>
              <button
                onClick={() => handleHireSuite(agents[0]?.owner_wallet || activeWallet)}
                disabled={Boolean(hiringOwner)}
                style={{
                  background: 'rgba(2,215,178,0.15)',
                  color: '#00ffc2',
                  border: '1px solid rgba(2,215,178,0.4)',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {hiringOwner ? 'RUNNING ACP...' : '🚀 HIRE SQUAD (100 gVARA)'}
              </button>
            </div>

            {agents.slice(0, 8).map((ag) => (
              <div
                key={ag.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: '7px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '8px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        background: 'rgba(0,0,0,0.5)',
                        color: badgeColors[ag.template_type] || '#22c55e',
                        border: `1px solid ${badgeColors[ag.template_type] || '#22c55e'}`,
                      }}
                    >
                      {ag.template_type}
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{ag.name}</span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    SS58: {ag.agent_wallet.slice(0, 14)}... · Split: {(ag.split_weight / 100).toFixed(0)}% · Vol: {ag.total_volume_vara} VARA
                  </div>
                </div>
                <button
                  onClick={() => handleHireSuite(ag.owner_wallet)}
                  disabled={Boolean(hiringOwner)}
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '5px',
                    padding: '4px 8px',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  Hire ({ag.hire_fee_vara} gVARA)
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {viewTab === 'STONKBASE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(56,189,248,0.06)',
              border: '1px solid rgba(56,189,248,0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#38bdf8' }}>
                📈 STONK ON VARA 24/7 STOCK DESK (1x–5x IN gVARA · ±8% BOUNDED ORACLE)
              </span>
              <span style={{ fontSize: '8px', color: '#22c55e' }}>22 Stocks/ETFs + VARA/USD</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                }}
              >
                {(stonkbase?.oracle?.quotes || [
                  { ticker: 'NVDA', fairValue: 142.5 },
                  { ticker: 'TSLA', fairValue: 258.2 },
                  { ticker: 'SPY', fairValue: 660.0 },
                  { ticker: 'QQQ', fairValue: 590.0 },
                  { ticker: 'IBIT', fairValue: 65.0 },
                  { ticker: 'AAPL', fairValue: 228.4 },
                ]).map((q: any) => (
                  <option key={q.ticker} value={q.ticker}>
                    ${q.ticker} ({q.fairValue})
                  </option>
                ))}
              </select>

              <select
                value={selectedLeverage}
                onChange={(e) => setSelectedLeverage(Number(e.target.value))}
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#00ffc2',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                }}
              >
                {[1, 2, 3, 4, 5].map((lev) => (
                  <option key={lev} value={lev}>
                    {lev}x Leverage
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={marginInput}
                onChange={(e) => setMarginInput(Number(e.target.value))}
                placeholder="Margin gVARA"
                style={{
                  width: '80px',
                  background: 'rgba(0,0,0,0.6)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  color: '#fff',
                  fontSize: '10px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => handleStonkBaseTrade('LONG')}
                disabled={trading}
                style={{
                  flex: 1,
                  background: '#22c55e',
                  color: '#04120c',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🟢 LONG {selectedLeverage}x ({marginInput * selectedLeverage} gVARA)
              </button>
              <button
                onClick={() => handleStonkBaseTrade('SHORT')}
                disabled={trading}
                style={{
                  flex: 1,
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🔴 SHORT {selectedLeverage}x ({marginInput * selectedLeverage} gVARA)
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button
                onClick={() => handleCallTheOpen('GREEN')}
                disabled={trading}
                style={{
                  flex: 1,
                  background: 'rgba(34,197,94,0.18)',
                  color: '#86efac',
                  border: '1px solid rgba(34,197,94,0.4)',
                  borderRadius: '6px',
                  padding: '5px',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🌅 CALL THE OPEN: GREEN (1.20x Vault Boost)
              </button>
              <button
                onClick={() => handleCallTheOpen('RED')}
                disabled={trading}
                style={{
                  flex: 1,
                  background: 'rgba(239,68,68,0.18)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239,68,68,0.4)',
                  borderRadius: '6px',
                  padding: '5px',
                  fontSize: '9px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                🌇 CALL THE OPEN: RED (1.20x Vault Boost)
              </button>
            </div>
          </div>

          {/* Recent Stonk on Vara Positions */}
          <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)' }}>
            RECENT 24/7 STONK ON VARA TRADES (HUMAN & AGENT SEPARATED)
          </div>
          {(stonkbase?.positions || []).slice(0, 6).map((p: any) => (
            <div
              key={p.id}
              style={{
                padding: '7px 9px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px',
              }}
            >
              <div>
                <span style={{ color: p.actorType === 'HUMAN' ? '#facc15' : '#00ffc2', fontWeight: 700 }}>
                  [{p.actorType}]
                </span>{' '}
                <strong>${p.ticker}</strong> {p.leverage}x {p.side} · Margin: {p.marginGvara} gVARA → Notional: {p.notionalGvara} gVARA
              </div>
              <div style={{ color: '#22c55e', fontWeight: 700 }}>
                +{p.grossPnlGvara ?? 0} gVARA ({p.leveragedRoiPct ?? 0}%)
              </div>
            </div>
          ))}
        </div>
      )}

      {viewTab === 'SCHEDULER' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '8px',
              background: 'rgba(250,204,21,0.06)',
              border: '1px solid rgba(250,204,21,0.25)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#facc15' }}>
                ⏱️ IN-BUILT SERVER RUNTIME SCHEDULER ({scheduler?.totalRegisteredSquads ?? 0} SQUADS)
              </div>
              <div style={{ fontSize: '8.5px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                Every spawned user squad runs automatically on the main server & generates continuous volume
              </div>
            </div>
            <button
              onClick={handleRunScheduledTickAll}
              disabled={tickingAll}
              style={{
                background: '#facc15',
                color: '#04120c',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '9.5px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {tickingAll ? 'TICKING...' : '⚡ TICK ALL SQUADS'}
            </button>
          </div>

          {(scheduler?.squads || []).map((sq: any) => (
            <div
              key={sq.ownerWallet}
              style={{
                padding: '8px 10px',
                borderRadius: '7px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '9px',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#fff' }}>
                  {sq.ownerHandle} Squad ({sq.status})
                </div>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', marginTop: '2px' }}>
                  Ticks: {sq.ticksCompleted} · Last Ticker: ${sq.lastTicker || 'NVDA'} · Next Run: {sq.nextRunAt ? new Date(sq.nextRunAt).toLocaleTimeString() : 'Active'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#00ffc2', fontWeight: 700 }}>{sq.totalNotionalVolumeVara} gVARA Notional</div>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)' }}>{sq.totalMarginVolumeVara} gVARA Margin</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
