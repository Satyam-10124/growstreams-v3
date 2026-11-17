/**
 * link-vault.mjs
 *
 * Signs and sends the set_stream_core transaction on the TokenVault
 * so it trusts the current StreamCore (0xba09...).
 *
 * Usage:
 *   node scripts/link-vault.mjs <ADMIN_SEED_PHRASE_OR_SURI>
 *
 * Example with mnemonic:
 *   node scripts/link-vault.mjs "word1 word2 ... word12"
 *
 * Example with raw secret URI:
 *   node scripts/link-vault.mjs "//Alice"
 */

import { GearApi, GearKeyring } from '@gear-js/api';

// ── Contract addresses ─────────────────────────────────────────────────────
const TOKEN_VAULT_ID  = '0x657cf9c4f929aeac97092037826c1117f9e6cd0e3c4edc44e49decc17b840aa9';
const STREAM_CORE_ID  = '0xba0901f3ef665e956d8ab721686d97d2e5473092df34baf229e87ac826eadc4a';
const VARA_NODE       = 'wss://rpc.vara.network';
const API_BASE        = 'https://growstreams-api-v3-production.up.railway.app';

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const seed = process.argv[2];
  if (!seed) {
    console.error('Usage: node scripts/link-vault.mjs "<seed phrase or //suri>"');
    process.exit(1);
  }

  console.log('Connecting to Vara network...');
  const api = await GearApi.create({ providerAddress: VARA_NODE });
  console.log('Connected.');

  // Load admin keyring
  let keyring;
  try {
    keyring = await GearKeyring.fromMnemonic(seed);
  } catch {
    keyring = await GearKeyring.fromSuri(seed);
  }
  console.log(`Admin address: ${keyring.address}`);

  // Fetch the SCALE-encoded payload from the backend
  console.log('\nFetching payload from API...');
  const res = await fetch(`${API_BASE}/api/vault/set-stream-core`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ streamCore: STREAM_CORE_ID, mode: 'payload' }),
  });
  const { payload, error } = await res.json();
  if (error) {
    console.error('API error:', error);
    process.exit(1);
  }
  console.log('Payload received:', payload.slice(0, 40) + '...');

  // Calculate gas
  console.log('\nCalculating gas...');
  const gas = await api.program.calculateGas.handle(
    keyring.address,
    TOKEN_VAULT_ID,
    payload,
    0,
    true,
  );
  const gasLimit = (BigInt(gas.min_limit.toString()) * BigInt(12) / BigInt(10)).toString();
  console.log(`Gas: min=${gas.min_limit}, using=${gasLimit}`);

  // Sign and send
  console.log('\nSending transaction...');
  await new Promise((resolve, reject) => {
    api.message.send({
      destination: TOKEN_VAULT_ID,
      payload,
      gasLimit,
      value: 0,
    }).signAndSend(keyring, ({ status, events }) => {
      if (status.isInBlock) {
        const failed = events?.find(e => api.events.system.ExtrinsicFailed.is(e.event));
        if (failed) {
          reject(new Error('Transaction failed on-chain: ' + JSON.stringify(failed.toHuman())));
        } else {
          console.log(`\n✅ SUCCESS! Included in block: ${status.asInBlock.toHex()}`);
          console.log(`\nTokenVault now trusts StreamCore: ${STREAM_CORE_ID}`);
          console.log('Streams should now work correctly.');
          resolve();
        }
      } else if (status.isFinalized) {
        console.log(`Finalized: ${status.asFinalized.toHex()}`);
        resolve();
      } else if (status.isInvalid) {
        reject(new Error('Transaction invalid'));
      } else {
        process.stdout.write(`Status: ${status.type}...\r`);
      }
    }).catch(reject);
  });

  await api.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
