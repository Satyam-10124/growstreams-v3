import { GearApi, decodeAddress } from '@gear-js/api';
import * as dotenv from 'dotenv';
dotenv.config();

const STREAM_CORE_ID = '0xe41989cff30cf0bede15039232dfe5a8f38e254eb359a90157e82d33bc69a208';
const USER_ADDRESS = '0x261d2c616d8e2eccb80f9402345cea44b784cd5826710b6d342f96c9e1e67908'; // User's wallet

function encodeString(str) {
  const len = str.length;
  const buf = Buffer.alloc(1 + len);
  buf.writeUInt8(len << 2, 0);
  buf.write(str, 1);
  return buf;
}

async function main() {
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  
  const receiverHex = '0x0000000000000000000000000000000000000000000000000000000000000002'; // Dummy receiver
  const tokenHex = '0x0000000000000000000000000000000000000000000000000000000000000000'; // VARA
  
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
      origin: USER_ADDRESS,
      payload,
      value: 0,
      gasLimit: 50_000_000_000,
    });
    
    if (result.code.isError) {
      console.log('CalculateReply Error:', result.code.toHuman());
      console.log('Error payload:', result.payload.toHuman());
    } else {
      console.log('Success! Reply:', result.payload.toHex());
      console.log('Success! Reply Human:', result.payload.toHuman());
    }
  } catch (err) {
    console.log('Caught panic:', err);
  }
  
  process.exit(0);
}
main().catch(console.error);
