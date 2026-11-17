import { getApi, getContract, getServiceName, getProgramIds } from '../sails-client.mjs';
import { query } from './db.mjs';

let isRunning = false;
let unsubscribe = null;

export async function startIndexer() {
  if (isRunning) return;
  const api = getApi();
  if (!api) {
    console.error('[indexer] Gear API not initialized');
    return;
  }

  const programIds = getProgramIds();
  const streamCoreId = programIds['stream-core'];
  if (!streamCoreId) {
    console.warn('[indexer] Stream Core program ID not found. Indexer disabled.');
    return;
  }

  console.log(`[indexer] Starting indexer for program: ${streamCoreId}`);
  isRunning = true;

  try {
    const sails = getContract('streamCore');
    const serviceName = getServiceName('streamCore');
    const service = sails.services[serviceName];

    if (service && service.events) {
      // Subscribe to StreamCreated event
      if (service.events['StreamCreated']) {
        unsubscribe = service.events['StreamCreated'].subscribe((eventData) => {
          console.log('[indexer] Received StreamCreated:', eventData);
          handleStreamCreated(eventData);
        });
        console.log('[indexer] Subscribed to StreamCreated events');
      }
    }
  } catch (error) {
    console.error('[indexer] Failed to subscribe to events via sails:', error);
    
    // Fallback: poll or system events
    unsubscribe = await api.query.system.events((events) => {
      events.forEach(({ event }) => {
        if (event.section === 'gear' && event.method === 'UserMessageSent') {
          // We can parse generic gear events if sails event subscription fails
        }
      });
    });
  }
}

async function handleStreamCreated(eventData) {
  try {
    const streamId = eventData.id || eventData.stream_id || eventData.streamId;
    const recipient = eventData.receiver || eventData.recipient;
    const ratePerSec = eventData.flow_rate || eventData.rate_per_sec || eventData.ratePerSec || 0;
    const duration = eventData.duration || 0;
    const startedAt = eventData.start_time || eventData.started_at || eventData.startedAt || Math.floor(Date.now() / 1000);

    if (streamId == null) {
      console.warn('[indexer] StreamCreated event missing id, skipping insert:', eventData);
      return;
    }

    await query(
      `INSERT INTO public.streams (stream_id, recipient, rate_per_sec, duration, started_at, status) 
       VALUES ($1, $2, $3, $4, TO_TIMESTAMP($5), 'active') 
       ON CONFLICT (stream_id) DO NOTHING`,
      [streamId, recipient, ratePerSec, duration, startedAt]
    );
    console.log(`[indexer] Saved stream ${streamId} to database.`);
  } catch (err) {
    console.error('[indexer] DB insert error:', err);
  }
}

export function stopIndexer() {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  isRunning = false;
  console.log('[indexer] Stopped');
}
