import { runTraderAgent } from './trader-agent.mjs';
import { runSdeAgent } from './sde-agent.mjs';
import { runArtAgent } from './art-agent.mjs';
import { runXAgent } from './x-agent-runner.mjs';

export const VARA_MAINNET_CONTRACTS = {
  streamCore: '0x8298c2eea5c6bbe55a9cfe72283b5399098fd6a54d9a2a14c2bedba8eea50659',
  tokenVault: '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9',
  splitsRouter: '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45',
  permissionManager: '0x52f4299e964dab5e97c91cdd10e2d6e635b19696ab8389889aabceba3de9e581',
  bountyAdapter: '0x7697bb2e8655e6cd7294389a0289355f48fd5459914d2a735c9966dad548bd4f',
  identityRegistry: '0x6f413156308663798a77507cf0ea6e79bdbf53add3579ccd4317fc320acf7f29',
  growToken: '0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163',
  questSeeds: '0xefbe2c4a66e05cbde419196c1196ff6e790a59b7c0fd601ebc035c3c8dd7466d',
  wvara: '0xf5e9cb1d1e46b0cda6578dd1684b30f281a45dfaa390e4945b7bfc8ab3e27f3d',
  superToken: '0x4a9718de4055470963104a4c08e5154ad0c2c48a699996b59e861de9393bf347',
  gvaraToken: '0x04314af41b7dbac322e3e66920211d2f799719e1cdc3122a99752f72b6ae84ee',
  distributionPool: '0x7aaa5fa39237ad7f63a78d5acd8a0ff080bd034b8e78de5d4756d6fe4fb25b70',
  liquidationManager: '0x411c62d126b3131ace5e94b618b8cbbdbffb5b9cfdd656f2f6da0786f60cb2c3',
};

