import { GearApi, GearKeyring } from '@gear-js/api';
import { u8aToHex } from '@polkadot/util';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_VAULT_ID = '0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

function encodeU128(val) {
  const buf = Buffer.alloc(16);
  buf.writeBigUInt64LE(BigInt(val) & 0xffffffffffffffffn, 0);
  buf.writeBigUInt64LE(BigInt(val) >> 64n, 8);
  return buf;
}

async function main() {
  const seed = process.env.VARA_SEED;
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const keyring = await GearKeyring.fromMnemonic(seed);
  
  // (from: actor_id, token: actor_id, amount: u128, treasury: actor_id)
  const emptyActor = Buffer.alloc(32);
  const payload = Buffer.concat([
    encodeString('VaultService'),
    encodeString('CollectFee'),
    emptyActor,
    emptyActor,
    encodeU128(0),
    emptyActor
  ]);
  
  console.log('Calculating gas for CollectFee...');
  try {
    const gas = await api.program.calculateGas.handle(u8aToHex(keyring.addressRaw), TOKEN_VAULT_ID, payload, 0, true);
    console.log('Gas required:', gas.min_limit.toString());
  } catch (err) {
    console.error('Gas calculation failed!', err.message);
  }
  process.exit(0);
}
main().catch(console.error);

