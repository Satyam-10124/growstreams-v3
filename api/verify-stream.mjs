import dotenv from 'dotenv';
dotenv.config();

import { connect } from './src/sails-client.mjs';
import { createTreasuryStream } from './src/services/sails.service.mjs';

async function main() {
  console.log('Starting stream verification test...');
  await connect();
  
  const dummyRecipient = 'kGk6aT8b6ZzK2X5Q5u9G4r7sM5M1L9A3X9W9T8Y8c7d6b5Z';
  const tokenId = process.env.VARA_TOKEN_ID || '0x0000000000000000000000000000000000000000000000000000000000000000';
  const ratePerSec = 0.001;
  const durationSeconds = 60;
  
  try {
    const res = await createTreasuryStream(dummyRecipient, tokenId, ratePerSec, durationSeconds);
    console.log('Success! Stream created:', res);
  } catch (error) {
    console.error('Verification failed:', error);
  }
  process.exit(0);
}

main();
