import { GearApi } from '@gear-js/api';

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
  
  try {
    const res = await api.programState.read({ programId: TOKEN_VAULT_ID, payload });
    console.log('TokenVault Success:', res.toHex());
  } catch(e) {
    console.error('TokenVault Error:', e.message);
  }
  
  process.exit(0);
}
main().catch(console.error);

