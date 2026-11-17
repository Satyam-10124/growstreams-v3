"use client";

import { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/growstreams-api';
import gsap from 'gsap';
import { useAccount } from '@gear-js/react-hooks';
import { Wallet } from '@gear-js/wallet-connect';

interface LearnTerminalProps {
  bountyId?: string | null;
  onMessageSent?: (bountyId: string) => void;
}

type Message = { role: 'system' | 'user' | 'agent'; content: string };

export default function LearnTerminal({ bountyId, onMessageSent }: LearnTerminalProps) {
  const { account } = useAccount();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'system', content: 'GROWSTREAMS MASTER TUTOR v1.0' },
    { role: 'system', content: 'Select a course below to initialize your session.' },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Entry animation — B7 fix: use gsap.set so GSAP fully owns opacity
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(containerRef.current, { opacity: 0, y: 32 });
      gsap.to(containerRef.current, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 });
    });
    return () => ctx.revert();
  }, []);

  // B9 fix: reset session when the user picks a different bounty
  useEffect(() => {
    if (sessionId) {
      // End the old session silently
      api.agentic.learn.endSession(sessionId).catch(() => {});
    }
    setSessionId(null);
    setInput('');
    setMessages([
      { role: 'system', content: 'GROWSTREAMS MASTER TUTOR v1.0' },
      bountyId
        ? { role: 'system', content: `> Course loaded. Run connect_wallet --start-session to begin.` }
        : { role: 'system', content: 'Select a course below to initialize your session.' },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bountyId]);

  // Blinking cursor
  useEffect(() => {
    if (!cursorRef.current) return;
    const tl = gsap.to(cursorRef.current, {
      opacity: 0, duration: 0.5, repeat: -1, yoyo: true, ease: 'steps(1)',
    });
    return () => { tl.kill(); };
  }, [sessionId]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages]);

  // Animate new messages in
  useEffect(() => {
    if (!terminalRef.current) return;
    const lines = terminalRef.current.querySelectorAll('[data-line]');
    const lastLine = lines[lines.length - 1];
    if (lastLine) {
      gsap.fromTo(lastLine,
        { opacity: 0, x: -8 },
        { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [messages]);

  const handleStartSession = async () => {
    setIsStarting(true);
    setMessages(prev => [...prev, { role: 'system', content: '> Connecting to Master Tutor...' }]);
    try {
      // @ts-ignore
      const res = await api.agentic.learn.startSession({ walletAddress: account?.decodedAddress || '', bountyId });
      setSessionId(res.sessionId);
      if (res.initialGreeting) {
        setMessages(prev => [...prev, { role: 'agent', content: res.initialGreeting as string }]);
      } else {
        setMessages(prev => [...prev, { role: 'agent', content: 'Welcome. Session is live. How can I guide you?' }]);
      }
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'system', content: `> ERROR: ${err}` }]);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !sessionId || isLoading || !account) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const res = await api.agentic.learn.submitAnswer(sessionId, {
        walletAddress: account.decodedAddress,
        message: userMessage,
      }) as { reply: string; isGoodMessage?: boolean };
      
      setMessages(prev => [...prev, { role: 'agent', content: res.reply }]);
      
      if (bountyId && onMessageSent && res.isGoodMessage) {
        onMessageSent(bountyId);
      } else if (res.isGoodMessage === false) {
        setMessages(prev => [...prev, { role: 'system', content: '// Response flagged as poor quality. This message will not count towards your claim progress.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'system', content: '> ERROR: Agent unreachable. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'transparent', fontFamily: "'SN Pro Variable', 'SF Mono', 'Fira Code', monospace" }} onClick={() => inputRef.current?.focus()}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(34,197,94,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>TUTOR TERMINAL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '9px', fontWeight: 700, color: sessionId ? '#22c55e' : 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: sessionId ? '#22c55e' : 'rgba(255,255,255,0.15)', display: 'inline-block', animation: sessionId ? 'gs-status-pulse 1.5s ease-in-out infinite' : 'none' }} />
          {sessionId ? 'SESSION ACTIVE' : 'IDLE'}
        </div>
      </div>

      {/* Terminal window */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* Messages */}
        <div
          ref={terminalRef}
          style={{ padding: '16px', fontSize: '12px', overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,197,94,0.15) transparent', lineHeight: 1.7 }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} data-line style={{ marginBottom: '8px', display: 'flex', gap: '6px' }}>
              <span style={{ flexShrink: 0, color: msg.role === 'system' ? 'rgba(255,255,255,0.15)' : msg.role === 'agent' ? 'rgba(34,197,94,0.5)' : '#22c55e', fontSize: '11px' }}>
                {msg.role === 'system' ? '//' : msg.role === 'agent' ? '⟶' : '›'}
              </span>
              <span style={{ color: msg.role === 'system' ? 'rgba(255,255,255,0.2)' : msg.role === 'agent' ? 'rgba(255,255,255,0.75)' : '#86efac' }}>
                {msg.content}
              </span>
            </div>
          ))}
          {isLoading && (
            <div data-line style={{ marginBottom: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: 'rgba(34,197,94,0.5)', fontSize: '11px' }}>⟶</span>
              <span style={{ color: '#22c55e', fontSize: '11px' }} className="animate-pulse">Processing</span>
              <span style={{ display: 'flex', gap: '3px', marginLeft: '4px' }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: `bounce 0.6s ${i * 0.15}s ease-in-out infinite alternate` }} />
                ))}
              </span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>        {/* Input area */}
        <div style={{ borderTop: '1px solid rgba(34,197,94,0.1)', background: 'rgba(0,0,0,0.3)', padding: '12px 16px' }}>
          {!bountyId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>{'// '}</span>
              <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Select a bounty to activate a session</span>
              <span ref={cursorRef} style={{ color: '#22c55e', fontSize: '12px' }}>▋</span>
            </div>
          ) : !account ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>{'// '}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>Connect your wallet to start</span>
                <span ref={cursorRef} style={{ color: '#22c55e', fontSize: '12px' }}>▋</span>
              </div>
              <div style={{ marginLeft: 'auto' }}><Wallet theme="vara" /></div>
            </div>
          ) : !sessionId ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22c55e', fontSize: '12px' }}>›</span>
              <button
                onClick={handleStartSession}
                disabled={isStarting}
                style={{ color: '#22c55e', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', fontFamily: 'inherit', opacity: isStarting ? 0.4 : 1 }}
              >
                {isStarting ? 'connecting...' : 'connect_wallet --start-session'}
              </button>
              <span ref={cursorRef} style={{ color: '#22c55e', fontSize: '12px' }}>▋</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#22c55e', fontSize: '12px', flexShrink: 0 }}>›</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={isLoading}
                autoComplete="off"
                spellCheck={false}
                placeholder="Type your response..."
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'rgba(255,255,255,0.8)', caretColor: '#22c55e', fontSize: '12px', fontFamily: 'inherit' }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', cursor: 'pointer', padding: '4px 12px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'inherit', transition: 'all 0.2s', opacity: (!input.trim() || isLoading) ? 0.3 : 1 }}
              >
                SEND
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
