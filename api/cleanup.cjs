const { Client } = require('pg');
const client = new Client('postgresql://postgres:JJkrrCeNxQssiXnkbnfGnCGPQMtyZaoY@caboose.proxy.rlwy.net:58044/railway');

async function run() {
  await client.connect();
  
  // Keep only ONE "Fix UI Bug" bounty, delete the rest
  const fixBugBounties = await client.query(`SELECT id FROM agent_bounties WHERE title = 'Fix UI Bug' ORDER BY created_at ASC`);
  console.log(`Found ${fixBugBounties.rows.length} Fix UI Bug bounties`);
  
  if (fixBugBounties.rows.length > 1) {
    const toDelete = fixBugBounties.rows.slice(1).map(r => r.id); // keep first, delete rest
    await client.query(`DELETE FROM bounty_claims WHERE bounty_id = ANY($1::uuid[])`, [toDelete]);
    await client.query(`DELETE FROM agent_bounties WHERE id = ANY($1::uuid[])`, [toDelete]);
    console.log(`Deleted ${toDelete.length} duplicate Fix UI Bug bounties`);
  }
  
  // Check bounty_claims table exists
  const tableCheck = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bounty_claims') as exists`);
  console.log('bounty_claims table exists:', tableCheck.rows[0].exists);
  
  // Final state
  const final = await client.query(`SELECT id, title, status FROM agent_bounties ORDER BY created_at DESC`);
  console.log('\nFinal bounties in DB:');
  console.table(final.rows);
  
  await client.end();
}
run().catch(console.error);
