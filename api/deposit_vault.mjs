import { config } from 'dotenv';
config();
import { command, query, connect, getApi, getKeyring } from './src/sails-client.mjs';

async function main() {
  try {
    await connect();
    const gearApi = getApi();
    const keyring = getKeyring();
    const address = keyring.address;
    const { data: balance } = await gearApi.query.system.account(address);
    const free = balance.free.toBigInt();
    console.log(`Native balance of ${address}: ${free / 10n**12n} VARA`);
    
    const amountVara = 2;
    const amount = BigInt(amountVara) * 1000000000000n;
    if (free < amount + 2n * 10n**12n) {
      console.log(`Not enough VARA to deposit ${amountVara} VARA safely.`);
      process.exit(1);
    }
    
    console.log(`Depositing ${amountVara} VARA into the TokenVault...`);
    const result = await command('tokenVault', 'DepositNative', { _value: amount });
    console.log("Deposit successful:", result.blockHash);
    process.exit(0);
  } catch (err) {
    console.error("Failed to deposit:", err);
    process.exit(1);
  }
}
main();
