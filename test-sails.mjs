import { initSails, query } from './api/src/sails-client.mjs';

async function main() {
  await initSails();
  console.log('Testing TokenVault GetConfig...');
  try {
    const vaultConfig = await query('tokenVault', 'GetConfig', []);
    console.log('TokenVault Config:', vaultConfig);
  } catch (err) {
    console.error('Vault error:', err);
  }
  
  console.log('\nTesting StreamCore TotalStreams...');
  try {
    const total = await query('streamCore', 'TotalStreams', []);
    console.log('TotalStreams:', total);
  } catch (err) {
    console.error('StreamCore error:', err);
  }
  
  process.exit(0);
}
main();

