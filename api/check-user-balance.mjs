import { connect, query } from "./src/sails-client.mjs";

// Change this to the user wallet address you see in the UI
const USER_HEX = process.argv[2] || "0x0a011ddd3fdf3fa4a1f621c1bd65762a5c34bc442b962cf7adf717ab32255d4e";
const ZERO_TOKEN = "0x0000000000000000000000000000000000000000000000000000000000000000";

async function main() {
  await connect();
  
  // Check balance for VARA (zero token)
  try {
    const varaBal = await query("tokenVault", "GetBalance", USER_HEX, ZERO_TOKEN);
    console.log("Vault VARA balance:", JSON.stringify(varaBal, null, 2));
  } catch(e) { console.error("GetBalance error:", e.message); }

  // Check vault config
  try {
    const cfg = await query("tokenVault", "GetConfig");
    console.log("Vault Config:", JSON.stringify(cfg, null, 2));
  } catch(e) { console.error("GetConfig error:", e.message); }
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
