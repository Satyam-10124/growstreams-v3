'use client';

import { useEffect, useState } from 'react';
import { X, Coins, CheckCircle, ArrowUpFromLine, Waves, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const CardSwap = dynamic(() => import('@/components/ui/CardSwap').then(m => m.default), { ssr: false });
const CardItem = dynamic(() => import('@/components/ui/CardSwap').then(m => {
  const C = m.Card;
  return { default: C };
}), { ssr: false });

const WELCOME_SEEN_KEY = 'growstreams_welcome_seen';

const steps = [
  {
    icon: Coins,
    step: '1',
    title: 'Mint GROW Tokens',
    desc: 'Head to the GROW Token page and tap the faucet to get 1,000 free testnet tokens instantly.',
    color: 'bg-gradient-to-br from-forest to-[#2c4318]',
    accent: 'text-moss',
    border: 'border-moss/25',
    href: '/app/grow',
    dark: true,
  },
  {
    icon: CheckCircle,
    step: '2',
    title: 'Approve & Deposit',
    desc: 'Approve the TokenVault to spend your GROW, then deposit tokens into your vault escrow balance.',
    color: 'bg-gradient-to-br from-forest to-[#2c4318]',
    accent: 'text-forest',
    border: 'border-forest/20',
    href: '/app/grow',
    dark: true,
  },
  {
    icon: ArrowUpFromLine,
    step: '3',
    title: 'Fund Your Vault',
    desc: 'Your vault holds tokens in escrow. Deposited funds are available for streaming to any address.',
    color: 'bg-gradient-to-br from-forest to-[#2c4318]',
    accent: 'text-clay-dark',
    border: 'border-clay/30',
    href: '/app/vault',
    dark: true,
  },
  {
    icon: Waves,
    step: '4',
    title: 'Create a Stream',
    desc: 'Pick a receiver, set a flow rate (tokens per second), and start streaming. Tokens flow in real-time on-chain.',
    color: 'bg-gradient-to-br from-forest to-[#2c4318]',
    accent: 'text-lemongrass',
    border: 'border-forest/40',
    href: '/app/streams',
    dark: true,
  },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  // Show only on first connect/visit (once per browser)
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(WELCOME_SEEN_KEY)) setOpen(true);
    } catch {
      // localStorage unavailable — don't block the page
    }
  }, []);

  const dismiss = () => {
    try {
      window.localStorage.setItem(WELCOME_SEEN_KEY, '1');
    } catch {
      // ignore
    }
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={dismiss} />

      <div className="relative z-10 gs-app-dark rounded-xl max-w-[860px] w-full shadow-2xl overflow-hidden" style={{ background: '#0c1018', border: '1px solid #1a2030' }}>
        <div className="px-6 py-4 border-b flex items-center justify-between" style={{ background: 'rgba(8,11,16,0.5)', borderColor: '#1a2030' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex items-center justify-center shadow-md" style={{ background: 'rgba(0,201,163,0.1)', color: '#00c9a3', border: '1px solid rgba(0,201,163,0.2)' }}>
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-white" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Welcome to GrowStreams</h2>
              <p className="text-xs" style={{ color: '#6a8090' }}>Real-time per-second token streaming on Vara Network</p>
            </div>
          </div>
          <button onClick={dismiss} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors" style={{ color: '#4a6070' }} aria-label="Close welcome dialog" onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#4a6070'; }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-row gap-8 px-6 py-4">
          <div className="flex-1 space-y-3">
            <p className="text-sm leading-relaxed" style={{ color: '#e2e8f0' }}>
              Stream GROW tokens per-second to any address on Vara. Get started in 4 steps:
            </p>

            <div className="space-y-1.5">
              {steps.map(({ icon: Icon, step, title, desc, href }) => (
                <Link
                  key={step}
                  href={href}
                  onClick={dismiss}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-150 group"
                  style={{ background: 'rgba(12,16,24,0.5)', borderColor: '#1a2030' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(0,163,130,0.1)';
                    (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,163,130,0.3)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background = 'rgba(12,16,24,0.5)';
                    (e.currentTarget as HTMLElement).style.borderColor = '#1a2030';
                  }}
                >
                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,201,163,0.1)', color: '#00c9a3', border: '1px solid rgba(0,201,163,0.2)' }}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold flex items-center gap-1.5 text-white">
                      <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: '#00c9a3' }}>Step {step}</span>
                      {title}
                    </p>
                    <p className="text-[10px] mt-0.5 leading-snug" style={{ color: '#6a8090' }}>{desc}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 transition-colors flex-shrink-0" style={{ color: '#3a4a5a' }} />
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center w-[280px] flex-shrink-0">
            <div className="relative mt-12" style={{ width: 220, height: 260 }}>
              <CardSwap
                width={170}
                height={200}
                cardDistance={25}
                verticalDistance={35}
                delay={3500}
                pauseOnHover
                skewAmount={3}
                easing="elastic"
              >
                {steps.map(({ icon: Icon, step, title, desc }) => (
                  <CardItem key={step}>
                    <div className="w-full h-full p-4 flex flex-col justify-between rounded-xl border" style={{ background: '#080b10', borderColor: '#1a2030', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                      <div>
                        <div className="w-10 h-10 rounded-md flex items-center justify-center mb-2.5" style={{ background: 'rgba(0,201,163,0.1)', color: '#00c9a3', border: '1px solid rgba(0,201,163,0.2)' }}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="font-mono text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: '#00c9a3' }}>
                          Step {step}
                        </p>
                        <h3 className="text-[13px] font-bold text-white leading-tight">{title}</h3>
                      </div>
                      <p className="text-[9px] leading-snug" style={{ color: '#6a8090' }}>{desc}</p>
                    </div>
                  </CardItem>
                ))}
              </CardSwap>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex items-center justify-between" style={{ background: 'rgba(8,11,16,0.8)', borderColor: '#1a2030' }}>
          <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: '#3a4a5a' }}>Vara Testnet</p>
          <Link
            href="/app/grow"
            onClick={dismiss}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ background: '#00c9a3', color: '#000', boxShadow: '0 4px 14px rgba(0,201,163,0.3)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = '#00dfb5';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = '#00c9a3';
            }}
          >
            Get Started <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
