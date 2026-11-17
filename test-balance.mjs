import { initSails, query } from './api/src/sails-client.mjs';
async function main() {
  await initSails();
  try {
    const config = await query('tokenVault', 'GetConfig', []);
    console.log('Vault Config:', config);
    // Is there a GetBalance method? Let's check IDL!
  } catch(e) { console.error(e); }
  process.exit(0);
}
main();
