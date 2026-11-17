import { GearApi } from '@gear-js/api';

const TOKEN_VAULT_ID = '0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d';
const STREAM_CORE_ID = '0xa105fb9474d855c87076563480be6019c3b90ed81b038c38f53a066aefaa4937';

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

function skipStrings(buf, count) {
  let pos = 0;
  for (let i = 0; i < count; i++) {
    const len = buf[pos] >> 2;
    pos += 1 + len;
  }
  return buf.subarray(pos);
}

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  
  const sPayload = Buffer.concat([encodeString('StreamService'), encodeString('TotalStreams')]);
  const sRes = await api.programState.read({ programId: STREAM_CORE_ID, payload: sPayload });
  const sBuf = skipStrings(sRes.toU8a(), 2);
  let total = 0n;
  for(let i=0; i<8; i++) total += BigInt(sBuf[i]) << BigInt(8*i);
  console.log('Total Streams:', total.toString());
  
  process.exit(0);
}
main().catch(console.error);

