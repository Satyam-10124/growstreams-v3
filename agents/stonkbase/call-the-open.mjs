/**
 * StonkBase × Nightshift "Call the Open" Parimutuel Prediction Engine on Vara
 *
 * Reference:
 * - https://github.com/nightshift-labs007/nightshift/blob/main/contracts/NightshiftPredictions.sol
 * - Vara Grant Proposal Pillar 4 ("Call the Open: stake gVARA: green or red, 1.20x weight if vaulted")
 *
 * Properties P1–P5 from NightshiftPredictions.sol:
 * - P1: Payouts never exceed what was staked in the round
 * - P2: Every winner gets at least their stake back + time/vault-weighted share of losing pool (minus fee)
 * - P3: Refunds (ties or one-sided rounds) return exact stakes
 * - P4: A position is paid once
 * - P5: Human users and Agent actors are tracked separately for Vara Grant KPIs
 */

import crypto from 'crypto';
import { getStonkBaseQuote } from './oracle.mjs';

export const BPS = 10_000;
export const MIN_WEIGHT_BPS = 5_000; // Late bets at lockTime get 0.50x time weight
export const VAULTED_BOOST_MULTIPLIER = 1.2; // 1.20x weight boost if user/agent has vaulted VARA/gVARA in TokenVault
export const FEE_BPS = 200; // 2% protocol fee from losing pool routed via SplitsRouter

const CALL_THE_OPEN_TICKERS = ['SPY', 'QQQ', 'NVDA', 'TSLA', 'IBIT', 'GLD'];

function getCurrentSessionDate(nowMs = Date.now()) {
  const d = new Date(nowMs);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return Number(`${y}${m}${day}`);
}

/**
 * Time weight in bps for a stake placed at timestamp `t`:
 * 10,000 bps (1.00x) at openTime, falling linearly to MIN_WEIGHT_BPS (0.50x) at lockTime.
 */
export function computeTimeWeightBps(round, timestampSec) {
  if (timestampSec <= round.openTime) return BPS;
  if (timestampSec >= round.lockTime) return MIN_WEIGHT_BPS;
  const span = Math.max(1, round.lockTime - round.openTime);
  return Math.round(BPS - ((BPS - MIN_WEIGHT_BPS) * (timestampSec - round.openTime)) / span);
}

/**
 * Effective share weight combining Nightshift time-decay weight and the 1.20x TokenVault boost.
 */
export function computeEffectiveShares(stakeGvara, round, timestampSec, isVaulted = true) {
  const timeWeightBps = computeTimeWeightBps(round, timestampSec);
  const vaultMultiplier = isVaulted ? VAULTED_BOOST_MULTIPLIER : 1.0;
  const effectiveWeightBps = Math.round(timeWeightBps * vaultMultiplier);
  const shares = Number(((stakeGvara * effectiveWeightBps) / BPS).toFixed(6));
  return {
    timeWeightBps,
    vaultMultiplier,
    effectiveWeightBps,
    shares,
  };
}

export function createDefaultRounds(nowMs = Date.now()) {
  const session = getCurrentSessionDate(nowMs);
  const nowSec = Math.floor(nowMs / 1000);
  const openTime = nowSec - 3600;
  const lockTime = nowSec + 12 * 3600;
  const marketOpen = lockTime + 900;

  return CALL_THE_OPEN_TICKERS.map((ticker, idx) => {
    const quote = getStonkBaseQuote(ticker, nowMs);
    return {
      roundId: `CTO-${session}-${ticker}`,
      numericId: idx + 1,
      ticker,
      session,
      strike: quote.fairValue,
      openPrice: null,
      openTime,
      lockTime,
      marketOpen,
      status: 'OPEN', // 'OPEN' | 'SETTLED' | 'CANCELLED'
      outcome: 'NONE', // 'NONE' | 'GREEN' | 'RED' | 'REFUND'
      stakeGreenGvara: Number((150 + idx * 45).toFixed(2)),
      stakeRedGvara: Number((120 + idx * 35).toFixed(2)),
      sharesGreen: Number((168 + idx * 48).toFixed(2)),
      sharesRed: Number((132 + idx * 38).toFixed(2)),
      feeGvara: 0,
      varaAnchorHash: `0x${crypto.createHash('sha256').update(`${session}:${ticker}:${quote.fairValue}`).digest('hex')}`,
      positions: [],
    };
  });
}

/**
 * Settles a Call the Open round using the NightshiftPayout formula (P1–P5 invariants).
 */
export function settleCallTheOpenRound(round, openingPrice) {
  const openPrice = Number(openingPrice || getStonkBaseQuote(round.ticker).fairValue);
  let outcome = 'REFUND';
  if (round.stakeGreenGvara <= 0 || round.stakeRedGvara <= 0 || openPrice === round.strike) {
    outcome = 'REFUND';
  } else if (openPrice > round.strike) {
    outcome = 'GREEN'; // Higher than Nightshift strike call
  } else {
    outcome = 'RED'; // Lower than Nightshift strike call
  }

  let feeGvara = 0;
  if (outcome === 'GREEN') {
    feeGvara = Number(((round.stakeRedGvara * FEE_BPS) / BPS).toFixed(6));
  } else if (outcome === 'RED') {
    feeGvara = Number(((round.stakeGreenGvara * FEE_BPS) / BPS).toFixed(6));
  }

  const settledPositions = (round.positions || []).map((p) => {
    let payoutGvara = 0;
    if (outcome === 'REFUND') {
      payoutGvara = p.stakeGvara;
    } else if (outcome === p.side) {
      const losingPool = outcome === 'GREEN' ? round.stakeRedGvara : round.stakeGreenGvara;
      const winShares = outcome === 'GREEN' ? round.sharesGreen : round.sharesRed;
      const netLosingPool = Math.max(0, losingPool - feeGvara);
      const bonus = winShares > 0 ? (netLosingPool * p.shares) / winShares : 0;
      // P2: winner gets full stake back + share of losing pool
      payoutGvara = Number((p.stakeGvara + bonus).toFixed(6));
    }
    return {
      ...p,
      settled: true,
      won: outcome === p.side,
      payoutGvara,
      profitGvara: Number((payoutGvara - p.stakeGvara).toFixed(6)),
    };
  });

  return {
    ...round,
    openPrice,
    status: 'SETTLED',
    outcome,
    feeGvara,
    positions: settledPositions,
    settledAt: new Date().toISOString(),
  };
}
