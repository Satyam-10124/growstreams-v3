import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import { GearApi, GearKeyring } from '@gear-js/api';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  assertWithinTreasuryBudget,
  getBudgetParameters,
} from '../../agents/runtime/treasury-budget-guard.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const API_ROOT = resolve(__dirname, '..');
const PROJECT_ROOT = resolve(__dirname, '../..');

function findIdl(filename) {
  const bundled = resolve(API_ROOT, 'idl', filename);
  if (existsSync(bundled)) return bundled;
  const contractMap = {
    'stream-core.idl': 'contracts/stream-core/stream-core.idl',
    'token-vault.idl': 'contracts/token-vault/token-vault.idl',
    'splits-router.idl': 'contracts/splits-router/splits-router.idl',
    'permission-manager.idl': 'contracts/permission-manager/permission-manager.idl',
    'bounty-adapter.idl': 'contracts/adapters/bounty-adapter/bounty-adapter.idl',
    'identity-registry.idl': 'contracts/identity-registry/identity-registry.idl',
    'grow-token.idl': 'contracts/grow-token/grow-token.idl',
    'quest-seeds.idl': 'contracts/quest-seeds/quest-seeds.idl',
    'wvara.idl': 'contracts/wvara/wvara.idl',
    'super-token.idl': 'contracts/super-token/super-token.idl',
    'distribution-pool.idl': 'contracts/distribution-pool/distribution-pool.idl',
    'liquidation-manager.idl': 'contracts/liquidation-manager/liquidation-manager.idl',
    'agent-registry-acp.idl': 'agents/contracts/agent-registry-acp/agent-registry-acp.idl',
  };
  return resolve(PROJECT_ROOT, contractMap[filename] || filename);
}

const IDL_PATHS = {
  streamCore: findIdl('stream-core.idl'),
  tokenVault: findIdl('token-vault.idl'),
  splitsRouter: findIdl('splits-router.idl'),
  permissionManager: findIdl('permission-manager.idl'),
  bountyAdapter: findIdl('bounty-adapter.idl'),
  identityRegistry: findIdl('identity-registry.idl'),
  growToken: findIdl('grow-token.idl'),
  questSeeds: findIdl('quest-seeds.idl'),
  wvara: findIdl('wvara.idl'),
  superToken: findIdl('super-token.idl'),
  gvaraToken: findIdl('super-token.idl'),
  distributionPool: findIdl('distribution-pool.idl'),
  liquidationManager: findIdl('liquidation-manager.idl'),
  agentRegistryAcp: findIdl('agent-registry-acp.idl'),
};

let gearApi = null;
let keyring = null;
let parser = null;

const contracts = {
  streamCore: null,
  tokenVault: null,
  splitsRouter: null,
  permissionManager: null,
  bountyAdapter: null,
  identityRegistry: null,
  growToken: null,
  questSeeds: null,
  wvara: null,
  superToken: null,
  gvaraToken: null,
  distributionPool: null,
  liquidationManager: null,
  agentRegistryAcp: null,
};

const SERVICE_NAMES = {
  streamCore: 'StreamService',
  tokenVault: 'VaultService',
  splitsRouter: 'SplitsService',
  permissionManager: 'PermissionService',
  bountyAdapter: 'BountyService',
  identityRegistry: 'IdentityService',
  growToken: 'VftService',
  questSeeds: 'SeedsService',
  wvara: 'Vft',
  superToken: 'SuperTokenService',
  gvaraToken: 'SuperTokenService',
  distributionPool: 'PoolService',
  liquidationManager: 'LiquidationService',
  agentRegistryAcp: 'AgentSocietyService',
};

function loadDeployState() {
  const candidates = [
    resolve(API_ROOT, 'deploy-state.json'),
    resolve(PROJECT_ROOT, 'deploy-state.json'),
  ];
  for (const p of candidates) {
    try {
      if (existsSync(p)) {
        console.log(`[sails] Loading deploy state from ${p}`);
        return JSON.parse(readFileSync(p, 'utf-8'));
      }
    } catch { /* skip */ }
  }
  return {};
}

