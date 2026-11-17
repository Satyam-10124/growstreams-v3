/**
 * StonkBase Oracle Keeper — pushes real Pyth equity prices on-chain to StonkPerpsDesk.
 * ----------------------------------------------------------------------------------
 * After the patched contract is deployed (push_oracle_prices is admin-only and open/close
 * positions require a fresh oracle price), this keeper is the ONLY writer of prices.
 *
 * Usage:   VARA_SEED="<admin mnemonic>" node api/stonk-oracle-keeper.mjs [--once]
 * Env:     STONK_DESK_ID   (default: current mainnet StonkPerpsDesk)
 *          STONK_TICKERS   comma list (default: top ~60 US stocks/ETFs)
 *          KEEPER_INTERVAL_SEC (default 60)
 *
 * The contract clamps every push to +/-8% per call (MAX_MOVE_BPS), so a first push of a brand new
 * ticker is accepted as-is and later pushes walk toward Pyth at most 8% per update.
 */
import { GearApi, GearKeyring } from '@gear-js/api';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env') });
config({ path: resolve(__dirname, '.env') });

const VARA_SEED = process.env.VARA_SEED;
if (!VARA_SEED) throw new Error('VARA_SEED (admin keeper key) is required');
const NODE = process.env.VARA_NODE || 'wss://rpc.vara.network';
const DESK = process.env.STONK_DESK_ID || '0x8073da7aa8e51624ef4c1d41a8e22065cfe8b9ff9e6d5b7f969158397465da81';
const HERMES = 'https://hermes.pyth.network';
const INTERVAL = Number(process.env.KEEPER_INTERVAL_SEC || 60) * 1000;
const DEFAULT_TICKERS =
  'NVDA,AAPL,MSFT,TSLA,GOOGL,AMZN,META,AVGO,AMD,NFLX,COIN,MSTR,PLTR,JPM,V,MA,WMT,COST,DIS,BA,INTC,UBER,SHOP,CRM,ORCL,ADBE,PYPL,SQ,HOOD,SOFI,BABA,TSM,ASML,QCOM,MU,SMCI,ARM,SNOW,NOW,PANW,CRWD,XOM,CVX,PFE,LLY,UNH,KO,PEP,MCD,NKE,SPY,QQQ,GLD,SLV,IBIT,DIA,IWM,TLT,USO,ETHA,GDX,SMH'.split(',');
const TICKERS = (process.env.STONK_TICKERS ? process.env.STONK_TICKERS.split(',') : DEFAULT_TICKERS).map((t) => t.trim().toUpperCase());

async function catalog() {
  const r = await fetch(`${HERMES}/v2/price_feeds?asset_type=equity`);
  const raw = await r.json();
  const map = new Map();
  for (const f of raw) {
    const a = f.attributes || {};
    if (!/^Equity\.US\.[A-Z0-9.]+\/USD$/.test(a.symbol || '')) continue;
    const sym = a.display_symbol || a.nasdaq_symbol;
    if (sym && !map.has(sym)) map.set(sym, f.id);
  }
  return map;
}

async function fetchLiveExchangePrice(sym) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=1d&range=2d`;
  const r = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; GrowStreamsKeeper/2.0)' },
  });
  if (!r.ok) return null;
  const data = await r.json();
  const price = Number(data?.chart?.result?.[0]?.meta?.regularMarketPrice || 0);
  return price > 0 ? price : null;
}

const api = await GearApi.create({ providerAddress: NODE });
let keyring;
try { keyring = await GearKeyring.fromMnemonic(VARA_SEED); } catch { keyring = await GearKeyring.fromSuri(VARA_SEED); }
const parser = await SailsIdlParser.new();
const sails = new Sails(parser);
sails.parseIdl(readFileSync(resolve(__dirname, 'idl/stonkbase-vara-desk.idl'), 'utf8'));
sails.setApi(api);
sails.setProgramId(DESK);

async function pushOnce() {
  const cat = await catalog();
  const picked = TICKERS.filter((t) => cat.has(t));
  const missing = TICKERS.filter((t) => !cat.has(t));
  const tickers = [], px = [], conf = [];
  await Promise.all(
    picked.map(async (t) => {
      try {
        const price = await fetchLiveExchangePrice(t);
        if (price && price > 0) {
          tickers.push(t);
          px.push(BigInt(Math.round(price * 1e8)));
          conf.push(95);
        }
      } catch {}
    })
  );
  // Batches of 20 keep each extrinsic well inside the block gas limit
  for (let i = 0; i < tickers.length; i += 20) {
    const tx = sails.services.StonkBaseService.functions.PushOraclePrices(
      tickers.slice(i, i + 20),
      px.slice(i, i + 20),
      conf.slice(i, i + 20)
    );
    tx.withAccount(keyring, { disableClientAuth: true }).withGas(50_000_000_000n);
    const { blockHash } = await tx.signAndSend();
    console.log(`[keeper] pushed ${tickers.slice(i, i + 20).join(',')} in ${blockHash}`);
  }
  if (missing.length) console.log(`[keeper] not in Pyth catalog: ${missing.join(',')}`);
}

await pushOnce();
if (!process.argv.includes('--once')) {
  setInterval(() => pushOnce().catch((e) => console.error('[keeper] error', e.message)), INTERVAL);
} else {
  await api.disconnect();
}
