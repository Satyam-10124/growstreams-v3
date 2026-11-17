import { GearApi } from '@gear-js/api';
import { Keyring } from '@polkadot/api';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_VAULT_ID = '0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d';
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
  const keyring = new Keyring({ type: 'sr25519' });
  const seed = process.env.VARA_SEED;
  if (!seed) throw new Error('No VARA_SEED in .env');
  const account = keyring.addFromUri(seed);
  
  console.log('Testing CreateStream from account:', account.address);
  
  const receiverHex = '0x0000000000000000000000000000000000000000000000000000000000000002';
  const tokenHex = '0x0000000000000000000000000000000000000000000000000000000000000000';
  
  const receiver = Buffer.from(receiverHex.slice(2), 'hex');
  const token = Buffer.from(tokenHex.slice(2), 'hex');
  
  const encodeU128LE = (n) => {
    const b = Buffer.alloc(16);
    b.writeBigUInt64LE(BigInt(n) & 0xffffffffffffffffn, 0);
    b.writeBigUInt64LE(BigInt(n) >> 64n, 8);
    return b;
  };
  
  const payload = Buffer.concat([
    encodeString('StreamService'),
    encodeString('CreateStream'),
    receiver,
    token,
    encodeU128LE(1000), // flowRate
    encodeU128LE(10000000000000) // initialDeposit (10 VARA)
  ]);
  
  try {
    const result = await api.program.calculateReply({
      destination: STREAM_CORE_ID,
      origin: account.address,
      payload,
      value: 0,
      gasLimit: 50_000_000_000,
    });
    
    if (result.code.isError) {
      console.log('CalculateReply Error:', result.code.toHuman());
      console.log('Error payload:', result.payload.toHuman());
    } else {
      console.log('Success! Reply:', result.payload.toHuman());
    }
  } catch (err) {
    console.log('Caught panic:', err);
  }
  
  process.exit(0);
}
main().catch(console.error);

