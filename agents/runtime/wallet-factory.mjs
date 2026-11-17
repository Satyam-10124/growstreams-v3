import crypto from 'crypto';
import { AGENT_TEMPLATES, EXTENDED_AGENT_TEMPLATES } from '../templates/index.mjs';

const VARA_SS58_PREFIX = 137; // Official Vara Network SS58 prefix (produces kG... addresses)
const DEFAULT_SESSION_SEED = process.env.VARA_SESSION_SEED || process.env.VARA_SEED || '';

let cachedKeyringInstance = null;
let cachedUtilCrypto = null;

async function getUtilCrypto() {
  if (cachedUtilCrypto) return cachedUtilCrypto;
  try {
    cachedUtilCrypto = await import('../../api/node_modules/@polkadot/util-crypto/index.js');
    return cachedUtilCrypto;
  } catch {
    try {
      cachedUtilCrypto = await import('@polkadot/util-crypto');
      return cachedUtilCrypto;
    } catch {
      return null;
    }
  }
}

async function getSr25519Keyring() {
  if (cachedKeyringInstance) return cachedKeyringInstance;
  try {
    const utilCrypto = await getUtilCrypto();
    const polkadotApi = await import('../../api/node_modules/@polkadot/api/index.js').catch(
      () => import('@polkadot/api')
    );
    if (utilCrypto?.cryptoWaitReady) {
      await utilCrypto.cryptoWaitReady();
    }
    const { Keyring } = polkadotApi;
    cachedKeyringInstance = new Keyring({ type: 'sr25519', ss58Format: VARA_SS58_PREFIX });
    return cachedKeyringInstance;
  } catch {
    return null;
  }
}

/**
 * Normalizes any Vara SS58 or 0x address into a 32-byte 0x hex ActorId.
 */
export async function toActorIdHex(addressOrId) {
  if (!addressOrId) {
    return '0x' + crypto.randomBytes(32).toString('hex');
  }
  const raw = String(addressOrId).trim();
  if (/^0x[0-9a-fA-F]{64}$/.test(raw)) {
    return raw.toLowerCase();
  }
  if (raw.startsWith('0x')) {
    const clean = raw.slice(2).replace(/[^0-9a-fA-F]/g, '').padStart(64, '0').slice(0, 64);
    return '0x' + clean.toLowerCase();
  }
  try {
    const utilCrypto = await getUtilCrypto();
    if (utilCrypto?.decodeAddress) {
      const bytes = utilCrypto.decodeAddress(raw);
      return '0x' + Buffer.from(bytes).toString('hex');
    }
  } catch {}
  const digest = crypto.createHash('sha256').update(raw).digest('hex');
  return '0x' + digest;
}

/**
 * Encodes a 32-byte 0x ActorId into a Vara Mainnet SS58 address (prefix 137 -> kG...).
 */
export async function toVaraSs58(actorIdHex) {
  const cleanHex = actorIdHex.startsWith('0x') ? actorIdHex.slice(2) : actorIdHex;
  const bytes = Buffer.from(cleanHex.padStart(64, '0').slice(0, 64), 'hex');
  try {
    const utilCrypto = await getUtilCrypto();
    if (utilCrypto?.encodeAddress) {
      return utilCrypto.encodeAddress(bytes, VARA_SS58_PREFIX);
    }
  } catch {}
  return `kG${Buffer.from(bytes).toString('base64url').slice(0, 46)}`;
}

/**
 * Resolves a signable Sr25519 User Session Account on Vara Mainnet.
 * Supports delegated ACP session signers for gasless & automated execution.
 */
export async function deriveHumanUserWallet(userHandle, customMnemonic = null) {
  const cleanHandle = String(userHandle || 'User').replace(/[^a-zA-Z0-9_]/g, '');
  const seed = (customMnemonic || process.env.VARA_SEED || DEFAULT_SESSION_SEED).trim();
  const sessionScope = `//ACP//User//${cleanHandle}`;
  const suri = seed ? `${seed}${sessionScope}` : sessionScope;

  const kr = seed ? await getSr25519Keyring() : null;
  if (kr) {
    const pair = kr.addFromUri(suri, { name: cleanHandle });
    const actorIdHex = '0x' + Buffer.from(pair.publicKey).toString('hex');
    const varaAddress = await toVaraSs58(actorIdHex);
    return {
      userHandle: cleanHandle,
      walletAddress: varaAddress,
      substrateAddress: pair.address,
      actorIdHex,
      sessionScope,
      keyringPair: pair,
    };
  }

  const fallbackHash = crypto.createHash('sha256').update(suri).digest('hex');
  const actorIdHex = '0x' + fallbackHash;
  const varaAddress = await toVaraSs58(actorIdHex);
  return {
    userHandle: cleanHandle,
    walletAddress: varaAddress,
    substrateAddress: varaAddress,
    actorIdHex,
    sessionScope,
    keyringPair: null,
  };
}

