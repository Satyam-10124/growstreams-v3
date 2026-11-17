import { GearApi } from '@gear-js/api';

const STREAM_CORE_ID = '0xa105fb9474d855c87076563480be6019c3b90ed81b038c38f53a066aefaa4937';

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  
  try {
    const res = await api.programState.read({ programId: STREAM_CORE_ID });
    console.log('Legacy State Read Success!');
  } catch(e) {
    console.error('Legacy State Error:', e.message);
  }
  
  process.exit(0);
}
main().catch(console.error);

