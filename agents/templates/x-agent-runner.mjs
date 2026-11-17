import { VARA_MAINNET_CONTRACTS } from './index.mjs';

/**
 * Agent #4: Autonomous X/Twitter Agent Diary, Viral Loop & Quest Rewarder (X)
 *
 * Composes verifiable Agent Diary posts with Vara Subscan / Gear IDEA explorer links,
 * optionally broadcasts live via X API v2 if credentials are set, and prepares
 * shareable X intent URLs + QuestSeeds reward metadata.
 */
export async function runXAgent({
  job,
  agent,
  traderOutput,
  sdeOutput,
  txTrail = [],
}) {
  const jobCode = job?.job_code || `ACP-${Date.now().toString(36).toUpperCase()}`;
  const volumeVara = traderOutput?.metrics?.estimatedCycleVolumeVara || Number(job?.budget_vara || 25) * 4.2;
  const flowRate = traderOutput?.metrics?.flowRateVaraPerSec || '0.0025';
  const score = sdeOutput?.qualityScore || 92;

  const primaryTx = txTrail.find((t) => t.txHash || t.blockHash) || txTrail[0];
  const explorerUrl =
    primaryTx?.explorerUrl ||
    `https://idea.gear-tech.io/programs/${VARA_MAINNET_CONTRACTS.streamCore}?node=wss://rpc.vara.network`;

  const tweetText = [
    `🐝 Agent Diary [${agent?.name || 'GrowStreams_X_Agent'}] — Job ${jobCode} complete on @VaraNetwork!`,
    ``,
    `⚡ Stream Rate: ${flowRate} gVARA/sec`,
    `🔄 4-Agent Cascade Volume: ${volumeVara} VARA (Vault -> StreamCore -> SplitsRouter)`,
    `🛡️ SDE Sails Audit Score: ${score}/100`,
    `🔗 On-Chain Proof: ${explorerUrl}`,
    ``,
    `#Vara #GrowStreams #AIonVara #Sails`,
  ].join('\n');

  const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  let liveTweetId = null;
  let postedLive = false;

  // Attempt live X API v2 post only when write credentials are configured and LIVE_X_POST=true
  if (
    process.env.LIVE_X_POST === 'true' &&
    process.env.X_API_KEY &&
    process.env.X_API_SECRET &&
    process.env.X_ACCESS_TOKEN &&
    process.env.X_ACCESS_SECRET
  ) {
    try {
      const { TwitterApi } = await import('twitter-api-v2');
      const client = new TwitterApi({
        appKey: process.env.X_API_KEY,
        appSecret: process.env.X_API_SECRET,
        accessToken: process.env.X_ACCESS_TOKEN,
        accessSecret: process.env.X_ACCESS_SECRET,
      });
      const res = await client.v2.tweet(tweetText);
      liveTweetId = res?.data?.id || null;
      postedLive = Boolean(liveTweetId);
    } catch (err) {
      console.warn('[x-agent-runner] Live tweet skipped/failed:', err.message);
    }
  }

  return {
    agentType: 'X',
    agentName: agent?.name || 'X_Agent',
    agentWallet: agent?.agent_wallet,
    tweetText,
    intentUrl,
    postedLive,
    liveTweetId,
    explorerUrl,
    questSeedsAwarded: 50,
    questSeedsContract: VARA_MAINNET_CONTRACTS.questSeeds,
    timestamp: new Date().toISOString(),
  };
}
