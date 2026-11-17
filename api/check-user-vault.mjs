import { connect, query } from "./src/sails-client.mjs";
import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";

const SS58 = "kGgPxtKn3ckr9LzbQD8bgRu54tv5DxYRY5rMp3wpaTVY8S47u";
const ZERO_TOKEN = "0x0000000000000000000000000000000000000000000000000000000000000000";
const GROW_TOKEN = "0x728d04df91561c66938053a4f5178f749da004ebd219ca05f7c090609a6f7163";

async function main() {
  await connect();
  
  const hex = u8aToHex(decodeAddress(SS58));
  console.log("User hex:", hex);

  const varaBal = await query("tokenVault", "GetBalance", hex, ZERO_TOKEN);
  console.log("VARA Balance:", JSON.stringify(varaBal, null, 2));

  const growBal = await query("tokenVault", "GetBalance", hex, GROW_TOKEN);
  console.log("GROW Balance:", JSON.stringify(growBal, null, 2));
  
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
