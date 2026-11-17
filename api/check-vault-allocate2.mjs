import { GearApi, decodeAddress } from '@gear-js/api';
import * as dotenv from 'dotenv';
dotenv.config();

const TOKEN_VAULT_ID = '0x63ea24ac6e58f67c69080ba96359f21c986beea879fd5812f5df22e7548240ef';
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
  
  const tokenHex = '0x0000000000000000000000000000000000000000000000000000000000000000'; // VARA
  
  const owner = Buffer.from(USER_ADDRESS.slice(2), 'hex');
  const token = Buffer.from(tokenHex.slice(2), 'hex');
  
  const encodeU128LE = (n) => {
    const b = Buffer.alloc(16);
    b.writeBigUInt64LE(BigInt(n) & 0xffffffffffffffffn, 0);
    b.writeBigUInt64LE(BigInt(n) >> 64n, 8);
    return b;
  };
  
  const encodeU64LE = (n) => {
    const b = Buffer.alloc(8);
    b.writeBigUInt64LE(BigInt(n), 0);
    return b;
  };

  const payload = Buffer.concat([
    encodeString('VaultService'),
    encodeString('AllocateToStream'),
    owner,
    token,
    encodeU128LE(10000000000000), // amount (10 VARA)
    encodeU64LE(1) // stream_id
  ]);
  
  try {
    const result = await api.message.calculateReply({
      destination: TOKEN_VAULT_ID,
      origin: STREAM_CORE_ID,
      payload,
      value: 0,
      gasLimit: 50_000_000_000,
    });
    
    if (result.code.isError) {
      console.log('CalculateReply Error:', result.code.toHuman());
      console.log('Error payload:', result.payload.toHuman());
    } else {
      console.log('Success! Reply:', result.payload.toHex());
      console.log('Success! Reply Human:', result.payload.toHuman()); console.log('Gas Consumed:', result.toHuman());
    }
  } catch (err) {
    console.log('Caught panic:', err);
  }
  
  process.exit(0);
}
main().catch(console.error);
