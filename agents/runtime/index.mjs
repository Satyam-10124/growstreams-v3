export {
  VARA_MAINNET_CONTRACTS,
  AGENT_TEMPLATES,
  EXTENDED_AGENT_TEMPLATES,
  listAgentTemplates,
  listExtendedAgentTemplates,
  executeAgentTemplateTask,
} from '../templates/index.mjs';

export {
  toActorIdHex,
  toVaraSs58,
  deriveHumanUserWallet,
  deriveAgentWallet,
  deriveMultiAgentSuite,
  deriveFourAgentSuite,
} from './wallet-factory.mjs';

export {
  PROTOCOL_AGENT_BONUS_VARA,
  topUpAgentWallet,
  batchFundSquadWithProtocolBonus,
  getTopUpStats,
} from './topup-service.mjs';

export {
  ensureAgentSocietySchema,
  upsertSpawnedAgents,
  listSocietyAgents,
  recordAcpJobExecution,
  listAcpJobs,
  getSocietyStats,
} from './store.mjs';

export {
  spawnUserAgents,
  executeAcpJobCascade,
} from './acp-orchestrator.mjs';

export {
  registerSquadInScheduler,
  syncAllSquadsIntoScheduler,
  runAutonomousHeartbeatTick,
  runAllScheduledSquadsTick,
  getSchedulerStatus,
  startAutonomousAgentWorker,
  stopAutonomousAgentWorker,
} from './autonomous-worker.mjs';

export {
  TREASURY_CONFIG,
  getBudgetParameters,
  getTreasuryBudgetStatus,
  assertWithinTreasuryBudget,
} from './treasury-budget-guard.mjs';

export {
  MAX_MOVE_BPS,
  STONKBASE_MARKETS,
  GRANT_SPLIT_WEIGHTS,
  getStonkBaseQuote,
  getStonkBaseBoard,
  openStockDeskPosition,
  closeStockDeskPosition,
  stakeCallTheOpen,
  getStonkBaseDeskSummary,
} from '../stonkbase/index.mjs';
