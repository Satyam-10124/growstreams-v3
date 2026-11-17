"use client";

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/growstreams-api';
import gsap from 'gsap';
import { useAccount } from '@gear-js/react-hooks';

interface Stream {
  id: string;
  stream_id: string;
  recipient: string;
  rate_per_sec: string;
  duration: number;
  started_at: string;
  status: string;
}

interface BurnStreamTrackerProps {
  wallet?: string;
}

function StreamRow({ stream }: { stream: Stream }) {
  const [earnedSoFar, setEarnedSoFar] = useState(0);
  const [isDepleted, setIsDepleted] = useState(false);
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rate = parseFloat(stream.rate_per_sec);
    const startMs = new Date(stream.started_at).getTime();
    const totalPayout = rate * stream.duration;

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startMs) / 1000;
      if (elapsed >= stream.duration) {
        setEarnedSoFar(totalPayout);
        setIsDepleted(true);
        clearInterval(interval);
      } else {
        setEarnedSoFar(elapsed * rate);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [stream]);

  useEffect(() => {
    if (!fillRef.current) return;
    const totalPayout = parseFloat(stream.rate_per_sec) * stream.duration;
    const pct = totalPayout > 0 ? Math.min(100, (earnedSoFar / totalPayout) * 100) : 0;
    gsap.to(fillRef.current, { width: `${pct}%`, duration: 0.1, ease: 'none' });
  }, [earnedSoFar, stream]);

  const totalPayout = parseFloat(stream.rate_per_sec) * stream.duration;

  return (
    <div className="gs-hw-row" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px', gap: '8px', marginBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className={`gs-hw-row__dot ${!isDepleted ? 'gs-hw-row__dot--active' : ''}`} style={isDepleted ? { background: 'rgba(255,255,255,0.15)' } : {}} />
          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: isDepleted ? 'rgba(255,255,255,0.2)' : '#22c55e' }}>
            {isDepleted ? 'COMPLETED' : 'STREAMING'}
          </span>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: isDepleted ? 'rgba(255,255,255,0.2)' : '#86efac', fontVariantNumeric: 'tabular-nums' }}>
          {earnedSoFar.toFixed(4)} VARA
        </span>
      </div>

      <div style={{ width: '100%' }}>
        <div className="gs-bar__track">
          <div ref={fillRef} className="gs-bar__fill" style={{ width: '0%', background: isDepleted ? 'rgba(255,255,255,0.1)' : 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
          {stream.stream_id.slice(0, 12)}…
        </span>
        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
          {parseFloat(stream.rate_per_sec).toFixed(6)} / s · {totalPayout.toFixed(2)} total
        </span>
      </div>
    </div>
  );
}

export default function BurnStreamTracker({ wallet }: BurnStreamTrackerProps) {
  const { account } = useAccount();
  const recipientAddress = wallet || account?.decodedAddress;
  const [streams, setStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(containerRef.current, { opacity: 0 });
      gsap.to(containerRef.current, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.25 });
    });
    return () => ctx.revert();
  }, []);

  const fetchStreams = async () => {
    if (!recipientAddress) { setStreams([]); setIsLoading(false); return; }
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.agentic.burn.getStream(recipientAddress) as { streams?: Stream[] };
      if (data.streams) setStreams(data.streams);
    } catch {
      setError('Could not reach backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStreams(); }, [recipientAddress]);

  useEffect(() => {
    const handler = () => fetchStreams();
    window.addEventListener('bountyClaimed', handler);
    return () => window.removeEventListener('bountyClaimed', handler);
  }, []);

  const activeCount = streams.filter(s => {
    const elapsed = (Date.now() - new Date(s.started_at).getTime()) / 1000;
    return elapsed < s.duration;
  }).length;

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'SN Pro Variable', 'SF Mono', 'Fira Code', monospace" }}>
      {/* Section header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(34,197,94,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>STREAMS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isLoading && (
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em' }}>
              {activeCount} ACTIVE
            </span>
          )}
          <button
            onClick={fetchStreams}
            disabled={isLoading}
            title="Refresh streams"
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.25)', opacity: isLoading ? 0.4 : 1, display: 'flex', alignItems: 'center' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-spin' : ''}>
              <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,197,94,0.15) transparent' }}>
        {isLoading ? (
          <>{[1, 2].map(i => (
            <div key={i} style={{ height: '80px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}</>
        ) : error ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ color: 'rgba(248,113,113,0.7)', fontSize: '11px', marginBottom: '10px' }}>// {error}</p>
            <button onClick={fetchStreams} style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              RETRY
            </button>
          </div>
        ) : streams.length === 0 ? (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', marginBottom: '6px' }}>// No active streams found</p>
            <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: '10px' }}>Submit a PR to begin streaming VARA</p>
          </div>
        ) : (
          streams.slice(0, 3).map(s => <StreamRow key={s.id} stream={s} />)
        )}
      </div>
    </div>
  );
}
