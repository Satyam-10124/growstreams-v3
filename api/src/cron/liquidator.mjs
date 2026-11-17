import { query, command } from '../sails-client.mjs';

export async function runLiquidator() {
  console.log('[cron] Running stream liquidator...');
  try {
    const totalRes = await query('streamCore', 'TotalStreams');
    // Ensure totalRes is a number or object with total property
    const total = typeof totalRes === 'object' && totalRes !== null ? Number(totalRes.total) : Number(totalRes);
    
    if (isNaN(total) || total <= 0) {
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);

    for (let id = 1; id <= total; id++) {
      try {
        const stream = await query('streamCore', 'GetStream', BigInt(id));
        if (!stream || stream.status !== 'Active') continue;

        const flowRate = Number(stream.flow_rate);
        const deposited = Number(stream.deposited);
        const lastUpdate = Number(stream.last_update);
        const lastStreamed = Number(stream.streamed);

        if (deposited === 0 || flowRate === 0) continue;

        const streamedSinceUpdate = flowRate * (nowSec - lastUpdate);
        const totalStreamed = Math.min(lastStreamed + streamedSinceUpdate, deposited);
        const remaining = deposited - totalStreamed;

        // If remaining buffer is 0 (or less), liquidate
        if (remaining <= 0) {
          console.log(`[cron] Stream #${id} is depleted (remaining: ${remaining}). Liquidating...`);
          await command('streamCore', 'Liquidate', BigInt(id));
          console.log(`[cron] Stream #${id} liquidated successfully.`);
        }
      } catch (streamErr) {
        // Suppress individual stream fetch errors if they don't exist
        if (!streamErr?.message?.includes('not found')) {
          console.error(`[cron] Failed to process stream #${id}:`, streamErr?.message);
        }
      }
    }
  } catch (err) {
    console.error(`[cron] Liquidator failed:`, err?.message);
  }
}