const DEPLOY_KEY_MAP = {
  streamCore: 'stream-core',
  tokenVault: 'token-vault',
  splitsRouter: 'splits-router',
  permissionManager: 'permission-manager',
  bountyAdapter: 'bounty-adapter',
  identityRegistry: 'identity-registry',
  growToken: 'grow-token',
  questSeeds: 'quest-seeds',
  wvara: 'wvara',
  superToken: 'super-token',
  gvaraToken: 'gvara-token',
  distributionPool: 'distribution-pool',
  liquidationManager: 'liquidation-manager',
  agentRegistryAcp: 'agent-registry-acp',
};

async function initSailsInstance(name, idlPath, programId) {
  const idl = readFileSync(idlPath, 'utf-8');
  const sails = new Sails(parser);
  sails.parseIdl(idl);
  if (gearApi) {
    sails.setApi(gearApi);
  }
  if (programId) {
    sails.setProgramId(programId);
  }
  return sails;
}

export async function connect() {
  const nodeUrl = process.env.VARA_NODE || 'wss://rpc.vara.network';
  const seed = process.env.VARA_SEED;

  console.log(`[sails] Connecting to ${nodeUrl}...`);
  gearApi = await GearApi.create({ providerAddress: nodeUrl });
  const chain = await gearApi.chain();
  console.log(`[sails] Connected: ${chain}`);

  gearApi.on('disconnected', () => {
    if (!gearApi) return;
    console.warn('[sails] WebSocket disconnected — reconnecting...');
    gearApi.connect().catch(err => console.error('[sails] Reconnect failed:', err.message));
  });

  if (seed) {
    try {
      keyring = await GearKeyring.fromMnemonic(seed);
    } catch {
      keyring = await GearKeyring.fromSuri(seed);
    }
    console.log(`[sails] Account: ${keyring.address}`);
  }

  parser = await SailsIdlParser.new();

  const deployState = loadDeployState();

  const envOverrides = {
    streamCore: process.env.STREAM_CORE_ID,
    tokenVault: process.env.TOKEN_VAULT_ID,
    splitsRouter: process.env.SPLITS_ROUTER_ID,
    permissionManager: process.env.PERMISSION_MANAGER_ID,
    bountyAdapter: process.env.BOUNTY_ADAPTER_ID,
    identityRegistry: process.env.IDENTITY_REGISTRY_ID,
    growToken: process.env.GROW_TOKEN_ID,
    questSeeds: process.env.QUEST_SEEDS_ID,
    wvara: process.env.WVARA_TOKEN_ID,
    superToken: process.env.SUPER_TOKEN_ID,
    gvaraToken: process.env.GVARA_TOKEN_ID,
    distributionPool: process.env.DISTRIBUTION_POOL_ID,
    liquidationManager: process.env.LIQUIDATION_MANAGER_ID,
    agentRegistryAcp: process.env.AGENT_REGISTRY_ACP_ID,
  };

  for (const [name, idlPath] of Object.entries(IDL_PATHS)) {
    const programId =
      envOverrides[name] ||
      deployState[DEPLOY_KEY_MAP[name]]?.programId ||
      null;

    try {
      if (existsSync(idlPath)) {
        contracts[name] = await initSailsInstance(name, idlPath, programId);
        console.log(`[sails] ${name} loaded${programId ? ` @ ${programId.slice(0, 18)}...` : ' (no program ID)'}`);
      }
    } catch (err) {
      console.warn(`[sails] Failed to load ${name}: ${err.message}`);
    }
  }

  return { gearApi, keyring, contracts };
}

export function getApi() {
  return gearApi;
}

export function getKeyring() {
  return keyring;
}

export async function getTreasuryBudgetStatus() {
  let freeBig = null;
  if (gearApi && keyring) {
    try {
      const { data: { free } } = await gearApi.query.system.account(keyring.address);
      freeBig = BigInt(free.toString());
    } catch {}
  }
  return getBudgetParameters(freeBig);
}