export const AGENT_TEMPLATES = {
  TRADER: {
    templateType: 'TRADER',
    enumVariant: 'Trader',
    defaultSuffix: 'Trader_Agent',
    roleTitle: 'Autonomous StonkBase 24/7 Stock Desk & Treasury Strategist',
    hireFeeVara: 10,
    splitWeight: 6000, // 60% Owners / Lead Trader share (Vara Grant Proposal Page 5: 60/15/15/10)
    heartbeatIntervalBlocks: 1200, // ~1 hour on Vara (3s blocks)
    skills: [
      'stonkbase-24-7-leveraged-desk',
      'call-the-open-prediction-staking',
      'token-vault-tvl-anchoring',
      'gvara-super-token-streaming',
      'splits-router-revenue-distribution',
      'delayed-message-autonomous-tick',
    ],
    contractsUsed: [
      { name: 'TokenVault', programId: VARA_MAINNET_CONTRACTS.tokenVault, methods: ['DepositNative', 'DepositTokens', 'AllocateToStream'] },
      { name: 'gVARA SuperToken', programId: VARA_MAINNET_CONTRACTS.gvaraToken, methods: ['Upgrade', 'Downgrade', 'Transfer'] },
      { name: 'StreamCore', programId: VARA_MAINNET_CONTRACTS.streamCore, methods: ['CreateStream', 'Deposit', 'Withdraw'] },
      { name: 'SplitsRouter', programId: VARA_MAINNET_CONTRACTS.splitsRouter, methods: ['CreateSplitGroup', 'Distribute'] },
      { name: 'DistributionPool', programId: VARA_MAINNET_CONTRACTS.distributionPool, methods: ['Distribute', 'SetUnits'] },
    ],
    description:
      'Trades 22 US stocks/ETFs + VARA/USD at 1x–5x leverage on StonkBase, stakes in Call the Open (1.20x vaulted weight), locks sticky TVL in TokenVault, and routes profits 60/15/15/10 via SplitsRouter.',
  },
  SDE: {
    templateType: 'SDE',
    enumVariant: 'Sde',
    defaultSuffix: 'SDE_Agent',
    roleTitle: 'Autonomous Vara Sails Architect, Code Auditor & PR Evaluator',
    hireFeeVara: 15,
    splitWeight: 1500, // 15% SDE Agent share (Vara Grant Proposal Page 5: 60/15/15/10)
    heartbeatIntervalBlocks: 1200,
    skills: [
      'sails-architecture',
      'sails-rust-implementer',
      'gear-gas-reservations-and-waitlist',
      'delayed-message-pattern',
      'voucher-and-signless-flows',
      'github-pr-llm-evaluator',
    ],
    contractsUsed: [
      { name: 'IdentityRegistry', programId: VARA_MAINNET_CONTRACTS.identityRegistry, methods: ['CreateBinding', 'UpdateScore'] },
      { name: 'BountyAdapter', programId: VARA_MAINNET_CONTRACTS.bountyAdapter, methods: ['CreateBounty', 'VerifyAndStartStream'] },
      { name: 'PermissionManager', programId: VARA_MAINNET_CONTRACTS.permissionManager, methods: ['GrantPermission', 'HasPermission'] },
      { name: 'StreamCore', programId: VARA_MAINNET_CONTRACTS.streamCore, methods: ['CreateStream'] },
    ],
    description:
      'Powered by gear-foundation/vara-skills. Writes and audits Sails Rust/IDL smart contracts, scores GitHub PRs, binds identities on-chain, and triggers BountyAdapter streams.',
  },
  ART: {
    templateType: 'ART',
    enumVariant: 'Art',
    defaultSuffix: 'Art_Agent',
    roleTitle: 'On-Chain SVG Flex Card, Receipt Badge & Visual Composer',
    hireFeeVara: 5,
    splitWeight: 1500, // 15% Art Agent share (Vara Grant Proposal Page 5: 60/15/15/10)
    heartbeatIntervalBlocks: 2400,
    skills: [
      'svg-pnl-flex-card-generator',
      'agent-passport-badge-minting',
      'onchain-stream-visualizer',
      'campaign-banner-composer',
    ],
    contractsUsed: [
      { name: 'SplitsRouter', programId: VARA_MAINNET_CONTRACTS.splitsRouter, methods: ['PreviewDistribution'] },
      { name: 'IdentityRegistry', programId: VARA_MAINNET_CONTRACTS.identityRegistry, methods: ['GetBinding'] },
    ],
    description:
      'Renders cryptographic SVG Flex Cards, Agent Society Passports, and live Vara Mainnet streaming receipts with embedded Subscan/Gear IDEA verification.',
  },
  X: {
    templateType: 'X',
    enumVariant: 'XMarketing',
    defaultSuffix: 'X_Agent',
    roleTitle: 'Autonomous X/Twitter Agent Diary, Viral Loop & Quest Rewarder',
    hireFeeVara: 5,
    splitWeight: 1000, // 10% X Agent share (Vara Grant Proposal Page 5: 60/15/15/10)
    heartbeatIntervalBlocks: 1200,
    skills: [
      'autonomous-agent-diary-publisher',
      'x-api-v2-viral-thread-composer',
      'subscan-proof-broadcaster',
      'quest-seeds-referral-distributor',
    ],
    contractsUsed: [
      { name: 'QuestSeeds', programId: VARA_MAINNET_CONTRACTS.questSeeds, methods: ['MintSeeds', 'BalanceOf'] },
      { name: 'GrowToken', programId: VARA_MAINNET_CONTRACTS.growToken, methods: ['Transfer', 'Mint'] },
      { name: 'StreamCore', programId: VARA_MAINNET_CONTRACTS.streamCore, methods: ['GetStream'] },
    ],
    description:
      'Publishes daily autonomous Agent Diaries on X with verifiable Vara Mainnet tx links, tracks social engagement velocity, and distributes QuestSeeds & GROW rewards.',
  },
};

export function listAgentTemplates() {
  return Object.values(AGENT_TEMPLATES);
}

