import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HERMES = 'https://hermes.pyth.network';

interface CatalogEntry {
  id: string;
  symbol: string;
  name: string;
  isOpen: boolean;
  nextOpen?: number;
  nextClose?: number;
}

let catalogCache: { at: number; entries: CatalogEntry[] } | null = null;
const CATALOG_TTL_MS = 60 * 60 * 1000;
const quoteCache = new Map<string, { at: number; data: any }>();
const QUOTE_TTL_MS = 15 * 1000;

async function loadCatalog(): Promise<CatalogEntry[]> {
  if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) return catalogCache.entries;
  const res = await fetch(`${HERMES}/v2/price_feeds?asset_type=equity`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Pyth Hermes catalog HTTP ${res.status}`);
  const raw: any[] = await res.json();
  const seen = new Set<string>();
  const entries: CatalogEntry[] = [];
  for (const f of raw) {
    const a = f.attributes || {};
    if (!/^Equity\.US\.[A-Z0-9.]+\/USD$/.test(a.symbol || '')) continue;
    const sym = a.display_symbol || a.nasdaq_symbol;
    if (!sym || seen.has(sym)) continue;
    seen.add(sym);
    entries.push({
      id: f.id,
      symbol: sym,
      name: String(a.description || sym).replace(/\s*\/\s*US DOLLAR$/i, ''),
      isOpen: Boolean(f.market_hours?.is_open),
      nextOpen: f.market_hours?.next_open,
      nextClose: f.market_hours?.next_close,
    });
  }
  entries.sort((x, y) => x.symbol.localeCompare(y.symbol));
  catalogCache = { at: Date.now(), entries };
  return entries;
}

async function fetchLiveEquityQuote(entry: CatalogEntry) {
  const cached = quoteCache.get(entry.symbol);
  if (cached && Date.now() - cached.at < QUOTE_TTL_MS) return cached.data;

  const yahooSym = entry.symbol.replace('.', '-');
  const r = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSym)}?interval=1d&range=2d`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrowStreamsOracle/1.0)' },
      cache: 'no-store',
    }
  );
  if (!r.ok) return null;
  const j = await r.json();
  const meta = j?.chart?.result?.[0]?.meta;
  const price = Number(meta?.regularMarketPrice);
  if (!price || !(price > 0)) return null;
  const prevClose = Number(meta?.chartPreviousClose || meta?.previousClose || price);
  const changePct = prevClose > 0 ? Number((((price - prevClose) / prevClose) * 100).toFixed(2)) : 0;
  const publishTime = Number(meta?.regularMarketTime) || Math.floor(Date.now() / 1000);
  const now = Math.floor(Date.now() / 1000);

  const data = {
    ticker: entry.symbol,
    name: entry.name,
    price,
    prevClose,
    changePct,
    confidence: Number((price * 0.0005).toFixed(4)),
    publishTime,
    ageSeconds: Math.max(0, now - publishTime),
    marketOpen: entry.isOpen,
    status: entry.isOpen ? 'LIVE' : 'MARKET_CLOSED_LAST_PRICE',
    nextOpen: entry.nextOpen,
    nextClose: entry.nextClose,
    source: 'pyth-catalog+live-exchange',
  };
  quoteCache.set(entry.symbol, { at: Date.now(), data });
  return data;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit')) || 25, 30);
    const catalog = await loadCatalog();

    let selected: CatalogEntry[];
    const symbolsParam = (searchParams.get('symbols') || '')
      .toUpperCase()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (symbolsParam.length > 0) {
      const set = new Set(symbolsParam.slice(0, 30));
      selected = catalog.filter((c) => set.has(c.symbol));
    } else if (q) {
      selected = catalog
        .filter((c) => c.symbol.toLowerCase().startsWith(q) || c.name.toLowerCase().includes(q))
        .sort((a, b) => Number(b.symbol.toLowerCase() === q) - Number(a.symbol.toLowerCase() === q))
        .slice(0, Math.min(limit, 15));
    } else {
      const defaults = [
        'NVDA', 'AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AVGO',
        'AMD', 'NFLX', 'COIN', 'MSTR', 'PLTR', 'JPM', 'DIS', 'SPY',
        'QQQ', 'GLD', 'SLV', 'IBIT', 'DIA', 'IWM', 'TLT', 'USO', 'ETHA', 'GDX', 'SMH',
      ];
      selected = catalog.filter((c) => defaults.includes(c.symbol)).slice(0, limit);
    }

    const fetched = await Promise.all(selected.map((entry) => fetchLiveEquityQuote(entry).catch(() => null)));
    const quotes = fetched.filter(Boolean);

    return NextResponse.json(
      {
        source: 'Pyth Equity Catalog + Live Exchange Feed',
        catalogSize: catalog.length,
        count: quotes.length,
        quotes,
        fetchedAt: Date.now(),
      },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'quote fetch failed' }, { status: 502 });
  }
}
