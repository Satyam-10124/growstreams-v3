import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLUGS = ['growstreams-payments', 'growstreams-perps'];

async function j(url: string) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

/** Live GrowStreams figures straight from DeFiLlama (single source of truth for the UI). */
export async function GET() {
  try {
    const [pay, perps, dexVara, feesVara] = await Promise.all([
      j('https://api.llama.fi/protocol/growstreams-payments'),
      j('https://api.llama.fi/protocol/growstreams-perps').catch(() => null),
      j('https://api.llama.fi/overview/dexs/vara?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true').catch(() => null),
      j('https://api.llama.fi/overview/fees/vara?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true').catch(() => null),
    ]);
    const tvlUsd = (pay.tvl || []).slice(-1)[0]?.totalLiquidityUSD ?? 0;
    const mine = (arr: any) => (arr?.protocols || []).filter((p: any) => /grow/i.test(p.name));
    const vol30d = mine(dexVara).reduce((a: number, p: any) => a + (p.total30d || 0), 0);
    const vol24h = mine(dexVara).reduce((a: number, p: any) => a + (p.total24h || 0), 0);
    const fees30d = mine(feesVara).reduce((a: number, p: any) => a + (p.total30d || 0), 0);
    const varaRank = (dexVara?.protocols || [])
      .slice()
      .sort((a: any, b: any) => (b.total30d || 0) - (a.total30d || 0))
      .findIndex((p: any) => /grow/i.test(p.name)) + 1;
    return NextResponse.json({
      source: 'api.llama.fi',
      tvlUsd,
      volume30dUsd: vol30d,
      volume24hUsd: vol24h,
      fees30dUsd: fees30d,
      varaDexRank: varaRank || null,
      varaDexProtocols: (dexVara?.protocols || []).length,
      slugs: SLUGS,
      fetchedAt: Date.now(),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'defillama unavailable' }, { status: 502 });
  }
}
