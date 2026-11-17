import { connect, query, contracts } from './src/sails-client.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

const OLD_VAULT = '0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d';

async function main() {
  await connect();
  try {
    const payload = contracts['tokenVault'].services['VaultService'].functions['GetConfig'].encodePayload();
    const { getApi } = await import('./src/sails-client.mjs');
    const api = getApi();
    const res = await api.programState.read({ programId: OLD_VAULT, payload });
    const decoded = contracts['tokenVault'].services['VaultService'].functions['GetConfig'].decodeResult(res.toU8a());
    console.log('Old Vault Config:', decoded);
  } catch(e) { console.error('Vault error:', e.message); }
  
  process.exit(0);
}
main();
