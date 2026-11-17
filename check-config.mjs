import { getApi, query } from './api/src/sails-client.mjs';
async function main() {
  await getApi();
  try {
    const vaultConfig = await query('tokenVault', 'GetConfig', []);
    console.log('Vault Config:', vaultConfig);
  } catch(e) { console.error(e); }
  
  try {
    const streamConfig = await query('streamCore', 'GetConfig', []);
    console.log('Stream Config:', streamConfig);
  } catch(e) { console.error(e); }
  
  process.exit(0);
}
main();