export const EXTENDED_AGENT_TEMPLATES = {
  ...AGENT_TEMPLATES,
  QUANT: {
    templateType: 'QUANT',
    enumVariant: 'Trader',
    defaultSuffix: 'Quant_Agent',
    roleTitle: 'Autonomous Oracle Arbitrage, Call-the-Open Strategist & Vault Yield Optimizer',
    hireFeeVara: 12,
    splitWeight: 1000,
    heartbeatIntervalBlocks: 1200,
    skills: [
      'nightshift-5-signal-oracle-arbitrage',
      'call-the-open-1.20x-vaulted-parimutuel',
      'cross-squad-acp-liquidity-routing',
      'gvara-wrap-unwrap-velocity',
    ],
    contractsUsed: [
      { name: 'TokenVault', programId: VARA_MAINNET_CONTRACTS.tokenVault, methods: ['DepositNative', 'WithdrawNative'] },
      { name: 'gVARA SuperToken', programId: VARA_MAINNET_CONTRACTS.gvaraToken, methods: ['WrapNative', 'UnwrapNative', 'Transfer'] },
      { name: 'SplitsRouter', programId: VARA_MAINNET_CONTRACTS.splitsRouter, methods: ['Distribute'] },
    ],
    description:
      'Executes statistical arbitrage across StonkBase 24/7 synthetic equities, optimizes Call the Open 1.20x vaulted parimutuel stakes, and cycles gVARA/TokenVault liquidity.',
  },
  LIQUIDATOR: {
    templateType: 'LIQUIDATOR',
    enumVariant: 'Sde',
    defaultSuffix: 'Liquidator_Agent',
    roleTitle: 'Autonomous Stream Buffer Sentinel, ACP Escrow Settlement & Liquidation Keeper',
    hireFeeVara: 8,
    splitWeight: 1000,
    heartbeatIntervalBlocks: 1200,
    skills: [
      'stream-core-buffer-solvency-patrol',
      'liquidation-manager-keeper',
      'inter-agent-stream-settlement',
      'vault-collateral-rebalancing',
    ],
    contractsUsed: [
      { name: 'LiquidationManager', programId: VARA_MAINNET_CONTRACTS.liquidationManager, methods: ['Liquidate', 'CheckSolvency'] },
      { name: 'StreamCore', programId: VARA_MAINNET_CONTRACTS.streamCore, methods: ['CreateStream', 'Withdraw', 'StopStream'] },
      { name: 'TokenVault', programId: VARA_MAINNET_CONTRACTS.tokenVault, methods: ['DepositNative', 'WithdrawNative'] },
    ],
    description:
      'Monitors active StreamCore per-second streams across the Agent Society, settles inter-agent work streams, and rebalances TokenVault collateral.',
  },
  MARKET_MAKER: {
    templateType: 'MARKET_MAKER',
    enumVariant: 'Trader',
    defaultSuffix: 'MarketMaker_Agent',
    roleTitle: 'Autonomous Call-the-Open Parimutuel Liquidity Provider & Spread Engine',
    hireFeeVara: 10,
    splitWeight: 1000,
    heartbeatIntervalBlocks: 1200,
    skills: [
      'call-the-open-two-sided-parimutuel-quoting',
      'vaulted-1.20x-share-boost-anchoring',
      'stonkbase-synthetic-equity-hedging',
    ],
    contractsUsed: [
      { name: 'TokenVault', programId: VARA_MAINNET_CONTRACTS.tokenVault, methods: ['DepositNative', 'WithdrawNative'] },
      { name: 'DistributionPool', programId: VARA_MAINNET_CONTRACTS.distributionPool, methods: ['Distribute', 'SetUnits'] },
    ],
    description:
      'Provides continuous two-sided GREEN/RED parimutuel liquidity on Call the Open and hedges overnight gap risk across StonkBase 24/7 synthetic equities.',
  },
  BOUNTY_HUNTER: {
    templateType: 'BOUNTY_HUNTER',
    enumVariant: 'Sde',
    defaultSuffix: 'BountyHunter_Agent',
    roleTitle: 'Autonomous BountyAdapter Executor, Campaign Verifier & QuestSeeds Harvester',
    hireFeeVara: 8,
    splitWeight: 1000,
    heartbeatIntervalBlocks: 1200,
    skills: [
      'bounty-adapter-stream-claiming',
      'x-and-github-campaign-quest-execution',
      'quest-seeds-and-grow-reward-routing',
    ],
    contractsUsed: [
      { name: 'BountyAdapter', programId: VARA_MAINNET_CONTRACTS.bountyAdapter, methods: ['CreateBounty', 'ClaimBounty', 'VerifyAndStartStream'] },
      { name: 'QuestSeeds', programId: VARA_MAINNET_CONTRACTS.questSeeds, methods: ['MintSeeds', 'BalanceOf'] },
    ],
    description:
      'Autonomously claims and fulfills open developer/content bounties on BountyAdapter, verifies X/GitHub campaign quests, and routes GROW/gVARA stream rewards.',
  },
};

export function listExtendedAgentTemplates() {
  return Object.values(EXTENDED_AGENT_TEMPLATES);
}

export async function executeAgentTemplateTask(templateType, context) {
  switch (String(templateType).toUpperCase()) {
    case 'TRADER':
    case 'QUANT':
    case 'MARKET_MAKER':
      return runTraderAgent(context);
    case 'SDE':
    case 'LIQUIDATOR':
    case 'BOUNTY_HUNTER':
      return runSdeAgent(context);
    case 'ART':
      return runArtAgent(context);
    case 'X':
      return runXAgent(context);
    default:
      throw new Error(`Unsupported agent template type: ${templateType}`);
  }
}
