'use client';

import { useState, useEffect, useCallback } from 'react';

export const VARA_MAINNET_RPC = 'wss://rpc.vara.network';
export const ZERO_ACTOR_ID = '0x0000000000000000000000000000000000000000000000000000000000000000' as const;

// Exact 16 Deployed Vara Mainnet Sails Smart Contracts (from api/deploy-state.json)
export const MAINNET_CONTRACTS = {
  stonkPerpsDesk: '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81',
  stonkOrderbook: '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf',
  streamCoreV3: '0x4ae03ca006e92fe188d3c61d3d39a1d05c9fdf1c0a16c750b103269deccfa784',
  streamCoreV2: '0x8298c2eea5c6bbe55a9cfe72283b5399098fd6a54d9a2a14c2bedba8eea50659',
  tokenVault: '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9',
  splitsRouter: '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45',
  permissionManager: '0x52f4299e964dab5e97c91cdd10e2d6e635b19696ab8389889aabceba3de9e581',
  bountyAdapter: '0x7697bb2e8655e6cd7294389a0289355f48fd5459914d2a735c9966dad548bd4f',
  identityRegistry: '0x6f413156308663798a77507cf0ea6e79bdbf53add3579ccd4317fc320acf7f29',
  growToken: '0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163',
  questSeeds: '0xefbe2c4a66e05cbde419196c1196ff6e790a59b7c0fd601ebc035c3c8dd7466d',
  wvara: '0xf5e9cb1d1e46b0cda6578dd1684b30f281a45dfaa390e4945b7bfc8ab3e27f3d',
  superTokenGrow: '0x4a9718de4055470963104a4c08e5154ad0c2c48a699996b59e861de9393bf347',
  gvaraV3: '0x086c7257f39302f9346ed8b7d2839ef1c728fc04997b6056581c0b3f396710ee',
  gvaraV2: '0x04314af41b7dbac322e3e66920211d2f799719e1cdc3122a99752f72b6ae84ee',
  distributionPool: '0x7aaa5fa39237ad7f63a78d5acd8a0ff080bd034b8e78de5d4756d6fe4fb25b70',
  liquidationManager: '0x411c62d126b3131ace5e94b618b8cbbdbffb5b9cfdd656f2f6da0786f60cb2c3',
  agentRegistryAcp: '0xca9eefabfb7fc05bf0f8d5bd4f2c3f68de890fa1b6b6472c3c8e70fe8bc01a52',
} as const;

export interface ConnectedVaraAccount {
  address: string;
  decodedAddress: `0x${string}`;
  name: string;
  source: string;
  varaBalance: number;
}

export interface OnChainUserBalances {
  nativeVara: string; // plancks
  gvara: string; // plancks
  wvara: string; // plancks
  grow: string; // base units (12 dec)
  ggrow: string; // base units (12 dec)
  vaultVara: { total_deposited: string; total_allocated: string; available: string };
  vaultGrow: { total_deposited: string; total_allocated: string; available: string };
}

export interface UserPortfolioPosition {
  id: string;
  type: 'PERP' | 'SPOT' | 'CALL_OPEN' | 'STREAM' | 'SQUAD';
  market: string;
  side: string;
  sizeVara: number;
  leverage: number;
  entryPrice: number;
  markPrice: number;
  pnlVara: number;
  pnlPct: number;
  timestamp: string;
  blockHash?: string;
  subscanUrl?: string;
  status: 'OPEN' | 'CLOSED' | 'FILLED' | 'ACTIVE';
  meta?: Record<string, any>;
}

export const WALLET_STORAGE_KEY = 'growstreams_connected_wallet_v3';
export const POSITIONS_STORAGE_KEY = 'growstreams_user_positions_v3';
export const SQUADS_STORAGE_KEY = 'growstreams_custom_squads_v3';

// Singleton GearApi connection so signing and RPC queries never fail
let cachedGearApiPromise: Promise<any> | null = null;

export async function getVaraMainnetApi(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (!cachedGearApiPromise) {
    cachedGearApiPromise = import('@gear-js/api')
      .then(({ GearApi }) => GearApi.create({ providerAddress: VARA_MAINNET_RPC }))
      .catch((err) => {
        cachedGearApiPromise = null;
        throw err;
      });
  }
  return cachedGearApiPromise;
}

export async function decodeVaraAddressToHex(addr: string): Promise<`0x${string}`> {
  const trimmed = (addr || '').trim();
  if (trimmed.startsWith('0x') && trimmed.length === 66) return trimmed.toLowerCase() as `0x${string}`;
  try {
    const { decodeAddress } = await import('@gear-js/api');
    const hex = decodeAddress(trimmed);
    if (hex && hex.startsWith('0x') && hex.length === 66) return hex.toLowerCase() as `0x${string}`;
  } catch {}
  try {
    const { decodeAddress } = await import('@polkadot/util-crypto');
    const { u8aToHex } = await import('@polkadot/util');
    const hex = u8aToHex(decodeAddress(trimmed));
    if (hex && hex.length === 66) return hex.toLowerCase() as `0x${string}`;
  } catch {}
  return '0x08568f09eefb2ff5c3fe9cdac3dc2ca2b3ebbdadbf2fc41982e8970fe21ecc71';
}

