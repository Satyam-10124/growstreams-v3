/**
 * Deploy StonkBase × GrowStreams Spot CLOB Orderbook DEX & 5x RWA Perps Desk on Vara Mainnet
 * ==========================================================================================
 * Uploads `stonkbase_vara_desk.opt.wasm` and instantiates two dedicated Sails programs:
 *   1. `stonkbase-orderbook`: On-chain Spot CLOB Orderbook DEX (`PlaceSpotOrder`, `FillSpotOrder`, `GetSpotTrade`)
 *   2. `stonkbase-vara-desk`: On-chain 1x–5x Leveraged RWA Perpetuals Desk (`OpenStockPosition`, `CloseStockPosition`, `GetPosition`)
 */

import { GearApi, GearKeyring, generateCodeHash } from '@gear-js/api';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
config({ path: resolve(PROJECT_ROOT, '.env') });
config({ path: resolve(__dirname, '.env') });

const VARA_SEED = process.env.VARA_SEED;
const VARA_NODE = process.env.VARA_NODE || 'wss://rpc.vara.network';

const GVARA_V3 = '0x086c7257f39302f9346ed8b7d2839ef1c728fc04997b6056581c0b3f396710ee';
const TOKEN_VAULT = '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9';
const SPLITS_ROUTER = '0x68b9fd8f53f6557db2c26b5b9a7c63061bb7f36d379dc843b8a53e78f5692f45';

const IDL_PATH = resolve(PROJECT_ROOT, 'api/idl/stonkbase-vara-desk.idl');
const WASM_CANDIDATES = [
  resolve(PROJECT_ROOT, 'agents/contracts/stonkbase-vara-desk/target/wasm-projects/release/wasm32-unknown-unknown/release/stonkbase_vara_desk.opt.wasm'),
  resolve(PROJECT_ROOT, 'agents/contracts/stonkbase-vara-desk/target/wasm32-gear/release/stonkbase_vara_desk.opt.wasm'),
  resolve(PROJECT_ROOT, 'agents/contracts/stonkbase-vara-desk/target/wasm32-unknown-unknown/release/stonkbase_vara_desk.opt.wasm'),
  resolve(PROJECT_ROOT, 'contracts/target/wasm32-gear/release/stonkbase_vara_desk.opt.wasm'),
];

const FIXED_GAS = 120_000_000_000n;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wasmPath = WASM_CANDIDATES.find((p) => existsSync(p));
if (!wasmPath) {
  throw new Error(`Compiled WASM not found in any candidate path: ${WASM_CANDIDATES.join(', ')}`);
}
const code = readFileSync(wasmPath);
console.log(`📦 Loaded compiled WASM (${code.length} bytes): ${wasmPath}`);

const api = await GearApi.create({ providerAddress: VARA_NODE });
let keyring;
try {
  keyring = await GearKeyring.fromMnemonic(VARA_SEED);
} catch {
  keyring = await GearKeyring.fromSuri(VARA_SEED);
}
const adminHex = '0x' + Buffer.from(keyring.publicKey).toString('hex');
const { data } = await api.query.system.account(keyring.address);
const balance = Number(BigInt(data.free.toString())) / 1e12;

console.log('================================================================================');
console.log('🚀 DEPLOYING STONKBASE SPOT CLOB ORDERBOOK & 5X RWA PERPS DESK TO VARA MAINNET');
console.log(`🏦 Admin Account: ${keyring.address} (${adminHex})`);
console.log(`💰 Available VARA: ${balance.toFixed(4)} VARA`);
console.log('================================================================================');

const parser = await SailsIdlParser.new();
const idlText = readFileSync(IDL_PATH, 'utf8');

