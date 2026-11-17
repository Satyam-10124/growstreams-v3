import { GearApi, decodeAddress } from '@gear-js/api';

const TOKEN_VAULT_ID = '0x63ea24ac6e58f67c69080ba96359f21c986beea879fd5812f5df22e7548240ef';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  
  // Read Config
  const payload = Buffer.concat([
    encodeString('VaultService'),
    encodeString('GetConfig')
  ]);
  
  try {
    const res = await api.programState.read({ programId: TOKEN_VAULT_ID, payload });
    console.log('Vault Config:', res.toHex());
  } catch(e) {
    console.error('Config error:', e.message);
  }
  
  // Read Balance of the user!
  // We don't know the exact user address, but wait, the user's address is what they use to deploy?
  // Let's just output the config hex first.
  process.exit(0);
}
main().catch(console.error);