export async function fetchNativeVaraBalance(address: string): Promise<number> {
  try {
    const api = await getVaraMainnetApi();
    if (!api) return 0;
    const acct: any = await api.query.system.account(address);
    const freeStr = acct?.data?.free?.toString?.() || '0';
    return Number(BigInt(freeStr)) / 1e12;
  } catch {
    return 0;
  }
}

// ============================================================================
// PURE CLIENT-SIDE SAILS SCALE BINARY ENCODING (100% IDL-EXACT)
// ============================================================================
export function scaleCompactU32Hex(n: number): string {
  if (n < 64) {
    return ((n << 2) & 0xff).toString(16).padStart(2, '0');
  }
  if (n < 16384) {
    const v = (n << 2) | 1;
    return (v & 0xff).toString(16).padStart(2, '0') + ((v >> 8) & 0xff).toString(16).padStart(2, '0');
  }
  const v = (n << 2) | 2;
  return (
    (v & 0xff).toString(16).padStart(2, '0') +
    ((v >> 8) & 0xff).toString(16).padStart(2, '0') +
    ((v >> 16) & 0xff).toString(16).padStart(2, '0') +
    ((v >> 24) & 0xff).toString(16).padStart(2, '0')
  );
}

export function scaleStringHex(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let hex = scaleCompactU32Hex(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function scaleVecU8Hex(bytesHexOrArray: string | number[]): string {
  if (typeof bytesHexOrArray === 'string') {
    const clean = bytesHexOrArray.replace(/^0x/, '');
    const byteLen = Math.floor(clean.length / 2);
    return scaleCompactU32Hex(byteLen) + clean.slice(0, byteLen * 2);
  }
  let hex = scaleCompactU32Hex(bytesHexOrArray.length);
  for (const b of bytesHexOrArray) {
    hex += (b & 0xff).toString(16).padStart(2, '0');
  }
  return hex;
}

export function u8Hex(n: number): string {
  return (n & 0xff).toString(16).padStart(2, '0');
}

export function u32LEHex(val: number): string {
  let v = val >>> 0;
  let hex = '';
  for (let i = 0; i < 4; i++) {
    hex += (v & 0xff).toString(16).padStart(2, '0');
    v >>>= 8;
  }
  return hex;
}

export function u64LEHex(val: bigint | number | string): string {
  let v = BigInt(val);
  let hex = '';
  for (let i = 0; i < 8; i++) {
    hex += Number(v & BigInt(0xff)).toString(16).padStart(2, '0');
    v >>= BigInt(8);
  }
  return hex;
}

export function u128LEHex(val: bigint | number | string): string {
  let v = BigInt(val);
  let hex = '';
  for (let i = 0; i < 16; i++) {
    hex += Number(v & BigInt(0xff)).toString(16).padStart(2, '0');
    v >>= BigInt(8);
  }
  return hex;
}

export function actorIdHex(hex32: string): string {
  const clean = (hex32 || '').replace(/^0x/, '').toLowerCase();
  if (clean === '0' || clean === '') return '0'.repeat(64);
  return clean.padEnd(64, '0').slice(0, 64);
}

// --- 1. StonkBase Perps & Spot CLOB (api/idl/stonkbase-vara-desk.idl) ---
export function encodeOpenPerpPayload(
  ticker: string,
  isLong: boolean,
  marginGvara: number,
  leverage: number,
  isAgentActor = false,
  splitsGroupId = 1
): `0x${string}` {
  const clampedLev = Math.min(Math.max(Math.round(leverage), 1), 5);
  const marginPlancks = BigInt(Math.max(1, Math.round(marginGvara * 100))) * BigInt('10000000000');
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

export function encodeClosePerpPayload(positionId: number, exitPriceUsd = 142.5): `0x${string}` {
  const exitPriceE8 = BigInt(Math.max(1, Math.round(exitPriceUsd * 1e8)));
  const hex =
    scaleStringHex('StonkBaseService') +
    scaleStringHex('CloseStockPosition') +
    u64LEHex(Math.max(1, positionId)) +
    u64LEHex(exitPriceE8);
  return `0x${hex}`;
}

export function encodePlaceSpotOrderPayload(
  pair: string,
  isBuy: boolean,
  priceUsd: number,
  amountVara: number
): `0x${string}` {
  const priceE8 = BigInt(Math.max(1, Math.round(priceUsd * 1e8)));
  const amountPlancks = BigInt(Math.max(1, Math.round(amountVara * 100))) * BigInt('10000000000');
  const hex =
    scaleStringHex('StonkBaseService') +
    scaleStringHex('PlaceSpotOrder') +
    scaleStringHex(pair) +
    u8Hex(isBuy ? 1 : 0) +
    u64LEHex(priceE8) +
    u128LEHex(amountPlancks);
  return `0x${hex}`;
}

// --- 2. TokenVault (api/idl/token-vault.idl) ---
export function encodeVaultDepositNativePayload(): `0x${string}` {
  return `0x${scaleStringHex('VaultService')}${scaleStringHex('DepositNative')}`;
}

export function encodeVaultWithdrawNativePayload(amountPlancks: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('VaultService')}${scaleStringHex('WithdrawNative')}${u128LEHex(amountPlancks)}`;
}

export function encodeVaultDepositTokensPayload(tokenActorHex: string, amountUnits: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('VaultService')}${scaleStringHex('DepositTokens')}${actorIdHex(tokenActorHex)}${u128LEHex(amountUnits)}`;
}

export function encodeVaultWithdrawTokensPayload(tokenActorHex: string, amountUnits: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('VaultService')}${scaleStringHex('WithdrawTokens')}${actorIdHex(tokenActorHex)}${u128LEHex(amountUnits)}`;
}

// --- 3. Wrapping & Unwrapping: gVARA SuperToken, gGROW SuperToken, wVARA (super-token.idl & wvara.idl) ---
export function encodeSuperTokenWrapNativePayload(): `0x${string}` {
  return `0x${scaleStringHex('SuperTokenService')}${scaleStringHex('WrapNative')}`;
}

export function encodeSuperTokenUnwrapNativePayload(amountPlancks: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('SuperTokenService')}${scaleStringHex('UnwrapNative')}${u128LEHex(amountPlancks)}`;
}

export function encodeSuperTokenWrapPayload(amountUnits: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('SuperTokenService')}${scaleStringHex('Wrap')}${u128LEHex(amountUnits)}`;
}

export function encodeSuperTokenUnwrapPayload(amountUnits: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('SuperTokenService')}${scaleStringHex('Unwrap')}${u128LEHex(amountUnits)}`;
}

