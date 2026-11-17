import test from 'node:test';
import assert from 'node:assert/strict';
import {
  listAgentTemplates,
  deriveFourAgentSuite,
  spawnUserAgents,
  executeAcpJobCascade,
  getSocietyStats,
  getStonkBaseBoard,
  openStockDeskPosition,
  stakeCallTheOpen,
  getSchedulerStatus,
  stopAutonomousAgentWorker,
} from '../runtime/index.mjs';

test('GrowStreams 4-Agent Society Templates (60/15/15/10 Splits) & Deterministic Vara Wallet Factory', async () => {
  const templates = listAgentTemplates();
  assert.equal(templates.length, 4);
  assert.deepEqual(
    templates.map((t) => t.templateType),
    ['TRADER', 'SDE', 'ART', 'X']
  );
  // Verify exact Vara Grant Proposal Page 5 split weights: 60% / 15% / 15% / 10%
  assert.deepEqual(
    templates.map((t) => t.splitWeight),
    [6000, 1500, 1500, 1000]
  );

  const testOwner = 'kGkLork3scX9s5s6va1234567890anmolTestOwner';
  const suite = await deriveFourAgentSuite(testOwner, 'Anmol');
  assert.equal(suite.length, 4);
  for (const agent of suite) {
    assert.ok(agent.agent_actor_id.startsWith('0x'));
    assert.equal(agent.agent_actor_id.length, 66);
    assert.ok(agent.agent_wallet.length > 20);
  }
});

test('Spawn 4 Agents, Auto-Schedule on Server Runtime & Execute 4-Hop Vara ACP Job Cascade', async () => {
  const ownerWallet = 'kGkLork3scX9s5s6va1234567890anmolVaraMainnetWallet';
  const requesterWallet = 'kGiaMA7satyamVaraMainnetSocietyFounderWallet0001';

  const spawned = await spawnUserAgents({
    ownerWallet,
    ownerHandle: 'Anmol',
    mode: 'payload',
    issueVoucher: false,
  });

  assert.equal(spawned.agents.length, 4);
  assert.equal(spawned.scheduledRuntime?.status, 'SCHEDULED_ACTIVE');

  const cascade = await executeAcpJobCascade({
    requesterWallet,
    ownerWallet,
    title: 'Test 4-Agent Cascade on Vara',
    prompt: 'Verify TokenVault deposit, StreamCore flow, SplitsRouter distribution, and SDE Sails audit.',
    budgetVara: 50,
    durationSeconds: 3600,
    mode: 'payload',
  });

  assert.ok(cascade.job.job_code.startsWith('ACP-'));
  assert.equal(cascade.txTrail.length, 4);
  assert.ok(cascade.deliverables.trader.metrics.estimatedCycleVolumeVara >= 150);
  assert.ok(cascade.deliverables.sde.qualityScore >= 50);
  assert.ok(cascade.deliverables.art.svgMarkup.includes('<svg'));
  assert.ok(cascade.deliverables.x.tweetText.includes('#Vara'));

  const stats = await getSocietyStats();
  assert.ok(stats.totalSpawnedAgents >= 4);
  assert.ok(stats.totalAcpJobs >= 1);
});

test('StonkBase 24/7 Bounded Oracle (±8%), 1x–5x Stock Desk & Call the Open (1.20x Vaulted Weight)', async () => {
  const board = getStonkBaseBoard();
  assert.equal(board.totalFeeds, 23); // 22 US Stocks/ETFs + VARA/USD
  assert.equal(board.maxMoveBps, 800); // ±8% bounded guardrail

  const trade = await openStockDeskPosition({
    traderWallet: 'kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA',
    traderHandle: 'Anmol',
    actorType: 'HUMAN',
    ticker: 'NVDA',
    side: 'LONG',
    marginGvara: 100,
    leverage: 5,
    autoCloseProfitable: true,
    executeOnChain: false,
  });

  assert.equal(trade.position.status, 'CLOSED');
  assert.equal(trade.position.notionalGvara, 500);
  assert.ok(trade.position.grossPnlGvara > 0);
  assert.equal(trade.splitsBreakdown.weightsLabel, '60% Owners / 15% SDE / 15% Art / 10% X');

  const cto = await stakeCallTheOpen({
    stakerWallet: 'kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA',
    stakerHandle: 'Anmol',
    actorType: 'HUMAN',
    ticker: 'SPY',
    side: 'GREEN',
    stakeGvara: 50,
    isVaulted: true,
    autoSettlePreview: true,
  });

  assert.equal(cto.stake.vaultMultiplier, 1.2);
  assert.ok(cto.settlementPreview.status === 'SETTLED');

  const sched = getSchedulerStatus();
  assert.ok(sched.totalRegisteredSquads >= 1);
  stopAutonomousAgentWorker();
});
