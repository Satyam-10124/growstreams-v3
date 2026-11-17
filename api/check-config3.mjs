import { connect, query } from "./src/sails-client.mjs";

async function main() {
  await connect();
  
  // Check the StreamCore config - specifically token_vault field
  const scConfig = await query("streamCore", "GetConfig");
  console.log("StreamCore Config:", JSON.stringify(scConfig, null, 2));
  
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
