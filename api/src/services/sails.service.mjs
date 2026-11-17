import { command } from '../sails-client.mjs';

// wVARA underlying token address registered in StreamCore -> routes streams via gVARA SuperToken
const WVARA_UNDERLYING_ID = '0xf5e9cb1d1e46b0cda6578dd1684b30f281a45dfaa390e4945b7bfc8ab3e27f3d';
const ZERO_TOKEN_ID = '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Creates a stream from the Treasury (kGkLork3scX9ngz3vhFywax2uC3LUfp7m1PMxkQXdtdsnYiZA)
 * to the recipient using the Treasury's gVARA SuperToken balance (via wVARA underlying token ID),
 * keeping native VARA strictly within the 20% gas/ops budget.
 */
export async function createTreasuryStream(recipientAddress, tokenId, ratePerSec, durationSeconds) {
  const effectiveTokenId =
    !tokenId || tokenId === ZERO_TOKEN_ID ? WVARA_UNDERLYING_ID : tokenId;

  const plancksPerSec = BigInt(Math.max(1, Math.floor(ratePerSec * 1e12)));
  const duration = BigInt(Math.max(3600, Number(durationSeconds) || 3600));
  const initialDeposit = (plancksPerSec * duration * 105n) / 100n;

  console.log(`[sails-service] Dispatching CreateStream to ${recipientAddress} via gVARA (${effectiveTokenId})`);
  console.log(`[sails-service] plancksPerSec = ${plancksPerSec}, initialDeposit = ${initialDeposit}`);

  const { result, blockHash, txHash } = await command(
    'streamCore',
    'CreateStream',
    recipientAddress,
    effectiveTokenId,
    plancksPerSec,
    initialDeposit
  );
  console.log(`[sails-service] Stream created in block: ${blockHash}`);
  return { success: true, streamId: result?.ok ?? result ?? null, blockHash, txHash };
}