export function getContract(name) {
  return contracts[name];
}

export function getServiceName(name) {
  return SERVICE_NAMES[name];
}

export function getAllContracts() {
  return contracts;
}

export function getProgramIds() {
  const deployState = loadDeployState();
  const ids = {};
  for (const [name, deployKey] of Object.entries(DEPLOY_KEY_MAP)) {
    try {
      ids[deployKey] = contracts[name]?.programId || deployState[deployKey]?.programId || null;
    } catch {
      ids[deployKey] = deployState[deployKey]?.programId || null;
    }
  }
  return ids;
}

export async function query(contractName, fnName, ...args) {
  const sails = contracts[contractName];
  if (!sails) throw new Error(`Contract ${contractName} not loaded`);

  const serviceName = SERVICE_NAMES[contractName];
  const service = sails.services[serviceName];
  if (!service) throw new Error(`Service ${serviceName} not found in ${contractName}`);

  const queryFn = service.queries[fnName];
  if (!queryFn) throw new Error(`Query ${fnName} not found in ${serviceName}`);

  const origin = keyring?.address || '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
  // sails-js v0.3.x takes (origin, value, atBlock, ...args)
  return await queryFn(origin, null, null, ...args);
}

export async function command(contractName, fnName, ...args) {
  let value = 0n;
  let customSigner = null;
  let skipBudgetGuard = false;
  if (
    args.length > 0 &&
    typeof args[args.length - 1] === 'object' &&
    args[args.length - 1] !== null &&
    ('_value' in args[args.length - 1] ||
      '_signer' in args[args.length - 1] ||
      '_skipBudgetGuard' in args[args.length - 1])
  ) {
    const opts = args.pop();
    value = BigInt(opts._value || 0n);
    customSigner = opts._signer || null;
    skipBudgetGuard = Boolean(opts._skipBudgetGuard);
  }

  const sails = contracts[contractName];
  if (!sails) throw new Error(`Contract ${contractName} not loaded`);
  const activeSigner = customSigner || keyring;
  if (!activeSigner) throw new Error('No keyring configured for signing');

  // Strict 20% Treasury Budget Guard check before signing directly with Treasury keyring
  if (!customSigner && !skipBudgetGuard) {
    await assertWithinTreasuryBudget(gearApi, keyring.address, value, 35_000_000_000n);
  }

  const serviceName = SERVICE_NAMES[contractName];
  const service = sails.services[serviceName];
  if (!service) throw new Error(`Service ${serviceName} not found in ${contractName}`);

  const fn = service.functions[fnName];
  if (!fn) throw new Error(`Function ${fnName} not found in ${serviceName}`);

  const tx = fn(...args);
  tx.withAccount(activeSigner);
  if (value > 0n) {
    tx.withValue(value);
  }
  try {
    await tx.calculateGas(true, 15);
  } catch {
    tx.withGas(100_000_000_000n);
  }
  const { response, blockHash, txHash } = await tx.signAndSend();
  let result = null;
  try {
    result = await response();
  } catch (decodeErr) {
    try {
      result = await response(true);
    } catch {
      console.warn(`[sails] Response decode warning for ${contractName}.${fnName}: ${decodeErr?.message || String(decodeErr)}`);
    }
  }
  return { result, blockHash, txHash };
}

export function encodePayload(contractName, fnName, ...args) {
  const sails = contracts[contractName];
  if (!sails) throw new Error(`Contract ${contractName} not loaded`);

  const serviceName = SERVICE_NAMES[contractName];
  const service = sails.services[serviceName];
  if (!service) throw new Error(`Service ${serviceName} not found`);

  const fn = service.functions[fnName];
  if (!fn) throw new Error(`Function ${fnName} not found`);

  const payload = fn.encodePayload(...args);
  if (typeof payload === 'string') return payload;
  return '0x' + Buffer.from(payload).toString('hex');
}

export async function disconnect() {
  const apiToClose = gearApi;
  gearApi = null;
  if (apiToClose) {
    try {
      await apiToClose.disconnect();
    } catch {}
  }
}
