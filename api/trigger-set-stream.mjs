import { GearApi, GearKeyring } from '@gear-js/api';
import { u8aToHex } from '@polkadot/util';
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
  const seed = process.env.VARA_SEED;
  const api = await GearApi.create({ providerAddress: 'wss://rpc.vara.network' });
  const keyring = await GearKeyring.fromMnemonic(seed);
  
  const streamCoreBuf = Buffer.from(STREAM_CORE_ID.slice(2), 'hex');
  const payload = Buffer.concat([
    encodeString('VaultService'),
    encodeString('SetStreamCore'),
    streamCoreBuf
  ]);
  
  const gas = await api.program.calculateGas.handle(u8aToHex(keyring.addressRaw), TOKEN_VAULT_ID, payload, 0, true);
  const limit = BigInt(gas.min_limit.toString()) * 2n;
  
  console.log('Sending SetStreamCore...');
  const tx = api.message.send({ destination: TOKEN_VAULT_ID, payload, gasLimit: limit, value: 0 });
  
  await new Promise((resolve) => {
    tx.signAndSend(keyring, ({ status, events }) => {
      if (status.isInBlock) {
        console.log('In block:', status.asInBlock.toHex());
      }
    });
    
    api.query.system.events((events) => {
      events.forEach((record) => {
        const { event } = record;
        if (event.section === 'gear' && event.method === 'MessageQueued') {
           console.log('MessageQueued:', event.data[0].toHex());
        }
        if (event.section === 'gear' && (event.method === 'MessageDispatched' || event.method === 'UserMessageSent')) {
           console.log('Event:', event.method, event.data.toHuman());
        }
      });
    });
  });
}
main().catch(console.error);

