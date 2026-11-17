'use client';

import React, { useEffect, useState, useRef } from 'react';

// --- Types & Data ---
type FeedEvent = {
  id: string;
  n: string; // name
  t: string; // text action
  a: string; // amount
  ago: string;
  ts: number; // timestamp for sorting/fading
};

const E_POOL = [
  ['alice.eth', 'received a grant stream', '4.1 GROW/s'],
  ['dev-dao.eth', 'opened a builder stream', '1.8 GROW/s'],
  ['core-team.eth', 'rewarded 14 contributors', '1,250 GROW'],
  ['mira.eth', 'joined the open source fund', '+1 connection'],
  ['protocol-dao.eth', 'started a 12-month incentive', '4,500 GROW/mo'],
  ['kai.eth', 'claimed their rewards', '320 GROW'],
  ['north.eth', 'funded a community bounty', '900 GROW']
];

// --- Hook ---
function useGardenEvents() {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let idCounter = 0;

    // Pre-seed 5 events
    const initEvents: FeedEvent[] = [];
    
    for (let i = 0; i < 5; i++) {
      const eData = E_POOL[i];
      const id = `ev-${idCounter++}`;
      initEvents.push({
        id, n: eData[0], t: eData[1], a: eData[2], ago: ['2m', '5m', '9m', '12m', '18m'][i] + ' ago', ts: Date.now() - i * 10000
      });
    }
    
    setEvents(initEvents);

    let iPool = 5;
    const RM = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    if (RM) return;

    let interval = setInterval(() => {
      const nextData = E_POOL[iPool % E_POOL.length];
      const newId = `ev-${idCounter++}`;
      
      setEvents(prev => {
        const next = [{ id: newId, n: nextData[0], t: nextData[1], a: nextData[2], ago: 'just now', ts: Date.now() }, ...prev];
        return next.slice(0, 5);
      });

      iPool++;
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return { events, containerRef };
}

// --- Components ---

const ActivityFeed = ({ events }: { events: FeedEvent[] }) => {
  return (
    <ul className="feed-list" role="list">
      {events.map((ev: FeedEvent, i: number) => (
        <li 
          key={ev.id} 
          className="feed-item"
        >
          <div className="avatar">
            {ev.n[0].toUpperCase()}
          </div>
          <div className="feed-content">
            <div className="feed-main">
              <span className="feed-name">{ev.n}</span> <span className="feed-action">{ev.t}</span>
            </div>
            <div className="feed-meta">{ev.ago}</div>
          </div>
          <div className="feed-amount">{ev.a}</div>
        </li>
      ))}
    </ul>
  );
};

export function CommunityGardenSection() {
  const { events, containerRef } = useGardenEvents();

  return (
    <section className="cg-wrapper" ref={containerRef}>
      <style>{`
        .cg-wrapper { background: var(--paper); padding: 80px 0 140px; }
        .cg-container { max-width: 1200px; margin: 0 auto; padding: 0 1.25rem; display: grid; grid-template-columns: 1fr 1fr; gap: 5rem; align-items: stretch; }
        
        .cg-header h2 { font: 600 clamp(1.8rem, 3.6vw, 2.7rem)/1.05 var(--d); letter-spacing: -.03em; margin: 0 0 2rem; color: var(--txt); display: flex; align-items: center; justify-content: space-between; }
        .badge { font: 700 0.75rem var(--d); color: var(--em); background: rgba(94, 234, 212, 0.15); padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
        .live-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--em); display: inline-block; animation: pulse-dot 1.8s ease-in-out infinite; margin-left: 12px; vertical-align: middle; position: relative; top: -1px; }
        @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(.7); } }
        
        /* Left Side: Feed */
        .feed-list { list-style: none; margin: 0; padding: 0; position: relative; }
        .feed-item { display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem 0; border-top: 1px solid rgba(12,26,23,.08); animation: slideDown 0.5s ease-out; transition: background 0.3s; cursor: default; }
        .feed-item:last-child { border-bottom: 1px solid rgba(12,26,23,.08); }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-14px); } to { opacity: 1; transform: translateY(0); } }
        
        .feed-item:hover, .feed-item:focus-visible { background: rgba(12,26,23,0.02); outline: none; }
        
        .feed-item .avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--sage); display: grid; place-items: center; font: 600 1rem var(--d); color: var(--txt); flex-shrink: 0; transition: transform 0.3s, box-shadow 0.3s; }
        .feed-item:hover .avatar { transform: scale(1.1); box-shadow: 0 0 0 2px var(--em); }
        
        .feed-content { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 0.2rem; }
        .feed-main { font-size: 1rem; color: var(--txt); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
        .feed-name { font: 600 1.05rem var(--d); color: var(--em); }
        .feed-action { opacity: 0.9; }
        .feed-meta { font-size: 0.85rem; color: var(--mut); }
        
        .feed-amount { font: 700 1.05rem var(--d); color: #0b7a56; white-space: nowrap; flex-shrink: 0; font-variant-numeric: tabular-nums; text-align: right; }

        /* Right Side: Protocol Engine */
        .engine-side { padding-top: 0.5rem; display: flex; flex-direction: column; }
        .engine-desc { font-size: 1.1rem; line-height: 1.6; color: var(--mut); margin-bottom: 2rem; }
        
        .engine-tags { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-bottom: 3rem; }
        .tag { font: 500 0.9rem var(--d); color: #0b7a56; background: rgba(16, 185, 129, 0.1); padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); }
        
        .engine-terminal { margin-top: auto; background: #0c1a17; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.9rem; color: var(--paper); box-shadow: 0 10px 30px rgba(12,26,23,0.1); }
        .term-prompt { color: var(--em); margin-right: 0.5rem; }
        .term-cmd { color: #fff; }
        .term-status { color: var(--em); font-weight: 700; font-size: 0.85rem; }

        
        @media(max-width:900px) {
          .cg-container { grid-template-columns: 1fr; gap: 4rem; max-width: 700px; }
          .cg-header h2 { font-size: clamp(1.8rem, 7vw, 2.4rem); }
        }
        @media(max-width:600px) {
          .feed-item { flex-wrap: wrap; gap: 0.8rem; }
          .feed-amount { margin-left: auto; width: 100%; text-align: left; padding-left: 48px; margin-top: -10px;}
        }
        
        @media(prefers-reduced-motion:reduce) {
          .cg-wrapper * { animation: none !important; transition: none !important; }
        }
      `}</style>
      
      <div className="cg-container">
        {/* Left: Feed */}
        <div className="cg-left">
          <div className="cg-header">
            <h2>Real-Time Stream Feed <span className="badge">LIVE WS <span className="live-dot" aria-label="Live"></span></span></h2>
          </div>
          <ActivityFeed events={events} />
        </div>

        {/* Right: Modular Protocol Engine */}
        <div className="cg-right engine-side">
          <div className="cg-header">
            <h2>Modular Protocol Engine <span className="badge">WASM ACTORS</span></h2>
          </div>
          
          <p className="engine-desc">
            Plug GrowStreams into any smart contract or dApp on Vara Network. Stream creation, milestone vesting, and gasless withdrawals require zero lockup and zero custodial risk.
          </p>

          <div className="engine-tags">
            <div className="tag">Continuous Payroll</div>
            <div className="tag">Token Vesting</div>
            <div className="tag">Developer Bounties</div>
            <div className="tag">SaaS Subscriptions</div>
            <div className="tag">Revenue Share Pools</div>
          </div>

          <div className="engine-terminal">
            <div>
              <span className="term-prompt">$</span>
              <span className="term-cmd">vara_stream.open_stream(rate: 12.4)</span>
            </div>
            <div className="term-status">200 OK</div>
          </div>
        </div>
        
      </div>
    </section>
  );
}