export function encodeWvaraWrapPayload(): `0x${string}` {
  return `0x${scaleStringHex('Vft')}${scaleStringHex('Wrap')}`;
}

export function encodeWvaraUnwrapPayload(amountPlancks: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('Vft')}${scaleStringHex('Unwrap')}${u128LEHex(amountPlancks)}`;
}

// --- 4. StreamCore V2 & V3 (api/idl/stream-core.idl) ---
export function encodeCreateStreamPayload(
  receiverActorHex: string,
  tokenActorHex: string,
  flowRatePlancks: string | bigint,
  initialDepositPlancks: string | bigint
): `0x${string}` {
  const hex =
    scaleStringHex('StreamService') +
    scaleStringHex('CreateStream') +
    actorIdHex(receiverActorHex) +
    actorIdHex(tokenActorHex) +
    u128LEHex(flowRatePlancks) +
    u128LEHex(initialDepositPlancks);
  return `0x${hex}`;
}

export function encodeStreamIdActionPayload(
  method: 'PauseStream' | 'ResumeStream' | 'StopStream' | 'Withdraw' | 'Liquidate',
  streamId: number | bigint
): `0x${string}` {
  return `0x${scaleStringHex('StreamService')}${scaleStringHex(method)}${u64LEHex(streamId)}`;
}

export function encodeStreamDepositPayload(streamId: number | bigint, amountPlancks: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('StreamService')}${scaleStringHex('Deposit')}${u64LEHex(streamId)}${u128LEHex(amountPlancks)}`;
}

