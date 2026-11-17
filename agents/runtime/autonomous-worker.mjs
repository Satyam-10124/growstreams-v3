import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { listSocietyAgents, getSocietyStats } from './store.mjs';
import { executeAcpJobCascade } from './acp-orchestrator.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEDULER_STATE_FILE = path.resolve(__dirname, '.scheduler-state.json');

let masterTimer = null;
let schedulerRunning = false;

const DEFAULT_TICKERS = [
  'NVDA', 'TSLA', 'SPY', 'QQQ', 'IBIT', 'AAPL', 'MSFT', 'GLD',
  'GOOGL', 'AMZN', 'META', 'AVGO', 'AMD', 'NFLX', 'SLV', 'SMH',
];

function loadSchedulerState() {
  try {
    if (fs.existsSync(SCHEDULER_STATE_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SCHEDULER_STATE_FILE, 'utf-8'));
      if (parsed && typeof parsed === 'object' && parsed.squads) {
        return parsed;
      }
    }
  } catch {}
  return {
    startedAt: new Date().toISOString(),
    totalHeartbeatCycles: 0,
    squads: {},
    recentRuns: [],
  };
}

function saveSchedulerState(state) {
  try {
    fs.writeFileSync(SCHEDULER_STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.warn('[agents/scheduler] Failed to save scheduler state:', err.message);
  }
}

/**
 * Automatically registers a user's 4-Agent Squad into the In-Built Server Runtime Scheduler
 * whenever a user spawns their agents.
 */
export function registerSquadInScheduler({
  ownerWallet,
  ownerHandle = null,
  intervalSeconds = 180, // Runs every 3 minutes on server runtime (or on Delayed Message tick)
  budgetPerTickVara = 100,
  leverage = 5,
  agents = [],
}) {
  if (!ownerWallet) return null;
  const state = loadSchedulerState();
  const now = Date.now();
  const existing = state.squads[ownerWallet] || {
    ownerWallet,
    ownerHandle: ownerHandle || `${ownerWallet.slice(0, 8)}...`,
    registeredAt: new Date(now).toISOString(),
    ticksCompleted: 0,
    totalMarginVolumeVara: 0,
    totalNotionalVolumeVara: 0,
    totalExtrinsics: 0,
    lastRunAt: null,
    lastJobCode: null,
    lastTicker: null,
  };

  const updated = {
    ...existing,
    ownerHandle: ownerHandle || existing.ownerHandle,
    intervalSeconds: Number(intervalSeconds) || 180,
    budgetPerTickVara: Number(budgetPerTickVara) || 100,
    leverage: Math.max(1, Math.min(5, Number(leverage) || 5)),
    agentNames: agents.length > 0 ? agents.map((a) => a.name) : existing.agentNames || [],
    status: 'SCHEDULED_ACTIVE',
    nextRunAt: new Date(now + (Number(intervalSeconds) || 180) * 1000).toISOString(),
  };

  state.squads[ownerWallet] = updated;
  saveSchedulerState(state);

  // Ensure the background server loop is running whenever at least one squad is registered
  startAutonomousAgentWorker();

  return updated;
}

/**
 * Syncs all existing user agent squads from the store into the server scheduler on startup.
 */
export async function syncAllSquadsIntoScheduler() {
  const allAgents = await listSocietyAgents();
  const byOwner = new Map();
  for (const agent of allAgents) {
    if (!byOwner.has(agent.owner_wallet)) {
      byOwner.set(agent.owner_wallet, []);
    }
    byOwner.get(agent.owner_wallet).push(agent);
  }

  for (const [ownerWallet, suite] of byOwner.entries()) {
    registerSquadInScheduler({
      ownerWallet,
      ownerHandle: suite[0]?.owner_handle || null,
      agents: suite,
    });
  }
  return getSchedulerStatus();
}

/**
 * Executes a single autonomous runtime tick for a specific user squad (or the next due squad).
 */
export async function runAutonomousHeartbeatTick({
  ownerWallet = null,
  triggerSource = 'autonomous_heartbeat',
  mode = 'payload',
  budgetVara = null,
  leverage = 5,
} = {}) {
  await syncAllSquadsIntoScheduler();
  const state = loadSchedulerState();
  const squadList = Object.values(state.squads);

  if (squadList.length === 0) {
    return { ticked: false, reason: 'No active agent squads registered in server scheduler' };
  }

  // Pick requested ownerWallet or the squad with the earliest nextRunAt / fewest ticks
  let targetSquad = ownerWallet ? state.squads[ownerWallet] : null;
  if (!targetSquad) {
    squadList.sort((a, b) => (a.ticksCompleted || 0) - (b.ticksCompleted || 0));
    targetSquad = squadList[0];
  }

  const tickIndex = (targetSquad.ticksCompleted || 0) + 1;
  const ticker = DEFAULT_TICKERS[Math.floor(Math.random() * DEFAULT_TICKERS.length)];
  const baseBudget = Number(budgetVara || targetSquad.budgetPerTickVara || 85);
  const orderBudget = Number((baseBudget * (0.65 + Math.random() * 0.75)).toFixed(2));
  const randomLev = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)];
  const tradeLeverage = Math.max(1, Math.min(5, Number(leverage || targetSquad.leverage || randomLev)));

  const cascade = await executeAcpJobCascade({
    requesterWallet: targetSquad.ownerWallet,
    ownerWallet: targetSquad.ownerWallet,
    title: `Scheduled Server Runtime Tick #${tickIndex} (${targetSquad.ownerHandle} Squad · $${ticker} ${tradeLeverage}x)`,
    prompt: `Autonomous server runtime (${triggerSource}): lock VARA in TokenVault, open/close ${tradeLeverage}x $${ticker} position on StonkBase 24/7 Desk, stake in Call the Open (1.20x vaulted weight), and split profits 60/15/15/10 via SplitsRouter.`,
    budgetVara: orderBudget,
    durationSeconds: 3600,
    mode,
  });

  const traderMetrics = cascade.deliverables?.trader?.metrics || {};
  const marginVol = Number(traderMetrics.cycleMarginVolumeVara || orderBudget * 1.2);
  const notionalVol = Number(traderMetrics.cycleNotionalVolumeVara || cascade.job.total_onchain_volume_vara || orderBudget * 4.2);

  const now = Date.now();
  targetSquad.ticksCompleted = tickIndex;
  targetSquad.totalMarginVolumeVara = Number(((targetSquad.totalMarginVolumeVara || 0) + marginVol).toFixed(4));
  targetSquad.totalNotionalVolumeVara = Number(((targetSquad.totalNotionalVolumeVara || 0) + notionalVol).toFixed(4));
  targetSquad.totalExtrinsics = (targetSquad.totalExtrinsics || 0) + 6;
  const jitteredIntervalSec = Math.round((targetSquad.intervalSeconds || 180) * (0.7 + Math.random() * 0.65));
  targetSquad.lastRunAt = new Date(now).toISOString();
  targetSquad.nextRunAt = new Date(now + jitteredIntervalSec * 1000).toISOString();
  targetSquad.lastJobCode = cascade.job.job_code;
  targetSquad.lastTicker = ticker;
  targetSquad.status = 'SCHEDULED_ACTIVE';

  state.squads[targetSquad.ownerWallet] = targetSquad;
  state.totalHeartbeatCycles = (state.totalHeartbeatCycles || 0) + 1;
  state.recentRuns.unshift({
    jobCode: cascade.job.job_code,
    ownerWallet: targetSquad.ownerWallet,
    ownerHandle: targetSquad.ownerHandle,
    ticker,
    leverage: tradeLeverage,
    marginVolumeVara: marginVol,
    notionalVolumeVara: notionalVol,
    triggerSource,
    executedAt: targetSquad.lastRunAt,
  });
  state.recentRuns = state.recentRuns.slice(0, 50);
  saveSchedulerState(state);

  const stats = await getSocietyStats();

  return {
    ticked: true,
    triggerSource,
    ownerWallet: targetSquad.ownerWallet,
    ownerHandle: targetSquad.ownerHandle,
    leadAgent: `${targetSquad.ownerHandle}_Trader_Agent`,
    ticker,
    leverage: tradeLeverage,
    jobCode: cascade.job.job_code,
    marginVolumeGeneratedVara: marginVol,
    volumeGeneratedVara: notionalVol,
    txTrail: cascade.txTrail,
    societyStats: stats,
    schedulerStatus: getSchedulerStatus(),
    timestamp: new Date(now).toISOString(),
  };
}

