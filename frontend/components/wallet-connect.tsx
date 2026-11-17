'use client';

import { Wallet } from '@gear-js/wallet-connect';
import { useApi } from '@gear-js/react-hooks';
import { Waves } from 'lucide-react';

import React from 'react';

function ArrowMark({ className = '', style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 22 16" fill="none" aria-hidden>
      <path d="M2.0326 15.6442L5.93597e-07 13.5799L9.02336e-08 2.0643L2.0326 -8.88478e-08L21.48 7.27606L21.48 8.36816L2.0326 15.6442Z" fill="currentColor" />
    </svg>
  );
}

export default function WalletConnect() {
  const { isApiReady } = useApi();

  return (
    <div className="gs-app min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#080b10' }}>
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0,163,130,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,163,130,0.04) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        {/* Ambient glow */}
        <div
          className="absolute"
          style={{
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60vw', height: '60vh',
            background: 'radial-gradient(ellipse, rgba(0,201,163,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div className="relative max-w-md w-full z-10">

        <div className="p-8 text-center rounded-2xl border" style={{ background: '#0c1018', borderColor: '#1a2030', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)' }}>
          <div className="mx-auto mb-5 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'rgba(0,201,163,0.1)', color: '#00c9a3', border: '1px solid rgba(0,201,163,0.2)' }}>
            <Waves className="w-8 h-8" />
          </div>
          
          <p className="inline-block px-3 py-1 text-[10px] font-mono tracking-widest uppercase rounded-full mb-4" style={{ background: 'rgba(0,201,163,0.1)', color: '#00c9a3', border: '1px solid rgba(0,201,163,0.2)' }}>
            VARA TESTNET
          </p>
          
          <h1 className="text-3xl font-light mb-3 text-white tracking-tight" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            GrowStreams
          </h1>
          
          <p className="text-sm mb-8" style={{ color: '#6a8090' }}>
            Connect your Vara wallet to start streaming tokens in real-time.
          </p>

          <div className="flex justify-center [&_*]:!text-white [&_button]:!bg-white/10 [&_button]:!border-white/20 [&_button:hover]:!bg-white/20">
            {isApiReady ? (
              <Wallet theme="vara" displayBalance />
            ) : (
              <span className="inline-block px-4 py-2 rounded-lg text-sm font-mono tracking-wider animate-pulse" style={{ background: '#1a2030', color: '#4a6070' }}>
                CONNECTING TO VARA...
              </span>
            )}
          </div>

          <p className="text-[10px] font-mono tracking-widest uppercase mt-8" style={{ color: '#3a4a5a' }}>
            Secure Connection
          </p>
        </div>
      </div>
    </div>
  );
}