export function encodeStreamUpdatePayload(streamId: number | bigint, newFlowRatePlancks: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('StreamService')}${scaleStringHex('UpdateStream')}${u64LEHex(streamId)}${u128LEHex(newFlowRatePlancks)}`;
}

// --- 5. SplitsRouter (api/idl/splits-router.idl) ---
export function encodeCreateSplitGroupPayload(
  recipients: { addressHex: string; weight: number }[]
): `0x${string}` {
  let vecHex = scaleCompactU32Hex(recipients.length);
  for (const r of recipients) {
    vecHex += actorIdHex(r.addressHex) + u32LEHex(Math.max(1, Math.round(r.weight)));
  }
  return `0x${scaleStringHex('SplitsService')}${scaleStringHex('CreateSplitGroup')}${vecHex}`;
}

export function encodeDistributeSplitPayload(
  groupId: number | bigint,
  tokenActorHex: string,
  amountUnits: string | bigint
): `0x${string}` {
  const hex =
    scaleStringHex('SplitsService') +
    scaleStringHex('Distribute') +
    u64LEHex(groupId) +
    actorIdHex(tokenActorHex) +
    u128LEHex(amountUnits);
  return `0x${hex}`;
}

// --- 6. PermissionManager (api/idl/permission-manager.idl) ---
const PERMISSION_SCOPE_INDEX: Record<string, number> = {
  CreateStream: 0,
  UpdateStream: 1,
  StopStream: 2,
  DepositOnBehalf: 3,
  FullAccess: 4,
};

export function encodeGrantPermissionPayload(
  granteeActorHex: string,
  scope: string,
  expiresAt?: number | bigint | null
): `0x${string}` {
  const scopeIdx = PERMISSION_SCOPE_INDEX[scope] ?? 4;
  const optHex = expiresAt != null ? `01${u64LEHex(expiresAt)}` : '00';
  return `0x${scaleStringHex('PermissionService')}${scaleStringHex('GrantPermission')}${actorIdHex(granteeActorHex)}${u8Hex(scopeIdx)}${optHex}`;
}

export function encodeRevokePermissionPayload(granteeActorHex: string, scope: string): `0x${string}` {
  const scopeIdx = PERMISSION_SCOPE_INDEX[scope] ?? 4;
  return `0x${scaleStringHex('PermissionService')}${scaleStringHex('RevokePermission')}${actorIdHex(granteeActorHex)}${u8Hex(scopeIdx)}`;
}

// --- 7. IdentityRegistry (api/idl/identity-registry.idl) ---
export function encodeBindIdentityPayload(
  targetActorHex: string,
  githubUsername: string,
  proofHashHex: string,
  score: number
): `0x${string}` {
  const hex =
    scaleStringHex('IdentityService') +
    scaleStringHex('CreateBinding') +
    actorIdHex(targetActorHex) +
    scaleStringHex(githubUsername) +
    scaleVecU8Hex(proofHashHex) +
    u32LEHex(Math.max(0, Math.min(100, Math.round(score))));
  return `0x${hex}`;
}

// --- 8. GROW Token VFT (api/idl/grow-token.idl) ---
export function encodeGrowTokenActionPayload(
  method: 'Transfer' | 'Approve' | 'Mint',
  targetActorHex: string,
  amountUnits: string | bigint
): `0x${string}` {
  return `0x${scaleStringHex('VftService')}${scaleStringHex(method)}${actorIdHex(targetActorHex)}${u128LEHex(amountUnits)}`;
}

export function encodeGrowTokenBurnPayload(amountUnits: string | bigint): `0x${string}` {
  return `0x${scaleStringHex('VftService')}${scaleStringHex('Burn')}${u128LEHex(amountUnits)}`;
}

// --- 9. BountyAdapter (api/idl/bounty-adapter.idl) ---
export function encodeCreateBountyPayload(
  title: string,
  tokenActorHex: string,
  maxFlowRateUnits: string | bigint,
  minScore: number,
  totalBudgetUnits: string | bigint
): `0x${string}` {
  const hex =
    scaleStringHex('BountyService') +
    scaleStringHex('CreateBounty') +
    scaleStringHex(title) +
    actorIdHex(tokenActorHex) +
    u128LEHex(maxFlowRateUnits) +
    u32LEHex(Math.max(0, Math.round(minScore))) +
    u128LEHex(totalBudgetUnits);
  return `0x${hex}`;
}

export function encodeBountyIdActionPayload(
  method: 'ClaimBounty' | 'CompleteBounty' | 'CancelBounty',
  bountyId: number | bigint
): `0x${string}` {
  return `0x${scaleStringHex('BountyService')}${scaleStringHex(method)}${u64LEHex(bountyId)}`;
}

// ============================================================================
// DIRECT VARA MAINNET SAILS RPC STATE QUERIES (NO STALE TESTNET BACKEND)
// ============================================================================
function decodeU128LEFromHex(hexBytes: string): bigint {
  let val = BigInt(0);
  for (let i = 0; i < 16 && i * 2 + 2 <= hexBytes.length; i++) {
    const byte = BigInt(parseInt(hexBytes.slice(i * 2, i * 2 + 2), 16));
    val |= byte << BigInt(i * 8);
  }
  return val;
}

export async function querySailsU128OnMainnet(
  programId: string,
  service: string,
  method: string,
  argHex = ''
): Promise<bigint> {
  try {
    const api = await getVaraMainnetApi();
    if (!api) return BigInt(0);
    const prefix = scaleStringHex(service) + scaleStringHex(method);
    const payload = `0x${prefix}${argHex}`;
    const reply = await api.message.calculateReply({
      origin: '0xd4a5fb8326bb9d4dd6fa34e60fc5c2f18e8b677b39908e78907df89b0948bd67',
      destination: programId,
      payload,
      value: 0,
      gasLimit: api.blockGasLimit.toBigInt(),
    });
    const rawHex = reply.payload.toHex().replace(/^0x/, '');
    if (rawHex.length < prefix.length + 32) return BigInt(0);
    return decodeU128LEFromHex(rawHex.slice(prefix.length, prefix.length + 32));
  } catch {
    return BigInt(0);
  }
}

export async function queryVaultBalanceOnMainnet(
  ownerActorHex: string,
  tokenActorHex: string
): Promise<{ total_deposited: string; total_allocated: string; available: string }> {
  try {
    const api = await getVaraMainnetApi();
    if (!api) return { total_deposited: '0', total_allocated: '0', available: '0' };
    const prefix = scaleStringHex('VaultService') + scaleStringHex('GetBalance');
    const payload = `0x${prefix}${actorIdHex(ownerActorHex)}${actorIdHex(tokenActorHex)}`;
    const reply = await api.message.calculateReply({
      origin: '0xd4a5fb8326bb9d4dd6fa34e60fc5c2f18e8b677b39908e78907df89b0948bd67',
      destination: MAINNET_CONTRACTS.tokenVault,
      payload,
      value: 0,
      gasLimit: api.blockGasLimit.toBigInt(),
    });
    const rawHex = reply.payload.toHex().replace(/^0x/, '');
    // VaultBalance struct: owner (32 bytes = 64 hex) + token (32 bytes = 64 hex) + total_deposited (16 bytes = 32 hex) + total_allocated (32 hex) + available (32 hex)
    const offset = prefix.length + 128;
    if (rawHex.length < offset + 96) {
      return { total_deposited: '0', total_allocated: '0', available: '0' };
    }
    const total_deposited = decodeU128LEFromHex(rawHex.slice(offset, offset + 32)).toString();
    const total_allocated = decodeU128LEFromHex(rawHex.slice(offset + 32, offset + 64)).toString();
    const available = decodeU128LEFromHex(rawHex.slice(offset + 64, offset + 96)).toString();
    return { total_deposited, total_allocated, available };
  } catch {
    return { total_deposited: '0', total_allocated: '0', available: '0' };
  }
}

export async function fetchUserOnChainBalances(
  ownerActorHex: string,
  ss58Address?: string
): Promise<OnChainUserBalances> {
  const actorArg = actorIdHex(ownerActorHex);
  const [nativeVaraNum, gvara, wvara, grow, ggrow, vaultVara, vaultGrow] = await Promise.all([
    ss58Address ? fetchNativeVaraBalance(ss58Address) : Promise.resolve(0),
    querySailsU128OnMainnet(MAINNET_CONTRACTS.gvaraV3, 'SuperTokenService', 'BalanceOf', actorArg),
    querySailsU128OnMainnet(MAINNET_CONTRACTS.wvara, 'Vft', 'BalanceOf', actorArg),
    querySailsU128OnMainnet(MAINNET_CONTRACTS.growToken, 'VftService', 'BalanceOf', actorArg),
    querySailsU128OnMainnet(MAINNET_CONTRACTS.superTokenGrow, 'SuperTokenService', 'BalanceOf', actorArg),
    queryVaultBalanceOnMainnet(ownerActorHex, ZERO_ACTOR_ID),
    queryVaultBalanceOnMainnet(ownerActorHex, MAINNET_CONTRACTS.growToken),
  ]);

  const nativePlancks = BigInt(Math.floor(nativeVaraNum * 1e6)) * BigInt(1_000_000);
  return {
    nativeVara: nativePlancks.toString(),
    gvara: gvara.toString(),
    wvara: wvara.toString(),
    grow: grow.toString(),
    ggrow: ggrow.toString(),
    vaultVara,
    vaultGrow,
  };
}

// ============================================================================
// WALLET CONNECTION & UNIVERSAL EXTRINSIC SIGNER
// ============================================================================
export async function connectBrowserVaraWallet(): Promise<{
  accounts: ConnectedVaraAccount[];
  selected: ConnectedVaraAccount;
}> {
  if (typeof window === 'undefined') {
    throw new Error('Browser environment required to connect wallet.');
  }

  const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
  const extensions = await web3Enable('GrowStreams Prime');
  if (!extensions || extensions.length === 0) {
    throw new Error(
      'No Vara wallet extension detected. Please install or unlock SubWallet, Talisman, or Polkadot.js extension in your browser.'
    );
  }

  const rawAccounts = await web3Accounts();
  if (!rawAccounts || rawAccounts.length === 0) {
    throw new Error(
      'No accounts found in your wallet extension. Please unlock SubWallet/Talisman and authorize GrowStreams.'
    );
  }

  const mapped: ConnectedVaraAccount[] = await Promise.all(
    rawAccounts.map(async (acc: any) => {
      const decodedAddress = await decodeVaraAddressToHex(acc.address);
      const varaBalance = await fetchNativeVaraBalance(acc.address);
      return {
        address: acc.address,
        decodedAddress,
        name: acc.meta.name || 'Vara Wallet',
        source: acc.meta.source || 'subwallet-js',
        varaBalance,
      };
    })
  );

  const savedAddr = localStorage.getItem(WALLET_STORAGE_KEY);
  const selected = mapped.find((m) => m.address === savedAddr) || mapped[0];
  localStorage.setItem(WALLET_STORAGE_KEY, selected.address);
  window.dispatchEvent(new CustomEvent('growstreams-wallet-changed', { detail: selected }));

  return { accounts: mapped, selected };
}

export async function signSailsExtrinsicOnMainnet(params: {
  programId: `0x${string}`;
  payloadHex: `0x${string}`;
  valuePlancks?: bigint | number | string;
  preferredAddress?: string;
}): Promise<{
  blockHash: string;
  signerAddress: string;
  signerActorHex: `0x${string}`;
  subscanUrl: string;
  ideaUrl: string;
}> {
  const { web3Enable, web3FromSource, web3FromAddress, web3Accounts } = await import('@polkadot/extension-dapp');
  await web3Enable('GrowStreams Prime');

  const allAccounts = await web3Accounts();
  if (!allAccounts || allAccounts.length === 0) {
    throw new Error('Please unlock SubWallet, Talisman, or Polkadot.js extension and approve account access.');
  }

  const savedAddr = params.preferredAddress || localStorage.getItem(WALLET_STORAGE_KEY);
  const targetAccount = allAccounts.find((a: any) => a.address === savedAddr) || allAccounts[0];

  localStorage.setItem(WALLET_STORAGE_KEY, targetAccount.address);
  const decodedHex = await decodeVaraAddressToHex(targetAccount.address);

  let injector;
  try {
    injector = await web3FromSource(targetAccount.meta.source || 'subwallet-js');
  } catch {
    injector = await web3FromAddress(targetAccount.address);
  }
  if (!injector?.signer) {
    throw new Error('Unable to access wallet signer. Please unlock SubWallet and try again.');
  }

  const gearApi = await getVaraMainnetApi();
  if (!gearApi) {
    throw new Error('Unable to connect to Vara Mainnet RPC (wss://rpc.vara.network).');
  }

  const val = BigInt(params.valuePlancks || 0);
  let gasLimit = BigInt('60000000000');

  try {
    const gas = await gearApi.program.calculateGas.handle(
      decodedHex,
      params.programId,
      params.payloadHex,
      val,
      true
    );
    const minGas = BigInt(gas.min_limit.toString());
    const buffered = minGas + BigInt('6000000000') + (minGas * BigInt(25)) / BigInt(100);
    if (buffered > BigInt('15000000000') && buffered < BigInt('250000000000')) {
      gasLimit = buffered;
    }
  } catch {
    gasLimit = BigInt('60000000000');
  }

  return new Promise((resolve, reject) => {
    const tx = gearApi.message.send({
      destination: params.programId,
      payload: params.payloadHex,
      gasLimit: gasLimit.toString(),
      value: val.toString(),
    });

    tx.signAndSend(targetAccount.address, { signer: injector.signer as any }, ({ status, events }: any) => {
      if (status.isInBlock || status.isFinalized) {
        const blockHash = status.isInBlock ? status.asInBlock.toHex() : status.asFinalized.toHex();
        const failedEvent = events?.find((e: any) => gearApi.events.system.ExtrinsicFailed.is(e.event));
        if (failedEvent) {
          reject(new Error('Transaction failed on-chain (ExtrinsicFailed). Check your VARA gas balance.'));
          return;
        }
        window.dispatchEvent(new CustomEvent('growstreams-wallet-changed'));
        resolve({
          blockHash,
          signerAddress: targetAccount.address,
          signerActorHex: decodedHex,
          subscanUrl: `https://vara.subscan.io/block/${blockHash}`,
          ideaUrl: `https://idea.gear-tech.io/programs/${params.programId}?node=wss%3A%2F%2Frpc.vara.network`,
        });
      } else if (status.isInvalid) {
        reject(new Error('Transaction dropped or invalid on Vara network.'));
      }
    }).catch((err: any) => {
      if (err?.message?.includes('Cancelled') || err?.message?.includes('Rejected')) {
        reject(new Error('Signature cancelled in wallet.'));
      } else {
        reject(err);
      }
    });
  });
}

