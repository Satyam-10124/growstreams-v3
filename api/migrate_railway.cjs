const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:JJkrrCeNxQssiXnkbnfGnCGPQMtyZaoY@caboose.proxy.rlwy.net:58044/railway'
});

async function run() {
  await client.connect();
  console.log('Connected to Railway DB');

  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE TABLE IF NOT EXISTS bounty_comments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      bounty_id UUID NOT NULL,
      author TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS bounty_submissions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      bounty_id UUID NOT NULL,
      wallet_address TEXT NOT NULL,
      submission_url TEXT NOT NULL,
      status TEXT DEFAULT 'Pending',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('Tables created successfully');
  await client.end();
}
run().catch(console.error);
