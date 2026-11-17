import express from 'express';
import {
  listAgentTemplates,
  listSocietyAgents,
  listAcpJobs,
  getSocietyStats,
  spawnUserAgents,
  executeAcpJobCascade,
  runAutonomousHeartbeatTick,
  runAllScheduledSquadsTick,
  getSchedulerStatus,
  getTreasuryBudgetStatus,
  getStonkBaseQuote,
  getStonkBaseBoard,
  openStockDeskPosition,
  closeStockDeskPosition,
  stakeCallTheOpen,
  getStonkBaseDeskSummary,
  PROTOCOL_AGENT_BONUS_VARA,
  topUpAgentWallet,
  batchFundSquadWithProtocolBonus,
  getTopUpStats,
  TREASURY_CONFIG,
  VARA_MAINNET_CONTRACTS,
} from '../../../agents/runtime/index.mjs';
import { getApi, query as sailsQuery } from '../sails-client.mjs';

const router = express.Router();

// GET /api/agents/budget — Live Vara Mainnet Treasury balance & 20% Budget Guard status
router.get('/budget', async (_req, res) => {
  try {
    const api = getApi();
    let gvaraRaw = null;
    try {
      gvaraRaw = await sailsQuery('gvaraToken', 'BalanceOf', TREASURY_CONFIG.actorIdHex);
    } catch {}
    const budget = await getTreasuryBudgetStatus(api, gvaraRaw);
    res.json(budget);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/templates — List the 4 Vara Agent Templates (60/15/15/10 splits) & 12 Mainnet contracts
router.get('/templates', async (_req, res) => {
  try {
    const templates = listAgentTemplates();
    res.json({
      templates,
      varaMainnetContracts: VARA_MAINNET_CONTRACTS,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/stats — High-level KPI metrics for Vara Grant & Society Dashboard (Human vs Agent separated)
router.get('/stats', async (_req, res) => {
  try {
    const stats = await getSocietyStats();
    const stonkbase = getStonkBaseDeskSummary();
    const scheduler = getSchedulerStatus();
    res.json({
      ...stats,
      stonkbaseMetrics: stonkbase.metrics,
      schedulerStatus: {
        workerActive: scheduler.workerActive,
        totalRegisteredSquads: scheduler.totalRegisteredSquads,
        totalHeartbeatCycles: scheduler.totalHeartbeatCycles,
        totalScheduledNotionalVara: scheduler.totalScheduledNotionalVara,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/society?ownerWallet=&templateType= — List spawned agents across the society
router.get('/society', async (req, res) => {
  try {
    const { ownerWallet, templateType } = req.query;
    const agents = await listSocietyAgents({
      ownerWallet: ownerWallet || null,
      templateType: templateType || null,
    });
    const stats = await getSocietyStats();
    const scheduler = getSchedulerStatus();
    res.json({ agents, stats, scheduler });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/spawn — Spawn 4–6 Agents (TRADER, SDE, ART, X, QUANT, LIQUIDATOR), grant 100 VARA Protocol Bonus & auto-schedule
router.post('/spawn', async (req, res) => {
  try {
    const {
      ownerWallet,
      ownerHandle,
      agentCount,
      creatorTopUpPerAgentVara,
      claimProtocolBonus = true,
      mode,
      issueVoucher,
    } = req.body || {};
    if (!ownerWallet) {
      return res.status(400).json({ error: 'ownerWallet is required' });
    }
    const result = await spawnUserAgents({
      ownerWallet,
      ownerHandle: ownerHandle || null,
      agentCount: agentCount ? Number(agentCount) : 4,
      mode: mode || 'auto',
      issueVoucher: issueVoucher !== false,
    });

    let bonusBundle = null;
    if (claimProtocolBonus !== false) {
      bonusBundle = await batchFundSquadWithProtocolBonus({
        ownerWallet,
        ownerHandle: result.ownerHandle,
        agentCount: result.agents.length,
        creatorTopUpPerAgentVara: creatorTopUpPerAgentVara ? Number(creatorTopUpPerAgentVara) : 25,
        protocolBonusPerAgentVara: PROTOCOL_AGENT_BONUS_VARA,
        userWalletTopUpVara: 0,
        executeOnChain: false,
      });
    }

    res.json({
      success: true,
      ...result,
      protocolBonusSummary: bonusBundle,
    });
  } catch (err) {
    console.error('[api/agents/spawn]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/topup/stats — Creator Top-Up & 100 VARA Protocol Bonus ledger stats
router.get('/topup/stats', async (_req, res) => {
  try {
    res.json(getTopUpStats());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/topup — Top up an Agent Wallet or Squad with Creator Top-Up + 100 VARA Protocol Bonus
router.post('/topup', async (req, res) => {
  try {
    const {
      ownerWallet,
      ownerHandle,
      agentWallet,
      templateType,
      creatorTopUpVara,
      includeProtocolBonus = true,
      executeOnChain = false,
    } = req.body || {};

    if (!ownerWallet && !agentWallet) {
      return res.status(400).json({ error: 'ownerWallet or agentWallet is required' });
    }

    if (agentWallet) {
      const record = await topUpAgentWallet({
        ownerWallet: ownerWallet || agentWallet,
        ownerHandle: ownerHandle || 'VaraUser',
        agentWallet,
        templateType: templateType || 'TRADER',
        creatorTopUpVara: creatorTopUpVara ? Number(creatorTopUpVara) : 25,
        includeProtocolBonus: Boolean(includeProtocolBonus),
        executeOnChain: Boolean(executeOnChain),
      });
      return res.json({ success: true, topUp: record, stats: getTopUpStats() });
    }

    const batch = await batchFundSquadWithProtocolBonus({
      ownerWallet,
      ownerHandle: ownerHandle || 'VaraUser',
      agentCount: req.body?.agentCount ? Number(req.body.agentCount) : 5,
      creatorTopUpPerAgentVara: creatorTopUpVara ? Number(creatorTopUpVara) : 25,
      protocolBonusPerAgentVara: includeProtocolBonus ? PROTOCOL_AGENT_BONUS_VARA : 0,
      userWalletTopUpVara: 0,
      executeOnChain: Boolean(executeOnChain),
    });
    res.json({ success: true, batch, stats: getTopUpStats() });
  } catch (err) {
    console.error('[api/agents/topup]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/acp/jobs?ownerWallet=&requesterWallet=&limit= — List ACP multi-agent jobs & tx trails
router.get('/acp/jobs', async (req, res) => {
  try {
    const { ownerWallet, requesterWallet, limit } = req.query;
    const jobs = await listAcpJobs({
      ownerWallet: ownerWallet || null,
      requesterWallet: requesterWallet || null,
      limit: limit ? parseInt(limit, 10) : 25,
    });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/acp/hire — Hire a 4-Agent Suite & execute the 4-Hop Vara Mainnet ACP Cascade
router.post('/acp/hire', async (req, res) => {
  try {
    const {
      requesterWallet,
      ownerWallet,
      title,
      prompt,
      budgetVara,
      durationSeconds,
      mode,
    } = req.body || {};

    if (!requesterWallet) {
      return res.status(400).json({ error: 'requesterWallet is required' });
    }

    const result = await executeAcpJobCascade({
      requesterWallet,
      ownerWallet: ownerWallet || null,
      title,
      prompt,
      budgetVara: budgetVara ? Number(budgetVara) : 100,
      durationSeconds: durationSeconds ? Number(durationSeconds) : 3600,
      mode: mode || 'auto',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[api/agents/acp/hire]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/acp/tick — Trigger an autonomous Delayed-Message / Server Runtime heartbeat cycle
router.post('/acp/tick', async (req, res) => {
  try {
    const { ownerWallet, budgetVara, leverage, mode } = req.body || {};
    const result = await runAutonomousHeartbeatTick({
      ownerWallet: ownerWallet || null,
      triggerSource: 'manual_api_tick',
      budgetVara: budgetVara ? Number(budgetVara) : 100,
      leverage: leverage ? Number(leverage) : 5,
      mode: mode || 'payload',
    });
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[api/agents/acp/tick]', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// In-Built Server Runtime Scheduler Endpoints
// ============================================================================

// GET /api/agents/scheduler/status — Inspect all user squads scheduled on the main server runtime
router.get('/scheduler/status', async (_req, res) => {
  try {
    res.json(getSchedulerStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/scheduler/tick-all — Run an immediate batch cycle across all scheduled user squads
router.post('/scheduler/tick-all', async (req, res) => {
  try {
    const { budgetVara, leverage, mode } = req.body || {};
    const result = await runAllScheduledSquadsTick({
      triggerSource: 'api_batch_runtime_tick',
      budgetVara: budgetVara ? Number(budgetVara) : 100,
      leverage: leverage ? Number(leverage) : 5,
      mode: mode || 'payload',
    });
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// StonkBase × Nightshift 24/7 Markets (Oracle, 1x–5x Stock Desk & Call the Open)
// ============================================================================

// GET /api/agents/stonkbase — Full StonkBase 24/7 Oracle, 1x–5x Stock Desk, Call the Open & Leaderboard
router.get('/stonkbase', async (_req, res) => {
  try {
    res.json(getStonkBaseDeskSummary());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/agents/stonkbase/oracle/:ticker — 5-Signal Nightshift Bounded Fair Value Quote (±8% cap)
router.get('/stonkbase/oracle/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;
    res.json(getStonkBaseQuote(ticker));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/stonkbase/trade — Open (and optionally close) a 1x–5x Long/Short position in gVARA
router.post('/stonkbase/trade', async (req, res) => {
  try {
    const {
      traderWallet,
      traderHandle,
      actorType,
      ticker,
      side,
      marginGvara,
      leverage,
      autoCloseProfitable,
      executeOnChain,
    } = req.body || {};

    if (!traderWallet) {
      return res.status(400).json({ error: 'traderWallet is required' });
    }

    const result = await openStockDeskPosition({
      traderWallet,
      traderHandle: traderHandle || null,
      actorType: actorType || 'HUMAN',
      ticker: ticker || 'NVDA',
      side: side || 'LONG',
      marginGvara: marginGvara ? Number(marginGvara) : 25,
      leverage: leverage ? Number(leverage) : 5,
      autoCloseProfitable: autoCloseProfitable !== false,
      executeOnChain: Boolean(executeOnChain),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[api/agents/stonkbase/trade]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/agents/stonkbase/call-the-open — Stake gVARA on GREEN (Higher) or RED (Lower) with 1.20x vaulted weight
router.post('/stonkbase/call-the-open', async (req, res) => {
  try {
    const {
      stakerWallet,
      stakerHandle,
      actorType,
      ticker,
      side,
      stakeGvara,
      isVaulted,
      autoSettlePreview,
    } = req.body || {};

    if (!stakerWallet) {
      return res.status(400).json({ error: 'stakerWallet is required' });
    }

    const result = await stakeCallTheOpen({
      stakerWallet,
      stakerHandle: stakerHandle || null,
      actorType: actorType || 'HUMAN',
      ticker: ticker || 'SPY',
      side: side || 'GREEN',
      stakeGvara: stakeGvara ? Number(stakeGvara) : 20,
      isVaulted: isVaulted !== false,
      autoSettlePreview: Boolean(autoSettlePreview),
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('[api/agents/stonkbase/call-the-open]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
