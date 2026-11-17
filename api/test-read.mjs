import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres:JJkrrCeNxQssiXnkbnfGnCGPQMtyZaoY@caboose.proxy.rlwy.net:58044/railway' });
async function main() {
  const res = await pool.query('SELECT * FROM streams ORDER BY stream_id DESC');
  console.log('Streams in DB:', res.rows);
  process.exit(0);
}
main();
