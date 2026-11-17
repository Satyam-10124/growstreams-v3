import { getApi, query } from './api/src/sails-client.mjs';
async function main() {
  await getApi();
  try {
    const total = await query('streamCore', 'TotalStreams', []);
    console.log('Total streams on new contract:', total);
  } catch(e) { console.error(e); }
  process.exit(0);
}
main();
