import { createTreasuryStream } from './sails.service.mjs';

/**
 * Calculates payout and calls the treasury to open a stream.
 */
export async function processContributionPayout(userId, qualityScore) {
  // Base payout rate per second: 0.001 VARA
  // Scaled by quality score.
  const baseRate = 0.001; 
  const ratePerSec = baseRate * qualityScore;
  
  // Duration of stream: 1 week (604800 seconds)
  const duration = 604800;

  console.log(`[accounting] Opening stream for ${userId} at ${ratePerSec} VARA/sec for ${duration}s`);
  
  try {
    const txResult = await createTreasuryStream(userId, ratePerSec, duration);
    return txResult;
  } catch (err) {
    console.error('[accounting] Failed to open stream:', err);
    throw err;
  }
}
