import { GearApi } from "@gear-js/api";
import { SailsIdlParser } from "sails-js-parser";
import { Sails } from "sails-js";
import { decodeAddress } from "@polkadot/keyring";
import { u8aToHex } from "@polkadot/util";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Old vault addresses to check
const OLD_VAULTS = [
  "0x4f55feddfb9aaaea14a08f6b97c55f586529232fd3548b5e29838cb89ccf9a8d",
  "0x7e081c0f82e31e35d845d1932eb36c84bbbb50568eef3c209f7104fabb2c254b",
];

const USER = "kGgPxtKn3ckr9LzbQD8bgRu54tv5DxYRY5rMp3wpaTVY8S47u";
const ZERO_TOKEN = "0x" + "00".repeat(32);

async function main() {
  const api = await GearApi.create({ providerAddress: "wss://rpc.vara.network" });
  const parser = await SailsIdlParser.new();
  const idl = readFileSync(resolve(__dirname, "idl/token-vault.idl"), "utf-8");
  
  const userHex = u8aToHex(decodeAddress(USER));
  console.log("User:", userHex);
  
  for (const vaultId of OLD_VAULTS) {
    try {
      const sails = new Sails(parser);
      sails.parseIdl(idl);
      sails.setApi(api);
      sails.setProgramId(vaultId);
      
      const result = await sails.services.VaultService.queries.GetBalance.call(
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        {}, userHex, ZERO_TOKEN
      );
      console.log(`Vault ${vaultId.slice(0,10)}... VARA:`, JSON.stringify(result));
    } catch(e) {
      console.log(`Vault ${vaultId.slice(0,10)}... error:`, e.message);
    }
  }
  
  await api.disconnect();
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
