import { connect, query } from './src/sails-client.mjs';
async function main() {
  await connect();
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
