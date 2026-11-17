"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import LearnTerminal from './LearnTerminal';
import EarnBountyBoard from './EarnBountyBoard';
import BurnStreamTracker from './BurnStreamTracker';
import Providers from '@/components/providers';

// Pre-computed star data to avoid hydration mismatch (no Math.random on render)
const STARS = [
  { x: 8, y: 12, size: 1, delay: 0.4, dur: 2.8 },
  { x: 15, y: 45, size: 1.5, delay: 1.2, dur: 3.5 },
  { x: 23, y: 28, size: 1, delay: 0.8, dur: 2.2 },
  { x: 31, y: 72, size: 1, delay: 2.1, dur: 4.0 },
  { x: 38, y: 8, size: 1.5, delay: 0.2, dur: 2.6 },
  { x: 44, y: 58, size: 1, delay: 1.7, dur: 3.1 },
  { x: 52, y: 35, size: 1, delay: 0.9, dur: 2.9 },
  { x: 57, y: 85, size: 1.5, delay: 2.4, dur: 3.8 },
  { x: 63, y: 19, size: 1, delay: 0.5, dur: 2.4 },
  { x: 69, y: 63, size: 1, delay: 1.5, dur: 3.3 },
  { x: 75, y: 42, size: 1.5, delay: 2.8, dur: 4.2 },
  { x: 81, y: 76, size: 1, delay: 0.7, dur: 2.7 },
  { x: 87, y: 22, size: 1, delay: 1.9, dur: 3.6 },
  { x: 92, y: 54, size: 1.5, delay: 1.1, dur: 2.3 },
  { x: 96, y: 88, size: 1, delay: 3.1, dur: 4.5 },
  { x: 12, y: 91, size: 1, delay: 1.6, dur: 3.2 },
  { x: 27, y: 5, size: 1.5, delay: 0.3, dur: 2.5 },
  { x: 49, y: 50, size: 1, delay: 2.2, dur: 3.9 },
  { x: 73, y: 95, size: 1, delay: 0.6, dur: 2.1 },
  { x: 85, y: 33, size: 1.5, delay: 1.8, dur: 3.4 },
  { x: 5,  y: 68, size: 1, delay: 2.6, dur: 4.1 },
  { x: 41, y: 15, size: 1, delay: 1.0, dur: 2.8 },
  { x: 60, y: 78, size: 1.5, delay: 3.3, dur: 4.6 },
  { x: 78, y: 48, size: 1, delay: 1.4, dur: 3.0 },
  { x: 90, y: 10, size: 1, delay: 2.0, dur: 3.7 },
];

