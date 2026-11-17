import { connect, query, getApi } from "./src/sails-client.mjs";
import { SailsIdlParser } from "sails-js-parser";
import { Sails } from "sails-js";
import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const OLD_VAULTS = [
  "0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d",
  "0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b",
];

const USER_SS58 = "kGgPxtKn3ckr9LzbQD8bgRu54tv5DxYRY5rMp3wpaTVY8S47u";
const ZERO_TOKEN = "0x" + "00".repeat(32);

async function main() {
  await connect();
  const api = getApi();
  const userHex = u8aToHex(decodeAddress(USER_SS58));
  console.log("User hex:", userHex);

  const parser = await SailsIdlParser.new();
  // Use OLD token-vault IDL (3 fields only)
  const idl = readFileSync(resolve(__dirname, "idl/token-vault.idl"), "utf-8");

  for (const vaultId of OLD_VAULTS) {
    try {
      const sails = new Sails(parser);
      sails.parseIdl(idl);
      sails.setApi(api);
      sails.setProgramId(vaultId);

      const payload = sails.services.VaultService.queries.GetBalance.encodePayload(userHex, ZERO_TOKEN);
      const res = await api.programState.read({ programId: vaultId, payload });
      const decoded = sails.services.VaultService.queries.GetBalance.decodeResult(res.toU8a());
      console.log(`Vault ${vaultId.slice(0,12)}:`, JSON.stringify(decoded));
    } catch(e) {
      console.log(`Vault ${vaultId.slice(0,12)} error:`, e.message.slice(0, 120));
    }
  }

  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
