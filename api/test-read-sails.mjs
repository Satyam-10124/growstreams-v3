import { GearApi } from '@gear-js/api';
import { u8aToHex } from '@polkadot/util';

const TOKEN_VAULT_ID = '0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

function skipStrings(buf, count) {
  let pos = 0;
  for (let i = 0; i < count; i++) {
    const len = buf[pos] >> 2;
    pos += 1 + len;
  }
  return buf.subarray(pos);
}

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const payload = Buffer.concat([
    encodeString('VaultService'),
    encodeString('GetConfig')
  ]);
  
  const res = await api.programState.read({ programId: TOKEN_VAULT_ID, payload });
  const raw = res.toU8a();
  const buf = skipStrings(raw, 2);
  
  const admin = '0x' + Buffer.from(buf.subarray(0, 32)).toString('hex');
  const streamCore = '0x' + Buffer.from(buf.subarray(32, 64)).toString('hex');
  const paused = buf[64];
  console.log('TokenVault Config:');
  console.log('Admin:', admin);
  console.log('StreamCore:', streamCore);
  console.log('Paused:', paused);
  
  process.exit(0);
}
main().catch(console.error);

