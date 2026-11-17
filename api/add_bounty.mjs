import { config } from 'dotenv';
config();
import { query } from './src/services/db.mjs';
async function createBounty() {
  await query(`INSERT INTO public.agent_bounties (id, title, description, reward_amount, status) 
               VALUES (gen_random_uuid(), 'Fix UI Bug', 'Fix the blockchain synchronization issue', 0.1, 'open')`);
  console.log('Created a new open bounty');
  process.exit(0);
}
createBounty();
