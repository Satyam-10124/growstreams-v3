import { connect, query, contracts } from './src/sails-client.mjs';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_VAULT_ID = '0x63ea24ac6e58f67c69080ba96359f21c986beea879fd5812f5df22e7548240ef';
const STREAM_CORE_ID = '0xe41989cff30cf0bede15039232dfe5a8f38e254eb359a90157e82d33bc69a208';

async function main() {
  await connect();
  
  // Override the programIds temporarily
  contracts['tokenVault'].programId = TOKEN_VAULT_ID;
  contracts['streamCore'].programId = STREAM_CORE_ID;
  
  try {
    const vaultConfig = await query('tokenVault', 'GetConfig', []);
    console.log('Vault Config:', vaultConfig);
  } catch(e) { console.error('Vault error:', e.message); }
  
  try {
    const streamConfig = await query('streamCore', 'GetConfig', []);
    console.log('Stream Config:', streamConfig);
  } catch(e) { console.error('Stream error:', e.message); }
  
  process.exit(0);
}
main();
