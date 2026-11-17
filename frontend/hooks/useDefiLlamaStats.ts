'use client';

import { useEffect, useState } from 'react';

export interface DefiLlamaStats {
  tvlUsd: number;
  volume30dUsd: number;
  fees30dUsd: number;
  varaDexRank: number | null;
  loaded: boolean;
}

const EMPTY: DefiLlamaStats = { tvlUsd: 0, volume30dUsd: 0, fees30dUsd: 0, varaDexRank: null, loaded: false };

export function fmtUsd(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Live DeFiLlama numbers (replaces previously hardcoded volume/TVL strings). */
export function useDefiLlamaStats(): DefiLlamaStats {
  const [s, setS] = useState<DefiLlamaStats>(EMPTY);
  useEffect(() => {
    let off = false;
    fetch('/api/defillama', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (off || d.error) return;
        setS({ tvlUsd: d.tvlUsd, volume30dUsd: d.volume30dUsd, fees30dUsd: d.fees30dUsd, varaDexRank: d.varaDexRank, loaded: true });
      })
      .catch(() => {});
    return () => { off = true; };
  }, []);
  return s;
}

import { fetchStonkVolumeStats, type StonkVolumeStats } from '@/lib/vara-wallet';

export function fmtVara(n: number): string {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} VARA`;
}

/** On-chain spot/perps volume (VARA) read from StonkOrderbook / StonkPerpsDesk VolumeStats. */
export function useStonkVolume(): StonkVolumeStats | null {
  const [v, setV] = useState<StonkVolumeStats | null>(null);
  useEffect(() => {
    let off = false;
    fetchStonkVolumeStats().then((r) => { if (!off && r) setV(r); }).catch(() => {});
    return () => { off = true; };
  }, []);
  return v;
}
