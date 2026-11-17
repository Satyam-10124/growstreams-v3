import { GearApi } from '@gear-js/api';

const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
const scId = '0x8298c2eea5c6bbe55a9cfe72283b5399098fd6a54d9a2a14c2bedba8eea50659';
const gvId = '0x04314af41b7dbac322e3e66920211d2f799719e1cdc3122a99752f72b6ae84ee';

const scProg = await api.query.gearProgram.programStorage(scId);
const gvProg = await api.query.gearProgram.programStorage(gvId);

console.log('StreamCore programStorage:', JSON.stringify(scProg.toHuman(), null, 2));
console.log('gVARA programStorage:', JSON.stringify(gvProg.toHuman(), null, 2));

await api.disconnect();
process.exit(0);
