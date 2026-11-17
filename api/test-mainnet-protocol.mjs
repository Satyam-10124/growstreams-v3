import 'dotenv/config';
import {
  connect,
  disconnect,
  getApi,
  query,
} from './src/sails-client.mjs';
import {
  spawnUserAgents,
  executeAcpJobCascade,
  getSocietyStats,
  getTreasuryBudgetStatus,
  TREASURY_CONFIG,
} from '../agents/runtime/index.mjs';

async function main() {
  console.log('================================================================================');
  console.log('🚀 GROWSTREAMS V3 + SOCIETY OF AI AGENTS — LIVE VARA MAINNET E2E VERIFICATION');
  console.log('================================================================================');

  await connect();
  const api = getApi();

  // 1. Pre-flight Treasury Balance & 20% Budget Guard Check
  const gvaraBeforeRaw = await query('gvaraToken', 'BalanceOf', TREASURY_CONFIG.actorIdHex);
  const budgetBefore = await getTreasuryBudgetStatus(api, gvaraBeforeRaw);
  console.log('\n[1/5] Pre-Flight Treasury Wallet & 20% Budget Telemetry:');
  console.log(JSON.stringify(budgetBefore, null, 2));

  // Pre-test contract counters
  const preStreams = await query('streamCore', 'TotalStreams');
  const preSplits = await query('splitsRouter', 'TotalGroups');
  const prePerms = await query('permissionManager', 'TotalPermissions');
  console.log('\n[2/5] Pre-Test Mainnet Contract Counters:');
  console.log({
    totalStreams: String(preStreams),
    totalSplitGroups: String(preSplits),
    totalPermissions: String(prePerms),
  });

  // 2. Spawn the 4-Agent Suite on Vara Mainnet
  console.log('\n[3/5] Spawning 4-Agent Suite (TRADER, SDE, ART, X) on Vara Mainnet...');
  const spawnResult = await spawnUserAgents({
    ownerWallet: TREASURY_CONFIG.ss58Address,
    ownerHandle: 'Anmol',
    mode: 'on_chain',
    issueVoucher: false, // Keep native VARA strictly for gas within the 0.7098 VARA 20% cap
  });

  console.log('Spawned Agents:', spawnResult.agents.map((a) => ({
    name: a.name,
    template: a.template_type,
    ss58: a.agent_wallet,
    actorId: a.agent_actor_id,
    splitsGroupId: a.splits_group_id,
    permissionTxHash: a.permission_tx_hash,
    identityTxHash: a.identity_tx_hash,
  })));
  console.log('On-Chain SplitsRouter Group ID:', spawnResult.splitsGroupId, 'Tx/Block:', spawnResult.splitsTxHash);

  // 3. Execute Live 4-Hop Agent Commerce Protocol (ACP) Cascade on Vara Mainnet
  console.log('\n[4/5] Executing 4-Hop ACP Cascade on Vara Mainnet...');
  const acpResult = await executeAcpJobCascade({
    requesterWallet: TREASURY_CONFIG.ss58Address,
    ownerWallet: TREASURY_CONFIG.ss58Address,
    title: 'Vara Mainnet Live Protocol Verification & 4-Agent ACP Cascade',
    prompt: 'Stream gVARA via StreamCore to Anmol_Trader_Agent, transfer ACP sub-fee to Anmol_SDE_Agent, audit Sails Delayed Message hook, generate SVG Flex Card, and publish X Agent Diary.',
    budgetVara: 5,
    durationSeconds: 3600,
    mode: 'on_chain',
  });

  console.log('\nACP Job Record:', {
    jobCode: acpResult.job.job_code,
    streamId: acpResult.job.stream_id,
    splitsGroupId: acpResult.job.splits_group_id,
    status: acpResult.job.status,
  });

  console.log('\nOn-Chain Transaction Trail:');
  for (const hop of acpResult.txTrail) {
    console.log(
      `  Hop #${hop.hopNumber} [${hop.hopType}] ${hop.serviceMethod} -> mode=${hop.executionMode} | block/tx=${hop.blockHash || hop.txHash} | url=${hop.explorerUrl}`
    );
  }

  // 4. Post-Test On-Chain State & Treasury 20% Budget Verification
  const postStreams = await query('streamCore', 'TotalStreams');
  const postSplits = await query('splitsRouter', 'TotalGroups');
  const postPerms = await query('permissionManager', 'TotalPermissions');

  const traderActor = spawnResult.agents[0].agent_actor_id;
  const sdeActor = spawnResult.agents[1].agent_actor_id;
  const xActor = spawnResult.agents[3].agent_actor_id;
  const sdeGvaraBal = await query('gvaraToken', 'BalanceOf', sdeActor);
  const xSeedsBal = await query('questSeeds', 'BalanceOf', xActor);
  const hasPerm = await query(
    'permissionManager',
    'HasPermission',
    TREASURY_CONFIG.actorIdHex,
    traderActor,
    'FullAccess'
  );

  const gvaraAfterRaw = await query('gvaraToken', 'BalanceOf', TREASURY_CONFIG.actorIdHex);
  const budgetAfter = await getTreasuryBudgetStatus(api, gvaraAfterRaw);
  const societyStats = await getSocietyStats();

  console.log('\n[5/5] Post-Test Mainnet State & Strict 20% Treasury Budget Audit:');
  console.log({
    totalStreamsBefore: String(preStreams),
    totalStreamsAfter: String(postStreams),
    totalSplitGroupsBefore: String(preSplits),
    totalSplitGroupsAfter: String(postSplits),
    totalPermissionsBefore: String(prePerms),
    totalPermissionsAfter: String(postPerms),
    traderHasFullAccessPermission: hasPerm,
    sdeAgentGvaraBalancePlancks: String(sdeGvaraBal),
    xAgentQuestSeedsBalance: String(xSeedsBal),
  });

  console.log('\nPost-Flight Treasury Budget Status (Confirming >80% Untouched Reserve):');
  console.log(JSON.stringify(budgetAfter, null, 2));

  console.log('\nSociety KPI Stats:');
  console.log(JSON.stringify(societyStats, null, 2));

  await disconnect();
}

main().catch(async (err) => {
  console.error('E2E Verification Error:', err);
  await disconnect();
  process.exit(1);
});
