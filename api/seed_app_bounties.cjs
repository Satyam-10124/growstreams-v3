const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const dummyBounties = [
  {
    slug: 'build-vara-defi-dashboard',
    title: 'Build a DeFi Dashboard on Vara',
    org_name: 'Vara Network',
    logo_url: '/images/logo.png',
    track: 'Development',
    short_desc: 'Create a comprehensive DeFi dashboard integrating multiple smart contracts on the Vara Network. Should include portfolio tracking, token swapping, and yield farming analytics.',
    prize_pool: 5000,
    status: 'Open',
    deliverables: JSON.stringify(['GitHub Repository', 'Live Demo URL', 'Architecture Document']),
    requirements: JSON.stringify(['React/Next.js frontend', 'Vara JS API integration', 'Smart contract interactions'])
  },
  {
    slug: 'agentic-bot-discord',
    title: 'Agentic Discord Bot for Community Management',
    org_name: 'BlockX AI',
    logo_url: '/images/logo.png',
    track: 'AI Agents',
    short_desc: 'Develop an AI-powered Discord bot that uses LLMs to assist with onboarding, answering technical questions based on documentation, and tracking community engagement.',
    prize_pool: 2500,
    status: 'Open',
    deliverables: JSON.stringify(['Source Code', 'Deployment Guide', 'Demo Video']),
    requirements: JSON.stringify(['Node.js/Python', 'OpenAI/Anthropic API', 'Discord.js'])
  },
  {
    slug: 'zk-proof-identity-module',
    title: 'Zero-Knowledge Identity Verification Module',
    org_name: 'PrivacyTech',
    logo_url: '/images/logo.png',
    track: 'Cryptography',
    short_desc: 'Implement a zero-knowledge proof module allowing users to prove they hold a specific role or credential without revealing their underlying wallet address.',
    prize_pool: 7500,
    status: 'Open',
    deliverables: JSON.stringify(['Smart Contract Code', 'Integration Tests', 'Security Audit Report']),
    requirements: JSON.stringify(['Rust/Ink!', 'Vara Network', 'Zero-knowledge proofs (zk-SNARKs)'])
  },
  {
    slug: 'content-creator-tutorial-series',
    title: 'Video Tutorial Series: Getting Started with GrowStreams',
    org_name: 'GrowStreams',
    logo_url: '/images/logo.png',
    track: 'Content',
    short_desc: 'Produce a high-quality 5-part video tutorial series explaining how to set up, configure, and stream tokens using the GrowStreams SDK.',
    prize_pool: 1500,
    status: 'Open',
    deliverables: JSON.stringify(['5 YouTube Videos (1080p+)', 'Thumbnail Assets', 'Video Transcripts']),
    requirements: JSON.stringify(['Clear English audio', 'Screen recording with code walkthroughs', 'Minimum 5 mins per video'])
  }
];

async function seed() {
  try {
    for (const b of dummyBounties) {
      // Check if it exists by slug
      const existing = await pool.query('SELECT id FROM bounties WHERE slug = $1', [b.slug]);
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO bounties (
            id, slug, title, org_name, logo_url, track, short_desc, prize_pool, status, deliverables, requirements, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()
          )`,
          [b.slug, b.title, b.org_name, b.logo_url, b.track, b.short_desc, b.prize_pool, b.status, b.deliverables, b.requirements]
        );
        console.log(`Inserted: ${b.title}`);
      } else {
        console.log(`Already exists: ${b.title}`);
      }
    }
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Error seeding:', err);
  } finally {
    pool.end();
  }
}

seed();