/**
 * Provisions a delegated Sr25519 child Agent Account (SS58 + 32-byte ActorId + KeyringPair)
 * for a given owner wallet and agent template ('TRADER' | 'SDE' | 'ART' | 'X' | 'QUANT' | 'LIQUIDATOR').
 */
export async function deriveAgentWallet(ownerWallet, templateType, customMnemonic = null) {
  const ownerActorHex = await toActorIdHex(ownerWallet);
  const cleanType = String(templateType).toUpperCase();
  const seed = (customMnemonic || process.env.VARA_SEED || DEFAULT_SESSION_SEED).trim();
  const ownerShort = ownerActorHex.slice(2, 18);
  const sessionScope = `//ACP//Agent//${ownerShort}//${cleanType}`;
  const suri = seed ? `${seed}${sessionScope}` : sessionScope;

  let agentActorId;
  let keyringPair = null;

  const kr = seed ? await getSr25519Keyring() : null;
  if (kr) {
    keyringPair = kr.addFromUri(suri, { name: `${ownerShort}_${cleanType}` });
    agentActorId = '0x' + Buffer.from(keyringPair.publicKey).toString('hex');
  } else {
    const childBytes = crypto.createHash('sha256').update(suri).digest();
    agentActorId = '0x' + childBytes.toString('hex');
  }

  const agentWallet = await toVaraSs58(agentActorId);
  const reservationSeed = crypto
    .createHash('sha256')
    .update(`gas-reservation:${agentActorId}`)
    .digest('hex');

  return {
    ownerActorId: ownerActorHex,
    agentActorId,
    agentWallet,
    substrateAddress: keyringPair?.address || agentWallet,
    sessionScope,
    reservationId: `0x${reservationSeed}`,
    keyringPair,
  };
}

/**
 * Derives a multi-agent squad (4 to 6 agents: TRADER, SDE, ART, X, plus optional QUANT & LIQUIDATOR)
 * for a user wallet.
 */
export async function deriveMultiAgentSuite(ownerWallet, ownerHandle = null, countOrTemplates = 4) {
  const cleanHandle =
    (ownerHandle || '').replace(/[^a-zA-Z0-9_]/g, '') ||
    `VaraUser_${String(ownerWallet).slice(-4)}`;

  let templateKeys = ['TRADER', 'SDE', 'ART', 'X'];
  if (Array.isArray(countOrTemplates) && countOrTemplates.length > 0) {
    templateKeys = countOrTemplates.map((k) => String(k).toUpperCase());
  } else if (typeof countOrTemplates === 'number') {
    if (countOrTemplates === 5) {
      templateKeys = ['TRADER', 'SDE', 'ART', 'X', 'QUANT'];
    } else if (countOrTemplates === 6) {
      templateKeys = ['TRADER', 'SDE', 'ART', 'X', 'QUANT', 'LIQUIDATOR'];
    } else if (countOrTemplates === 7) {
      templateKeys = ['TRADER', 'SDE', 'ART', 'X', 'QUANT', 'LIQUIDATOR', 'MARKET_MAKER'];
    } else if (countOrTemplates >= 8) {
      templateKeys = [
        'TRADER',
        'SDE',
        'ART',
        'X',
        'QUANT',
        'LIQUIDATOR',
        'MARKET_MAKER',
        'BOUNTY_HUNTER',
      ];
    }
  }

  const suite = [];
  for (const key of templateKeys) {
    const tpl = EXTENDED_AGENT_TEMPLATES[key] || AGENT_TEMPLATES[key] || AGENT_TEMPLATES.TRADER;
    const derived = await deriveAgentWallet(ownerWallet, key);
    suite.push({
      owner_wallet: ownerWallet,
      owner_handle: cleanHandle,
      agent_wallet: derived.agentWallet,
      agent_actor_id: derived.agentActorId,
      substrate_address: derived.substrateAddress,
      template_type: key,
      name: `${cleanHandle}_${tpl.defaultSuffix}`,
      role_title: tpl.roleTitle,
      skills: tpl.skills,
      hire_fee_vara: tpl.hireFeeVara,
      split_weight: tpl.splitWeight,
      heartbeat_interval_blocks: tpl.heartbeatIntervalBlocks,
      reservation_id: derived.reservationId,
      protocol_bonus_vara: 100,
      metadata: {
        derivationPath: derived.derivationPath,
        ownerActorId: derived.ownerActorId,
        contractsUsed: tpl.contractsUsed,
        description: tpl.description,
        protocolBonusVara: 100,
      },
    });
  }

  return suite;
}

/**
 * Derives the standard 4-Agent Suite (TRADER, SDE, ART, X) for a user wallet.
 */
export async function deriveFourAgentSuite(ownerWallet, ownerHandle = null) {
  return deriveMultiAgentSuite(ownerWallet, ownerHandle, ['TRADER', 'SDE', 'ART', 'X']);
}
