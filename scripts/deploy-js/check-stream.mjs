import { GearApi } from '@gear-js/api';
import { Keyring } from '@polkadot/api';
import fs from 'fs';
import { skipStrings, queryState, buildPayload } from './utils.mjs';

const state = JSON.parse(fs.readFileSync('./deploy-state.json'));
const STREAM_CORE_ID = state['stream-core'];

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const keyring = new Keyring({ type: 'sr25519' });
  
  // We can just query without keyring if we want, but queryState requires it in utils.
  // Use Alice just for query
  const alice = keyring.addFromUri('//Alice');
  
  const payload = buildPayload('StreamService', 'TotalStreams');
  const reply = await queryState(api, alice, STREAM_CORE_ID, payload);
  
  const buf = skipStrings(reply, 2);
  const totalStreams = buf.readBigUInt64LE(0);
  console.log('Total Streams on chain:', totalStreams.toString());
  
  process.exit(0);
}
main().catch(console.error);