async function deployInstance(label, useCodeUpload = false, existingCodeId = null) {
  console.log(`\n── Deploying ${label} ──`);
  const sails = new Sails(parser);
  sails.parseIdl(idlText);
  sails.setApi(api);

  const ctorArgs = [adminHex, GVARA_V3, TOKEN_VAULT, SPLITS_ROUTER];
  let tx;
  if (useCodeUpload || !existingCodeId) {
    tx = sails.ctors['New']
      .fromCode(code, ...ctorArgs)
      .withAccount(keyring, { disableClientAuth: true })
      .withGas(FIXED_GAS);
  } else {
    tx = sails.ctors['New']
      .fromCodeId(existingCodeId, ...ctorArgs)
      .withAccount(keyring, { disableClientAuth: true })
      .withGas(FIXED_GAS);
  }

  console.log(`   Program ID: ${tx.programId}`);
  const { blockHash, programId, isFinalized } = await tx.signAndSend();
  console.log(`   In block:   ${blockHash}`);
  await isFinalized;
  const finalId = programId ?? tx.programId;
  console.log(`   ✅ ${label} live at: ${finalId}`);
  return finalId;
}

const orderbookId = '0x2c1dd07810480a34b7369fbf0ff0c97651c6db1f26ffc5eaff6490d6b20263cf';
console.log(`✅ Using deployed StonkBase Spot CLOB Orderbook DEX: ${orderbookId}`);

// Compute codeId from uploaded code
const codeId = generateCodeHash(code);
console.log(`🔑 Uploaded Code ID: ${codeId}`);

const perpsDeskId = await deployInstance('StonkBase 5x RWA Perps Desk (stonkbase-vara-desk)', false, codeId);
await sleep(4000);

// Seed initial Oracle prices on both contracts
const TICKERS = ['NVDA', 'AAPL', 'TSLA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'SPY', 'QQQ', 'WVARA/USDC', 'GROW/VARA'];
const PRICES_E8 = [
  14250000000n,
  22840000000n,
  25480000000n,
  42615000000n,
  21030000000n,
  59275000000n,
  18190000000n,
  59820000000n,
  51260000000n,
  43600n,
  100000000n,
];
const CONFIDENCES = TICKERS.map(() => 98);

for (const [label, progId] of [
  ['stonkbase-orderbook', orderbookId],
  ['stonkbase-vara-desk', perpsDeskId],
]) {
  console.log(`\n── Seeding 24/7 Bounded Oracle Feeds on ${label} (${progId.slice(0, 14)}...) ──`);
  const sails = new Sails(parser);
  sails.parseIdl(idlText);
  sails.setApi(api);
  sails.setProgramId(progId);
  const fn = sails.services['StonkBaseService'].functions['PushOraclePrices'];
  const tx = fn(
    TICKERS,
    PRICES_E8.map((x) => x.toString()),
    CONFIDENCES
  )
    .withAccount(keyring, { disableClientAuth: true })
    .withGas(50_000_000_000n);
  const { blockHash, isFinalized } = await tx.signAndSend();
  await isFinalized;
  console.log(`   ✅ Seeded Oracle Feeds in block ${blockHash}`);
}

const nowIso = new Date().toISOString();
for (const statePath of [resolve(PROJECT_ROOT, 'deploy-state.json'), resolve(__dirname, 'deploy-state.json')]) {
  if (!existsSync(statePath)) continue;
  const st = JSON.parse(readFileSync(statePath, 'utf8'));
  st['stonkbase-orderbook'] = {
    programId: orderbookId,
    codeId,
    deployedAt: nowIso,
    network: 'vara-mainnet',
    node: 'wss://rpc.vara.network',
    admin: adminHex,
    note: 'On-chain Spot CLOB Orderbook DEX (PlaceSpotOrder, FillSpotOrder, GetSpotTrade)',
  };
  st['stonkbase-vara-desk'] = {
    programId: perpsDeskId,
    codeId,
    deployedAt: nowIso,
    network: 'vara-mainnet',
    node: 'wss://rpc.vara.network',
    admin: adminHex,
    note: 'On-chain 1x-5x Leveraged RWA Perpetuals & Stock Desk (OpenStockPosition, CloseStockPosition)',
  };
  writeFileSync(statePath, JSON.stringify(st, null, 2) + '\n');
  console.log(`💾 Updated ${statePath}`);
}

await api.disconnect();
console.log('\n🎉 DEPLOYMENT COMPLETE!');
console.log(`   • stonkbase-orderbook: ${orderbookId}`);
console.log(`   • stonkbase-vara-desk: ${perpsDeskId}`);
process.exit(0);
