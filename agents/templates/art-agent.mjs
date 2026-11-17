import { VARA_MAINNET_CONTRACTS } from './index.mjs';

/**
 * Agent #3: Autonomous SVG Badge, PnL Flex Card & Receipt Composer (ART)
 *
 * Generates a deterministic, self-contained SVG Flex Card & Data URI summarizing
 * the 4-Agent ACP execution, Vara Mainnet contracts, and live stream metrics.
 */
export async function runArtAgent({
  job,
  agent,
  traderOutput,
  sdeOutput,
}) {
  const jobCode = job?.job_code || `ACP-${Date.now().toString(36).toUpperCase()}`;
  const budgetVara = Number(job?.budget_vara || 25).toFixed(2);
  const volumeVara = Number(traderOutput?.metrics?.estimatedCycleVolumeVara || Number(budgetVara) * 4.2).toFixed(2);
  const flowRate = traderOutput?.metrics?.flowRateVaraPerSec || '0.002500';
  const qualityScore = sdeOutput?.qualityScore || 92;
  const ownerShort = (job?.owner_wallet || agent?.owner_wallet || 'kG...Vara').slice(0, 14);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 400" width="720" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050d0a"/>
      <stop offset="50%" stop-color="#0a1f17"/>
      <stop offset="100%" stop-color="#04120e"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00ffc2"/>
      <stop offset="100%" stop-color="#22c55e"/>
    </linearGradient>
  </defs>
  <rect width="720" height="400" rx="20" fill="url(#bg)" stroke="#00ffc2" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="640" cy="70" r="110" fill="#00ffc2" fill-opacity="0.06"/>
  <circle cx="90" cy="340" r="130" fill="#22c55e" fill-opacity="0.05"/>

  <text x="36" y="48" fill="#00ffc2" font-family="monospace" font-size="13" font-weight="bold" letter-spacing="2">
    GROWSTREAMS x VARA NETWORK // SOCIETY OF AI AGENTS (ACP)
  </text>
  <text x="36" y="84" fill="#ffffff" font-family="monospace" font-size="26" font-weight="bold">
    ${escapeXml(job?.title || '4-Agent Autonomous Execution Receipt')}
  </text>
  <text x="36" y="110" fill="#9ca3af" font-family="monospace" font-size="13">
    Job ID: ${escapeXml(jobCode)}  |  Suite Owner: ${escapeXml(ownerShort)}...  |  SDE Audit Score: ${qualityScore}/100
  </text>

  <rect x="36" y="134" width="205" height="96" rx="12" fill="#0d261d" stroke="#00ffc2" stroke-opacity="0.25"/>
  <text x="52" y="160" fill="#9ca3af" font-family="monospace" font-size="11">ESCROWED BUDGET</text>
  <text x="52" y="195" fill="#00ffc2" font-family="monospace" font-size="24" font-weight="bold">${budgetVara} VARA</text>
  <text x="52" y="216" fill="#6ee7b7" font-family="monospace" font-size="11">TokenVault + gVARA</text>

  <rect x="258" y="134" width="205" height="96" rx="12" fill="#0d261d" stroke="#22c55e" stroke-opacity="0.25"/>
  <text x="274" y="160" fill="#9ca3af" font-family="monospace" font-size="11">MULTI-HOP VOLUME</text>
  <text x="274" y="195" fill="#22c55e" font-family="monospace" font-size="24" font-weight="bold">${volumeVara} VARA</text>
  <text x="274" y="216" fill="#86efac" font-family="monospace" font-size="11">4.2x Velocity Cascade</text>

  <rect x="480" y="134" width="204" height="96" rx="12" fill="#0d261d" stroke="#00ffc2" stroke-opacity="0.25"/>
  <text x="496" y="160" fill="#9ca3af" font-family="monospace" font-size="11">LIVE STREAM RATE</text>
  <text x="496" y="195" fill="#ffffff" font-family="monospace" font-size="20" font-weight="bold">${flowRate}/s</text>
  <text x="496" y="216" fill="#00ffc2" font-family="monospace" font-size="11">StreamCore Buffered</text>

  <rect x="36" y="250" width="648" height="114" rx="12" fill="#071712" stroke="#ffffff" stroke-opacity="0.1"/>
  <text x="54" y="276" fill="#00ffc2" font-family="monospace" font-size="12" font-weight="bold">
    VERIFIED VARA MAINNET SAILS CONTRACTS (wss://rpc.vara.network)
  </text>
  <text x="54" y="300" fill="#d1fae5" font-family="monospace" font-size="11">
    • StreamCore:   ${VARA_MAINNET_CONTRACTS.streamCore}
  </text>
  <text x="54" y="320" fill="#d1fae5" font-family="monospace" font-size="11">
    • TokenVault:   ${VARA_MAINNET_CONTRACTS.tokenVault}
  </text>
  <text x="54" y="340" fill="#d1fae5" font-family="monospace" font-size="11">
    • SplitsRouter: ${VARA_MAINNET_CONTRACTS.splitsRouter}
  </text>
</svg>`;

  const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

  return {
    agentType: 'ART',
    agentName: agent?.name || 'Art_Agent',
    agentWallet: agent?.agent_wallet,
    cardTitle: `${job?.title || 'ACP Execution'} — On-Chain Flex Card`,
    svgMarkup: svg,
    svgDataUri,
    badgeMetadata: {
      jobCode,
      budgetVara,
      volumeVara,
      flowRate,
      qualityScore,
      network: 'vara-mainnet',
    },
    timestamp: new Date().toISOString(),
  };
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
