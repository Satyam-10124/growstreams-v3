import { GearApi } from '@gear-js/api';

const STREAM_CORE_ID = '0xa105fb9474d855c87076563480be6019c3b90ed81b038c38f53a066aefaa4937';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const payload = Buffer.concat([
    encodeString('StreamService'),
    encodeString('GetConfig')
  ]);
  
  try {
    const res = await api.programState.read({ programId: STREAM_CORE_ID, payload });
    console.log('GetConfig Success:', res.toHex());
  } catch(e) {
    console.error('GetConfig Error:', e.message);
  }
  
  process.exit(0);
}
main().catch(console.error);