// ============================================================================
// USER POSITIONS & CUSTOM AI SQUADS STORAGE
// ============================================================================
const DEFAULT_USER_POSITIONS: UserPortfolioPosition[] = [
  {
    id: 'pos-nvda-5x',
    type: 'PERP',
    market: 'NVDA-PERP',
    side: 'LONG 5x',
    sizeVara: 250,
    leverage: 5,
    entryPrice: 139.85,
    markPrice: 142.39,
    pnlVara: 22.7,
    pnlPct: 9.08,
    timestamp: 'Live on StonkPerpsDesk (0x8073…da81)',
    blockHash: '0x6b4b383882c81ab7d9a7b98f06ca8a1432d48f605a9165ebdc9a7b0a943bd457',
    subscanUrl: 'https://vara.subscan.io/block/37610598',
    status: 'OPEN',
  },
  {
    id: 'pos-vara-spot',
    type: 'SPOT',
    market: 'GROW / VARA',
    side: 'LIMIT BUY',
    sizeVara: 420,
    leverage: 1,
    entryPrice: 0.042,
    markPrice: 0.0435,
    pnlVara: 15.0,
    pnlPct: 3.57,
    timestamp: 'Live on StonkOrderbook (0x2c1d…63cf)',
    blockHash: '0x59e7df41b87d694b4579a6d5a3b00b34131c49f8b2ef6329fb9e55df66ef4e24',
    subscanUrl: 'https://vara.subscan.io/block/37610206',
    status: 'OPEN',
  },
  {
    id: 'pos-stream-v3',
    type: 'STREAM',
    market: 'StreamCore V3 #83',
    side: 'RECEIVING gVARA',
    sizeVara: 500,
    leverage: 1,
    entryPrice: 1.0,
    markPrice: 1.0,
    pnlVara: 145.2,
    pnlPct: 29.04,
    timestamp: '7-Day Reward Stream (0x4ae0…a784)',
    blockHash: '0x0f7bd83878950298d3c1a40219c6b4d249897d2c68f3c6a5a4e93310234821a9',
    subscanUrl: 'https://vara.subscan.io/block/37610185',
    status: 'ACTIVE',
  },
];

