'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from '@gear-js/react-hooks';
import {
  useVaraWallet,
  decodeVaraAddressToHex,
  WALLET_STORAGE_KEY,
  type ConnectedVaraAccount,
} from '@/lib/vara-wallet';

export interface ActiveAccount {
  address: string;
  decodedAddress: string;
  name: string;
  source: string;
  varaBalance: number;
  isConnected: boolean;
}

export function useActiveAccount(): ActiveAccount {
  const gearHook = useAccount();
  const { wallet } = useVaraWallet();

  const [storedAddr, setStoredAddr] = useState<string>('');
  const [storedDecoded, setStoredDecoded] = useState<string>('');

  const syncStored = useCallback(() => {
    if (typeof window === 'undefined') return;
    const addr = localStorage.getItem(WALLET_STORAGE_KEY) || '';
    setStoredAddr(addr);
    if (addr) {
      decodeVaraAddressToHex(addr)
        .then((hex) => setStoredDecoded(hex))
        .catch(() => {});
    } else {
      setStoredDecoded('');
    }
  }, []);

  useEffect(() => {
    syncStored();

    const handler = (e: any) => {
      const detail: ConnectedVaraAccount | null = e?.detail;
      if (detail?.address) {
        setStoredAddr(detail.address);
        setStoredDecoded(detail.decodedAddress || '');
      } else {
        syncStored();
      }
    };

    window.addEventListener('growstreams-wallet-changed', handler);
    return () => window.removeEventListener('growstreams-wallet-changed', handler);
  }, [syncStored]);

  // Priority order:
  // 1. useVaraWallet (SubWallet connected via top-right VaraWalletButton)
  // 2. @gear-js/react-hooks (if connected via Gear modal)
  // 3. localStorage saved wallet address + decoded address
  const address =
    wallet?.address ||
    gearHook.account?.address ||
    storedAddr ||
    '';

  const decodedAddress =
    wallet?.decodedAddress ||
    gearHook.account?.decodedAddress ||
    storedDecoded ||
    '';

  const name =
    wallet?.name ||
    gearHook.account?.meta?.name ||
    'Vara Wallet';

  const source =
    wallet?.source ||
    gearHook.account?.meta?.source ||
    'subwallet-js';

  const varaBalance = wallet?.varaBalance ?? 0;

  return {
    address,
    decodedAddress,
    name,
    source,
    varaBalance,
    isConnected: Boolean(address && decodedAddress),
  };
}
