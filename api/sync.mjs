import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:JJkrrCeNxQssiXnkbnfGnCGPQMtyZaoY@caboose.proxy.rlwy.net:58044/railway'
});

async function main() {
  // query 
  const res = await pool.query('SELECT * FROM streams ORDER BY started_at DESC LIMIT 5');
  console.log('DB STREAMS:', res.rows);
  
  // also check stream id
  const max = await pool.query('SELECT MAX(stream_id) as max_id FROM streams');
  console.log('MAX ID:', max.rows);
  
  process.exit(0);
}
main().catch(console.error);