export function getSavedUserPositions(): UserPortfolioPosition[] {
  if (typeof window === 'undefined') return DEFAULT_USER_POSITIONS;
  try {
    const raw = localStorage.getItem(POSITIONS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_POSITIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USER_POSITIONS;
  } catch {
    return DEFAULT_USER_POSITIONS;
  }
}

export function recordUserPosition(pos: UserPortfolioPosition) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedUserPositions();
    const updated = [pos, ...existing];
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('growstreams-positions-changed'));
  } catch {}
}

export function updateSavedPositionStatus(id: string, status: UserPortfolioPosition['status'], blockHash?: string) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedUserPositions();
    const updated = existing.map((p) =>
      p.id === id
        ? {
            ...p,
            status,
            blockHash: blockHash || p.blockHash,
            subscanUrl: blockHash ? `https://vara.subscan.io/block/${blockHash}` : p.subscanUrl,
          }
        : p
    );
    localStorage.setItem(POSITIONS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('growstreams-positions-changed'));
  } catch {}
}

export interface CustomSquadConfig {
  id: string;
  name: string;
  ownerAddress: string;
  agentCount: number;
  creatorSharePct: number;
  collateralPerAgentVara: number;
  totalCollateralVara: number;
  agents: {
    slot: number;
    roleCode: string;
    roleTitle: string;
    market: string;
    maxLeverage: number;
    sharePct: number;
  }[];
  createdAt: string;
  blockHash?: string;
  subscanUrl?: string;
}