/**
 * Executes a batch tick across all registered user squads in the server scheduler.
 */
export async function runAllScheduledSquadsTick({
  triggerSource = 'batch_server_runtime',
  mode = 'payload',
  budgetVara = 100,
  leverage = 5,
} = {}) {
  await syncAllSquadsIntoScheduler();
  const state = loadSchedulerState();
  const owners = Object.keys(state.squads);
  const results = [];
  for (const ownerWallet of owners) {
    const res = await runAutonomousHeartbeatTick({
      ownerWallet,
      triggerSource,
      mode,
      budgetVara,
      leverage,
    });
    results.push(res);
  }
  return {
    squadsExecuted: results.length,
    results,
    schedulerStatus: getSchedulerStatus(),
  };
}

export function getSchedulerStatus() {
  const state = loadSchedulerState();
  const squads = Object.values(state.squads);
  const totalScheduledMarginVara = squads.reduce((s, q) => s + Number(q.totalMarginVolumeVara || 0), 0);
  const totalScheduledNotionalVara = squads.reduce((s, q) => s + Number(q.totalNotionalVolumeVara || 0), 0);

  return {
    workerActive: Boolean(schedulerRunning),
    startedAt: state.startedAt,
    totalRegisteredSquads: squads.length,
    totalHeartbeatCycles: state.totalHeartbeatCycles || 0,
    totalScheduledMarginVara: Number(totalScheduledMarginVara.toFixed(4)),
    totalScheduledNotionalVara: Number(totalScheduledNotionalVara.toFixed(4)),
    squads,
    recentRuns: (state.recentRuns || []).slice(0, 15),
  };
}

/**
 * Starts the in-built background server runtime scheduler that automatically wakes due user squads.
 */
export function startAutonomousAgentWorker(checkIntervalMs = 60 * 1000) {
  if (masterTimer) return masterTimer;
  schedulerRunning = true;
  console.log(`[agents/scheduler] In-built Server Runtime Scheduler active (check interval: ${checkIntervalMs / 1000}s)`);

  masterTimer = setInterval(async () => {
    try {
      const state = loadSchedulerState();
      const now = Date.now();
      for (const squad of Object.values(state.squads)) {
        const nextMs = squad.nextRunAt ? new Date(squad.nextRunAt).getTime() : 0;
        if (now >= nextMs) {
          await runAutonomousHeartbeatTick({
            ownerWallet: squad.ownerWallet,
            triggerSource: 'in_built_server_scheduler',
            mode: 'payload',
          });
        }
      }
    } catch (err) {
      console.warn('[agents/scheduler] Background runtime tick warning:', err.message);
    }
  }, checkIntervalMs);

  if (masterTimer.unref) {
    masterTimer.unref(); // Allow clean CLI exit when running scripts/tests
  }
  return masterTimer;
}

export function stopAutonomousAgentWorker() {
  if (masterTimer) {
    clearInterval(masterTimer);
    masterTimer = null;
  }
  schedulerRunning = false;
}