export default function AgenticDashboard() {
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [bountyProgress, setBountyProgress] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'earn' | 'burn'>('earn');
  const [mobilePaneView, setMobilePaneView] = useState<'left' | 'right'>('left');

  useEffect(() => {
    const saved = localStorage.getItem('growstreams_bounty_progress');
    if (saved) {
      try { setBountyProgress(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleMessageSent = (bountyId: string) => {
    setBountyProgress(prev => {
      const next = { ...prev, [bountyId]: (prev[bountyId] || 0) + 1 };
      localStorage.setItem('growstreams_bounty_progress', JSON.stringify(next));
      return next;
    });
  };

  const handleStartLearning = (bountyId: string) => {
    setSelectedBountyId(bountyId);
    // Auto-switch to AI chat pane on mobile when a bounty is selected
    setMobilePaneView('right');
  };

  return (
    <Providers>
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }
        @keyframes nebula-drift {
          0%, 100% { opacity: 0.06; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.12; transform: translate(8px, -4px) scale(1.05); }
        }

        /* ── Mobile pane toggle ── */
        .gs-agentic-pane-toggle {
          display: none;
        }
        .gs-agentic-body {
          display: grid;
          grid-template-columns: 1fr 1.8fr;
          height: 520px;
          min-height: 0;
        }
        .gs-agentic-left {
          border-right: 1px solid rgba(34,197,94,0.1);
          display: flex;
          flex-direction: column;
          min-height: 0;
        }
        .gs-agentic-right {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }

        @media (max-width: 767px) {
          .gs-agentic-pane-toggle {
            display: flex;
            border-bottom: 1px solid rgba(34,197,94,0.15);
            background: rgba(6,12,10,0.98);
          }
          .gs-agentic-pane-toggle button {
            flex: 1;
            padding: 10px 0;
            border: none;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s ease;
            background: transparent;
          }
          .gs-agentic-body {
            display: flex;
            flex-direction: column;
            height: auto;
            min-height: 480px;
          }
          .gs-agentic-left {
            border-right: none;
            border-bottom: 1px solid rgba(34,197,94,0.1);
            flex: 1;
            min-height: 400px;
          }
          .gs-agentic-right {
            flex: 1;
            min-height: 400px;
          }
          .gs-agentic-left.gs-mobile-hidden,
          .gs-agentic-right.gs-mobile-hidden {
            display: none;
          }
          .gs-hw-bar__title {
            display: none;
          }
        }
      `}</style>

      <div
        className="gs-hero-widget"
        style={{
          maxWidth: '100%',
          fontFamily: "'SN Pro Variable', 'SF Mono', 'Fira Code', monospace",
          position: 'relative',
          overflow: 'hidden',
          background: 'rgba(6, 12, 10, 0.96)',
        }}
      >
        {/* ── Starfield layer ── */}
        <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          {/* Nebula glow blob */}
          <div style={{
            position: 'absolute',
            width: '420px',
            height: '280px',
            right: '-60px',
            bottom: '-40px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(2,215,178,0.07) 0%, transparent 70%)',
            animation: 'nebula-drift 8s ease-in-out infinite',
          }} />
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '200px',
            left: '-30px',
            top: '-20px',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(34,197,94,0.05) 0%, transparent 70%)',
            animation: 'nebula-drift 11s ease-in-out infinite reverse',
          }} />

          {/* Stars */}
          {STARS.map((s, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${s.x}%`,
                top: `${s.y}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                borderRadius: '50%',
                background: i % 5 === 0 ? 'rgba(2,215,178,0.9)' : 'rgba(255,255,255,0.8)',
                boxShadow: i % 5 === 0
                  ? '0 0 3px rgba(2,215,178,0.6)'
                  : '0 0 2px rgba(255,255,255,0.4)',
                animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>

        {/* ── Content (above starfield) ── */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Top bar */}
          <div className="gs-hw-bar">
            <span className="gs-hw-bar__dot" style={{ background: '#ff5f57' }} />
            <span className="gs-hw-bar__dot" style={{ background: '#febc2e' }} />
            <span className="gs-hw-bar__dot" style={{ background: '#28c840' }} />
            <span className="gs-hw-bar__title">growstreams://agentic-workspace</span>
            <div className="gs-hw-bar__status">
              <span className="gs-hw-status-dot" />
              LIVE
            </div>
          </div>

          {/* Dedicated /agents page banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 255, 194, 0.08)',
            borderBottom: '1px solid rgba(0, 255, 194, 0.2)',
            padding: '9px 18px',
            fontSize: '11.5px',
            color: '#ecfdf5',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#00ffc2', fontWeight: 700 }}>🤖 AI AGENT SOCIETY (ACP) & PROTOCOL DASHBOARD:</span>
              <span style={{ color: '#94a3b8' }}>Now on a dedicated, full-width interface.</span>
            </div>
            <Link
              href="/agents"
              style={{
                background: '#00ffc2',
                color: '#080b10',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '6px',
                textDecoration: 'none',
                fontSize: '11.5px',
                boxShadow: '0 2px 8px rgba(0,255,194,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Explore /agents →
            </Link>
          </div>

          {/* Mobile pane toggle — only visible on mobile */}
          <div className="gs-agentic-pane-toggle">
            <button
              onClick={() => setMobilePaneView('left')}
              style={{
                background: mobilePaneView === 'left' ? 'rgba(34,197,94,0.08)' : 'transparent',
                borderBottom: mobilePaneView === 'left' ? '2px solid #22c55e' : '2px solid transparent',
                color: mobilePaneView === 'left' ? '#22c55e' : 'rgba(255,255,255,0.3)',
                fontFamily: 'inherit',
              }}
            >
              📋 Workspace
            </button>
            <button
              onClick={() => setMobilePaneView('right')}
              style={{
                background: mobilePaneView === 'right' ? 'rgba(34,197,94,0.08)' : 'transparent',
                borderBottom: mobilePaneView === 'right' ? '2px solid #22c55e' : '2px solid transparent',
                color: mobilePaneView === 'right' ? '#22c55e' : 'rgba(255,255,255,0.3)',
                fontFamily: 'inherit',
              }}
            >
              🤖 AI Chat
            </button>
          </div>

          {/* Body: split layout (desktop) / pane view (mobile) */}
          <div className="gs-agentic-body">

            {/* Left pane: tabbed Earn / Burn */}
            <div className={`gs-agentic-left${mobilePaneView === 'right' ? ' gs-mobile-hidden' : ''}`}>
              {/* Tab switcher */}
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
                {(['earn', 'burn'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      background: activeTab === tab ? 'rgba(34,197,94,0.08)' : 'transparent',
                      border: 'none',
                      borderBottom: activeTab === tab ? '2px solid #22c55e' : '2px solid transparent',
                      color: activeTab === tab ? '#22c55e' : 'rgba(255,255,255,0.3)',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                    }}
                  >
                    {tab === 'earn' ? '01 BOUNTIES' : '02 STREAMS'}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: activeTab === 'earn' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  <EarnBountyBoard
                    onStartLearning={handleStartLearning}
                    activeBountyId={selectedBountyId}
                    bountyProgress={bountyProgress}
                  />
                </div>
                <div style={{ display: activeTab === 'burn' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                  <BurnStreamTracker />
                </div>
              </div>
            </div>

            {/* Right pane: Learn Terminal */}
            <div className={`gs-agentic-right${mobilePaneView === 'left' ? ' gs-mobile-hidden' : ''}`}>
              <LearnTerminal bountyId={selectedBountyId} onMessageSent={handleMessageSent} />
            </div>

          </div>
        </div>
      </div>
    </Providers>
  );

}