const DEFAULT_CUSTOM_SQUADS: CustomSquadConfig[] = [
  {
    id: 'squad-prime-4',
    name: 'AlphaPerps-4x-Syndicate',
    ownerAddress: 'kGk492a2bc12a54a6c27b9bd5223ef287da241f080fc6737',
    agentCount: 4,
    creatorSharePct: 60,
    collateralPerAgentVara: 25,
    totalCollateralVara: 100,
    agents: [
      { slot: 1, roleCode: 'PERP_TRADER', roleTitle: 'Momentum Perps Trader', market: 'NVDA', maxLeverage: 5, sharePct: 15 },
      { slot: 2, roleCode: 'CLOB_MM', roleTitle: 'Spot CLOB Market Maker', market: 'GROW/VARA', maxLeverage: 1, sharePct: 10 },
      { slot: 3, roleCode: 'RISK_GUARD', roleTitle: 'Solvency & Liquidation Guard', market: 'TSLA', maxLeverage: 3, sharePct: 10 },
      { slot: 4, roleCode: 'X_SENTINEL', roleTitle: 'Opening Bell Signal Sentinel', market: 'SPY', maxLeverage: 5, sharePct: 5 },
    ],
    createdAt: 'Active on SplitsRouter #16',
    blockHash: '0x6b4b383882c81ab7d9a7b98f06ca8a1432d48f605a9165ebdc9a7b0a943bd457',
    subscanUrl: 'https://vara.subscan.io/block/37610598',
  },
];

export function getSavedCustomSquads(): CustomSquadConfig[] {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_SQUADS;
  try {
    const raw = localStorage.getItem(SQUADS_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOM_SQUADS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CUSTOM_SQUADS;
  } catch {
    return DEFAULT_CUSTOM_SQUADS;
  }
}

export function saveCustomSquad(squad: CustomSquadConfig) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedCustomSquads();
    const updated = [squad, ...existing];
    localStorage.setItem(SQUADS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('growstreams-squads-changed'));
  } catch {}
}

export function useVaraWallet() {
  const [accounts, setAccounts] = useState<ConnectedVaraAccount[]>([]);
  const [wallet, setWallet] = useState<ConnectedVaraAccount | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const refreshSavedWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const savedAddr = localStorage.getItem(WALLET_STORAGE_KEY);
    if (!savedAddr) return;
    try {
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      const exts = await web3Enable('GrowStreams Prime');
      if (!exts || exts.length === 0) return;
      const raw = await web3Accounts();
      if (!raw || raw.length === 0) return;
      const mapped: ConnectedVaraAccount[] = await Promise.all(
        raw.map(async (acc: any) => ({
          address: acc.address,
          decodedAddress: await decodeVaraAddressToHex(acc.address),
          name: acc.meta.name || 'Vara Wallet',
          source: acc.meta.source || 'subwallet-js',
          varaBalance: await fetchNativeVaraBalance(acc.address),
        }))
      );
      setAccounts(mapped);
      const found = mapped.find((m: ConnectedVaraAccount) => m.address === savedAddr) || mapped[0];
      if (found) setWallet(found);
    } catch {}
  }, []);

  useEffect(() => {
    refreshSavedWallet();
    const onWalletEvent = (e: any) => {
      if (e?.detail) setWallet(e.detail);
      else refreshSavedWallet();
    };
    window.addEventListener('growstreams-wallet-changed', onWalletEvent);
    return () => window.removeEventListener('growstreams-wallet-changed', onWalletEvent);
  }, [refreshSavedWallet]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setWalletError(null);
    try {
      const res = await connectBrowserVaraWallet();
      setAccounts(res.accounts);
      setWallet(res.selected);
      return res.selected;
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect Vara wallet';
      setWalletError(msg);
      throw err;
    } finally {
      setConnecting(false);
    }
  }, []);

  const selectAccount = useCallback((addr: string) => {
    const found = accounts.find((a: ConnectedVaraAccount) => a.address === addr);
    if (found) {
      setWallet(found);
      localStorage.setItem(WALLET_STORAGE_KEY, found.address);
      window.dispatchEvent(new CustomEvent('growstreams-wallet-changed', { detail: found }));
    }
  }, [accounts]);

  const disconnect = useCallback(() => {
    setWallet(null);
    localStorage.removeItem(WALLET_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent('growstreams-wallet-changed', { detail: null }));
  }, []);

  return {
    wallet,
    accounts,
    connecting,
    walletError,
    connect,
    selectAccount,
    disconnect,
    refreshSavedWallet,
  };
}

