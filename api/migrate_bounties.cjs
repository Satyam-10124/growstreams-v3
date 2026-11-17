const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:JJkrrCeNxQssiXnkbnfGnCGPQMtyZaoY@caboose.proxy.rlwy.net:58044/railway'
});

async function run() {
  await client.connect();
  console.log('Connected to Railway DB');

  // Drop old bounties table and recreate it
  await client.query(`DROP TABLE IF EXISTS bounties CASCADE;`);

  await client.query(`
    CREATE TABLE bounties (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      slug TEXT UNIQUE,
      title TEXT,
      org_name TEXT,
      logo_url TEXT,
      track TEXT,
      short_desc TEXT,
      prize_pool INTEGER,
      end_date TIMESTAMPTZ,
      status TEXT,
      deliverables JSONB,
      requirements JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  
  // Insert the 3 dummy bounties
  const bounties = [
    {
      id: '55a46cea-874c-4156-81e4-b791336e14be',
      slug: 'cineflicks-beta-launch',
      title: 'CineFlicks Beta Launch: Create Content & Drive Presale Round 2',
      org_name: 'Cineflicks',
      logo_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/play-circle.svg',
      track: 'Content',
      short_desc: 'Build buzz for the CineFlicks beta app landing in the first week of September and the second presale round.',
      prize_pool: 1000,
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'In Review',
      deliverables: JSON.stringify(["1 short-form content piece (X videos, Reels, Shorts)", "Must communicate both: beta app arrives and presale round 2 is live", "Include call to action to cineflicks.io"]),
      requirements: JSON.stringify(["Minimum 500 followers", "Crypto/Web3 audience"])
    },
    {
      id: 'e330220f-39fd-4e93-b4ca-8e4a5709d63b',
      slug: 'nowory-now-campaign',
      title: 'Nowory NOW Campaign: Creators Needed',
      org_name: 'Nowory',
      logo_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/activity.svg',
      track: 'Content',
      short_desc: 'Create natural, creator-led content introducing Indian crypto users to Nowory, its features, and the NOW ecosystem.',
      prize_pool: 500,
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Open',
      deliverables: JSON.stringify(["1 detailed thread or 1 video review", "Tag @NoworyHQ"]),
      requirements: JSON.stringify(["Prior Web3 content creation experience"])
    },
    {
      id: '30ed9f28-c370-4e99-9e36-1d60a00d5e21',
      slug: 'loot-launch-content',
      title: 'LOOT Launch: Create Content for Memecoin Launchpad',
      org_name: 'LOOT',
      logo_url: 'https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/coins.svg',
      track: 'Content',
      short_desc: 'Create engaging content around LOOT, a new memecoin launchpad on Robinhood Chain where launching and trading is seamless.',
      prize_pool: 2000,
      end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Closed',
      deliverables: JSON.stringify(["Meme contests and engaging Twitter spaces", "Explain the bonding curve mechanics"]),
      requirements: JSON.stringify(["Active degen community member"])
    }
  ];

  for (let b of bounties) {
    await client.query(`
      INSERT INTO bounties (id, slug, title, org_name, logo_url, track, short_desc, prize_pool, end_date, status, deliverables, requirements)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING
    `, [b.id, b.slug, b.title, b.org_name, b.logo_url, b.track, b.short_desc, b.prize_pool, b.end_date, b.status, b.deliverables, b.requirements]);
    
    console.log('Inserted bounty:', b.title);
  }

  // Seed 10 to 12 dummy submissions for each bounty
  console.log('Seeding dummy submissions...');
  for (let b of bounties) {
    const numSubmissions = Math.floor(Math.random() * 3) + 10; // 10, 11, or 12
    for (let i = 0; i < numSubmissions; i++) {
      await client.query(`
        INSERT INTO bounty_submissions (bounty_id, wallet_address, submission_url, notes, created_at)
        VALUES ($1, $2, $3, $4, NOW() - ($5 || ' minutes')::interval)
      `, [
        b.id,
        '0x' + Math.random().toString(16).substring(2, 10).toUpperCase(),
        'https://x.com/dummyuser/status/' + Math.floor(Math.random() * 10000000),
        'Dummy submission ' + (i + 1),
        Math.floor(Math.random() * 10000) // Random time in the past
      ]);
    }
    console.log(`Seeded ${numSubmissions} submissions for bounty ${b.slug}`);
  }

  console.log('Bounties table recreated and dummy data inserted.');
  await client.end();
}
run().catch(console.error);
