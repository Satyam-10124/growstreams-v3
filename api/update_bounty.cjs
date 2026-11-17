const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.query("UPDATE public.agent_bounties SET reward_amount = 1 WHERE title = 'Introduction to Agentic Protocols'", (err, res) => {
  if (err) console.error(err);
  else console.log('Updated', res.rowCount, 'rows');
  pool.end();
});
