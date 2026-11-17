import { GearApi, GearKeyring } from '@gear-js/api';
import { u8aToHex } from '@polkadot/util';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_VAULT_ID = '0x63ea24ac6e58f67c69080ba96359f21c986beea879fd5812f5df22e7548240ef';
const STREAM_CORE_ID = '0xe41989cff30cf0bede15039232dfe5a8f38e254eb359a90157e82d33bc69a208';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

async function main() {
  const seed = process.env.VARA_SEED;
  if (!seed) throw new Error('No VARA_SEED');
  
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const keyring = await GearKeyring.fromMnemonic(seed);
  const sourceHex = u8aToHex(keyring.addressRaw);
  console.log('Admin:', keyring.address);
  
  // 1. TokenVault -> SetStreamCore
  const streamCoreBuf = Buffer.from(STREAM_CORE_ID.slice(2), 'hex');
  const payload1 = Buffer.concat([
    encodeString('VaultService'),
    encodeString('SetStreamCore'),
    streamCoreBuf
  ]);
  
  console.log('Sending SetStreamCore to TokenVault...');
  let gas1 = await api.program.calculateGas.handle(sourceHex, TOKEN_VAULT_ID, payload1, 0, true);
  let limit1 = BigInt(gas1.min_limit.toString()) * 2n;
  
  await new Promise((res, rej) => {
    api.message.send({ destination: TOKEN_VAULT_ID, payload: payload1, gasLimit: limit1, value: 0 })
      .signAndSend(keyring, ({ status, events }) => {
        if (status.isInBlock) {
          const failed = events.find(e => api.events.system.ExtrinsicFailed.is(e.event));
          if (failed) rej('ExtrinsicFailed');
          else res();
        }
      });
  });
  console.log('SetStreamCore successful!');
  
  // 2. StreamCore -> SetTokenVault
  const vaultBuf = Buffer.from(TOKEN_VAULT_ID.slice(2), 'hex');
  const payload2 = Buffer.concat([
    encodeString('StreamService'),
    encodeString('SetTokenVault'),
    vaultBuf
  ]);
  
  console.log('Sending SetTokenVault to StreamCore...');
  let gas2 = await api.program.calculateGas.handle(sourceHex, STREAM_CORE_ID, payload2, 0, true);
  let limit2 = BigInt(gas2.min_limit.toString()) * 2n;
  
  await new Promise((res, rej) => {
    api.message.send({ destination: STREAM_CORE_ID, payload: payload2, gasLimit: limit2, value: 0 })
      .signAndSend(keyring, ({ status, events }) => {
        if (status.isInBlock) {
          const failed = events.find(e => api.events.system.ExtrinsicFailed.is(e.event));
          if (failed) rej('ExtrinsicFailed');
          else res();
        }
      });
  });
  console.log('SetTokenVault successful!');
  
  process.exit(0);
}
main().catch(console.error);

