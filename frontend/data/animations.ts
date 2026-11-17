export const HERO_HEADLINE = [
  {
    text: "GrowStreams processes billions of transactions every day,",
    accent: false,
  },
  { text: "but most of that data is hard to use.", accent: true },
];

export const HERO_FIELD_CARDS = [
  {
    id: "m1",
    kind: "meta",
    label: "Grant Vesting",
    lines: [
      "0x7a9f...3e21 → streaming 12.4 VARA/s",
      "Payroll stream #4482 — active",
      "Bounty escrow released",
      "Revenue share: 0.003 VARA/block",
      "Grant vesting: 847 days remaining",
      "Subscription tick confirmed",
      "Stream paused by sender",
      "Token-agnostic · block-finalized",
      "New stream created: 2.1s ago",
      "Withdrawal available: 1,204.55 VARA",
    ],
    x: 44,
    y: 16,
    depth: 0.35,
    hideOnMobile: true,
  },
  {
    id: "t1",
    kind: "tx",
    title: "1,204.55 VARA",
    sub: "Available",
    amount: "12.4 VARA/s",
    tone: "lime",
    x: 62,
    y: 26,
    depth: 1,
  },
  {
    id: "m2",
    kind: "meta",
    label: "12.4 VARA/s",
    lines: ["Confirmed", "New Stream"],
    x: 24,
    y: 34,
    depth: 0.85,
  },
  {
    id: "m3",
    kind: "meta",
    label: "Block-finalized",
    lines: ["Bounty Escrow"],
    x: 47,
    y: 39,
    depth: 0.3,
    hideOnMobile: true,
  },
  {
    id: "m4",
    kind: "meta",
    label: "Block-finalized",
    lines: ["New Stream"],
    x: 80,
    y: 42,
    depth: 0.8,
    hideOnMobile: true,
  },
  {
    id: "m5",
    kind: "meta",
    label: "Bounty Escrow",
    lines: ["Block-finalized"],
    x: 12,
    y: 52,
    depth: 0.3,
    hideOnMobile: true,
  },
  {
    id: "t2",
    kind: "tx",
    title: "Block-finalized",
    sub: "Vesting Contract",
    amount: "Subscription",
    tone: "butter",
    x: 26,
    y: 68,
    depth: 1,
  },
  {
    id: "m6",
    kind: "meta",
    label: "Stream Paused",
    lines: ["Vesting Contract", "Stream Paused"],
    x: 18,
    y: 79,
    depth: 0.3,
    hideOnMobile: true,
  },
  {
    id: "m7",
    kind: "meta",
    label: "Block-finalized",
    lines: ["Subscription"],
    x: 68,
    y: 75,
    depth: 0.3,
    hideOnMobile: true,
  },
  {
    id: "m8",
    kind: "meta",
    label: "Created 2.1s ago",
    lines: ["Block-finalized"],
    x: 53,
    y: 84,
    depth: 0.85,
  },
  {
    id: "t3",
    kind: "tx",
    title: "Created 2.1s ago",
    sub: "450 VARA",
    amount: "12.4 VARA/s",
    tone: "clay",
    x: 72,
    y: 89,
    depth: 1,
  },
];

export const ENRICHMENT_RAW = `{
  "action": "0xa4f1...9c3d CALL streamCreate(0x88,412.0,VARA)",
  "streaming_rate": "12.4 VARA/s",
  "contract": "0x7a9f2b8c9d...3e21",
  "network": {
    "chain": "Vara",
    "block": "847920"
  },
  "occurredAt": "2026-08-20 00:30:15",
  "status": "FINALIZED"
}`;

export const ENRICHMENT_FIELDS = [
  {
    id: "recipient",
    label: "Recipient",
    lines: ["0x9F2b...44dC (contributor.vara)", "Verified Identity"],
  },
  {
    id: "streamType",
    label: "Stream Type",
    lines: ["PAYROLL, BI-WEEKLY VESTING", "Block #847920 Finalized"],
  },
  {
    id: "rate",
    label: "Rate",
    lines: ["0.003 VARA / BLOCK", "Smart Contract Stream", "DeFi Protocol"],
  },
];

export const ENRICHMENT_DETAILS: [string, string][] = [
  ["Stream Start", "August 20, 2026"],
  ["Method", "On-chain Trigger"],
  ["Escrow", "Vara Vault ••7204"],
];

export const ENRICHMENT_HEADLINE =
  "GrowStreams decodes on-chain events in real time, adding structure, accuracy, and intelligence at every layer.";

export const ENRICHMENT_LIVE_CELLS: [number, number][] = [
  [6, 2],
  [11, 1],
  [3, 5],
  [17, 3],
  [8, 7],
  [14, 6],
  [2, 9],
  [19, 8],
  [10, 11],
  [5, 12],
  [16, 10],
  [12, 13],
];

export const REWARDS_CONTENT = {
  eyebrow: "Streams & automation",
  headline: "Trigger the right payout, the instant it's earned.",
  body: "Build automated streams that reward real contribution.",
  ctaText: "Learn more",
  ctaHref: "#",
  criteriaTitle: "Stream Trigger",
  criteriaText: "Release payment when a milestone is confirmed on-chain",
  transactions: [
    {
      id: "milestone",
      name: "Milestone #4 Verified",
      monogram: "M4",
      tone: "citron",
      when: "2026-08-20 00:23:16",
      amount: 14.53,
      points: 140,
    },
    {
      id: "dao",
      name: "DAO Proposal #212 Passed",
      monogram: "DP",
      tone: "forest",
      when: "2026-08-20 00:23:16",
      amount: 18.45,
      points: 180,
      matched: true,
    },
    {
      id: "sprint",
      name: "Sprint Delivery Confirmed",
      monogram: "SD",
      tone: "sage",
      when: "2026-08-20 00:49:11",
      amount: 13.38,
      points: 130,
    },
  ],
  vGuides: ["0%", "30.67%", "34.67%", "65.33%", "69.33%", "100%"],
  hGuides: ["0%", "26%", "68%", "86%", "100%"],
};
