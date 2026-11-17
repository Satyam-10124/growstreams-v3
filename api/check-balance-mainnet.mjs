import { GearApi, decodeAddress } from '@gear-js/api';

const TOKEN_VAULT_ID = '0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const payload = Buffer.concat([
    encodeString('VaultService'),
    encodeString('GetBalance'),
    decodeAddress('0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d'),
    decodeAddress('0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d')
  ]);
  
  try {
    const res = await api.programState.read({ programId: TOKEN_VAULT_ID, payload });
    console.log('GetBalance Success:', res.toHex());
  } catch(e) {
    console.error('GetBalance Error:', e.message);
  }
  
  process.exit(0);
}
main().catch(console.error);

