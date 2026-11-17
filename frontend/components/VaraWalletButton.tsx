'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useVaraWallet } from '@/lib/vara-wallet';
import { toast } from 'sonner';

export default function VaraWalletButton({ lightMode = true }: { lightMode?: boolean }) {
  const { wallet, accounts, connecting, connect, selectAccount, disconnect } = useVaraWallet();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleConnectClick = async () => {
    try {
      const connected = await connect();
      toast.success(`Connected ${connected.name} (${connected.address.slice(0, 6)}…${connected.address.slice(-4)})`);
    } catch (err: any) {
      toast.error(err?.message || 'Please unlock SubWallet, Talisman, or Polkadot.js extension.');
    }
  };

  if (!wallet) {
    return (
      <button
        type="button"
        onClick={handleConnectClick}
        disabled={connecting}
        className="h-8 px-3.5 rounded-lg bg-[#136F46] hover:bg-[#0F5837] !text-white text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
      >
        <span className="w-2 h-2 rounded-full bg-[#6EE7B7] animate-pulse" />
        <span>{connecting ? 'Connecting…' : 'Connect SubWallet'}</span>
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-8 px-3 rounded-lg border text-xs font-mono font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
          lightMode
            ? 'bg-white border-[#E2E5E1] text-[#111827] hover:border-[#136F46]'
            : 'bg-[#181D24] border-[#28303D] text-white hover:border-[#136F46]'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-[#136F46]" />
        <span>
          {wallet.address.slice(0, 6)}…{wallet.address.slice(-4)}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] text-[10px]">
          {wallet.varaBalance > 0 ? `${wallet.varaBalance.toFixed(1)} VARA` : 'LIVE'}
        </span>
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-72 rounded-xl border shadow-xl p-3 z-50 text-xs ${
            lightMode
              ? 'bg-white border-[#E6E8E5] text-[#111827]'
              : 'bg-[#12161B] border-[#222934] text-[#F3F4F6]'
          }`}
        >
          <div className="pb-2.5 border-b border-[#E6E8E5]/60">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#136F46]">{wallet.name}</span>
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#E6F4ED] text-[#136F46]">
                {wallet.source}
              </span>
            </div>
            <p className="font-mono text-[11px] text-[#6B7280] mt-1 break-all">{wallet.address}</p>
            <p className="font-mono text-[10px] text-[#6B7280] mt-0.5 truncate">
              ActorId: {wallet.decodedAddress.slice(0, 14)}…{wallet.decodedAddress.slice(-8)}
            </p>
          </div>

          {accounts.length > 1 && (
            <div className="py-2 border-b border-[#E6E8E5]/60">
              <p className="text-[10px] font-mono uppercase text-[#6B7280] mb-1.5">Switch Account</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {accounts.map((acc) => (
                  <button
                    key={acc.address}
                    type="button"
                    onClick={() => {
                      selectAccount(acc.address);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg font-mono text-[11px] flex items-center justify-between ${
                      acc.address === wallet.address
                        ? 'bg-[#E6F4ED] text-[#136F46] font-semibold'
                        : 'hover:bg-[#F4F5F2] text-[#6B7280]'
                    }`}
                  >
                    <span className="truncate">{acc.name} ({acc.address.slice(0, 6)}…)</span>
                    <span>{acc.varaBalance.toFixed(1)} VARA</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 space-y-1">
            <Link
              href="/protocol-overview"
              onClick={() => setOpen(false)}
              className="block w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#E6F4ED] text-[#136F46] font-medium"
            >
              ↗ View My Portfolio & Positions
            </Link>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(wallet.address);
                toast.success('Copied Vara SS58 address');
                setOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F4F5F2] text-[#6B7280]"
            >
              Copy SS58 Address
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(wallet.decodedAddress);
                toast.success('Copied 0x ActorId');
                setOpen(false);
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F4F5F2] text-[#6B7280]"
            >
              Copy 0x ActorId (Hex)
            </button>
            <a
              href={`https://vara.subscan.io/account/${wallet.address}`}
              target="_blank"
              rel="noreferrer"
              className="block w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#F4F5F2] text-[#6B7280]"
            >
              View Wallet on Subscan ↗
            </a>
            <button
              type="button"
              onClick={() => {
                disconnect();
                setOpen(false);
                toast.info('Wallet disconnected');
              }}
              className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-red-50 text-red-600 font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
