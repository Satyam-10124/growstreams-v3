import { config } from 'dotenv';
config();
import { query } from './src/services/db.mjs';

async function fix() {
  await query(`DELETE FROM public.bounty_claims`);
  await query(`UPDATE public.agent_bounties SET status = 'open'`);
  console.log('Fixed bounties');
  process.exit(0);
}

fix();

