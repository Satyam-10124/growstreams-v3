import { GearApi } from '@gear-js/api';
async function run() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  console.log("Max gas:", api.blockGasLimit.toHuman());
  process.exit(0);
}
run();
