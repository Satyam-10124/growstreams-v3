import { GearApi } from '@gear-js/api';
import { encodePayload } from './src/services/sails-client.mjs';

const STREAM_CORE_ID = '0xe41989cff30cf0bede15039232dfe5a8f38e254eb359a90157e82d33bc69a208';
const RECEIVER = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';

async function run() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const ZERO_TOKEN = '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  // flowRate = 0.001 * 10^12 = 1_000_000_000
  // deposit = 15 * 10^12 = 15_000_000_000_000
  const payload = encodePayload('stream-core', 'CreateStream', RECEIVER, ZERO_TOKEN, 1000000000n, 15000000000000n);
  
  try {
    const gas = await api.program.calculateGas.handle(
      '0xe3beaf004bfde7df7f73db918c5e7b2ee93c8d50451ff76abfe4e7156942087c',
      STREAM_CORE_ID,
      payload,
      0,
      true
    );
    console.log("Gas calculation succeeded!", gas.toHuman());
  } catch (err) {
    console.log("Gas calculation failed:", err.message);
  }
  process.exit(0);
}
run();
