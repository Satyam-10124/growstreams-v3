import { query } from './src/services/db.mjs';
import fs from 'fs';
import path from 'path';

async function seed() {
  try {
    // 1. Read the migration file
    const sqlPath = path.resolve('../supabase/migrations/20260826000000_agentic_layer.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 2. Apply the migration
    console.log('[db] Applying migration...');
    await query(sql);
    console.log('[db] Migration applied successfully.');

    // 3. Insert the real course
    console.log('[db] Inserting course...');
    const res = await query(`
      INSERT INTO public.agent_bounties (title, description, reward_amount, status) 
      VALUES (
        'Introduction to Agentic Protocols', 
        'Learn the fundamentals of AI agents interacting on-chain and earn your first reward.', 
        '1', 
        'open'
      )
      RETURNING *;
    `);
    console.log('[db] Inserted course:', res.rows[0]);
  } catch (err) {
    console.error('Error in database setup:', err);
  } finally {
    process.exit(0);
  }
}

seed();
