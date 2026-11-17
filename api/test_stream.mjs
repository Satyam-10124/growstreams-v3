import { config } from 'dotenv';
config();
import { query, connect, getKeyring } from './src/sails-client.mjs';

async function test() {
  try {
    await connect();
    const totalStreams = await query('streamCore', 'TotalStreams');
    console.log('Total Streams:', totalStreams);
    
    // Also query active streams
    const activeStreams = await query('streamCore', 'ActiveStreams');
    console.log('Active Streams:', activeStreams);
  } catch (err) {
    console.error('Error:', err);
  }
  process.exit(0);
}

test();

test();