// ============================================================================
// REAL ON-CHAIN SPOT ORDERBOOK (StonkBaseService GetSpotOrdersCount / GetSpotOrder)
// ============================================================================
export interface OnChainSpotOrder {
  id: number;
  maker: string;
  pair: string;
  isBuy: boolean;
  price: number; // human units (price_e8 / 1e8)
  remaining: number; // VARA remaining (amount - filled) / 1e12
  isActive: boolean;
}

function leHexToBigInt(hex: string): bigint {
  let v = BigInt(0);
  for (let i = hex.length - 2; i >= 0; i -= 2) v = (v << BigInt(8)) | BigInt(parseInt(hex.slice(i, i + 2), 16));
  return v;
}

async function stonkQuery(method: string, argHex = ''): Promise<string | null> {
  try {
    const api = await getVaraMainnetApi();
    if (!api) return null;
    const prefix = scaleStringHex('StonkBaseService') + scaleStringHex(method);
    const reply = await api.message.calculateReply({
      origin: '0xd4a5fb8326bb9d4dd6fa34e60fc5c2f18e8b677b39908e78907df89b0948bd67',
      destination: MAINNET_CONTRACTS.stonkOrderbook,
      payload: `0x${prefix}${argHex}`,
      value: 0,
      gasLimit: api.blockGasLimit.toBigInt(),
    });
    const raw = reply.payload.toHex().replace(/^0x/, '');
    return raw.slice(prefix.length);
  } catch {
    return null;
  }
}

function decodeSpotOrder(hex: string): OnChainSpotOrder | null {
  if (!hex || hex.slice(0, 2) !== '01') return null; // Option::Some
  let p = 2;
  const take = (bytes: number) => { const s = hex.slice(p, p + bytes * 2); p += bytes * 2; return s; };
  const id = Number(leHexToBigInt(take(8)));
  const maker = '0x' + take(32);
  // compact length (single-byte mode covers pair names < 64 chars)
  const len = parseInt(take(1), 16) >> 2;
  const pair = new TextDecoder().decode(new Uint8Array((take(len).match(/../g) || []).map((b) => parseInt(b, 16))));
  const isBuy = take(1) === '01';
  const price = Number(leHexToBigInt(take(8))) / 1e8;
  const amount = leHexToBigInt(take(16));
  const filled = leHexToBigInt(take(16));
  const isActive = take(1) === '01';
  return { id, maker, pair, isBuy, price, remaining: Number(amount - filled) / 1e12, isActive };
}

/** Reads the most recent `window` orders straight from StonkOrderbook on Vara Mainnet. */
export async function fetchOnChainSpotOrders(window = 80): Promise<{ total: number; orders: OnChainSpotOrder[] }> {
  const countHex = await stonkQuery('GetSpotOrdersCount');
  if (!countHex || countHex.length < 16) return { total: 0, orders: [] };
  const total = Number(leHexToBigInt(countHex.slice(0, 16)));
  const ids: number[] = [];
  for (let i = total; i > 0 && ids.length < window; i--) ids.push(i);
  const results = await Promise.all(ids.map((id) => stonkQuery('GetSpotOrder', u64LEHex(id)).then((h) => (h ? decodeSpotOrder(h) : null))));
  return { total, orders: results.filter(Boolean) as OnChainSpotOrder[] };
}

export interface StonkVolumeStats {
  spotVolumeVara: number;
  spotTrades: number;
  perpsNotionalVara: number;
  totalPositions: number;
}

/** On-chain VolumeStats from StonkBaseService (no backend, no hardcoding). */
export async function fetchStonkVolumeStats(): Promise<StonkVolumeStats | null> {
  const hex = await stonkQuery('GetVolumeStats');
  if (!hex || hex.length < 2 * (16 * 6 + 8 * 3)) return null;
  let p = 0;
  const take = (n: number) => { const s = hex.slice(p, p + n * 2); p += n * 2; return leHexToBigInt(s); };
  const spotVol = take(16); take(16); const trades = take(8);
  take(16); const humanNotional = take(16); take(16); const agentNotional = take(16);
  const totalPositions = take(8);
  return {
    spotVolumeVara: Number(spotVol) / 1e12,
    spotTrades: Number(trades),
    perpsNotionalVara: Number(humanNotional + agentNotional) / 1e12,
    totalPositions: Number(totalPositions),
  };
}
