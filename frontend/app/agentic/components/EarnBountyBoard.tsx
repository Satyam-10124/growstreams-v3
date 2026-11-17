"use client";

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/growstreams-api';
import gsap from 'gsap';

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward_amount: string;
  status: string;
  wallet_claimed?: boolean;
}

import { useAccount } from '@gear-js/react-hooks';

const DUMMY_WALLET = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

interface EarnBountyBoardProps {
  onStartLearning?: (id: string) => void;
  activeBountyId?: string | null;
  bountyProgress?: Record<string, number>;
}

function BountySkeleton() {
  return (
    <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '8px', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', width: '60%', marginBottom: '10px' }} />
      <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', width: '90%', marginBottom: '6px' }} />
      <div style={{ height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,0.04)', width: '70%' }} />
    </div>
  );
}

export default function EarnBountyBoard({ onStartLearning, activeBountyId, bountyProgress }: EarnBountyBoardProps) {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const { account } = useAccount();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(containerRef.current, { opacity: 0 });
      gsap.to(containerRef.current, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.15 });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    fetchBounties();
  }, [account?.decodedAddress]);

  const fetchBounties = async () => {
    try {
      // Pass wallet so backend annotates per-wallet claim status
      const walletParam = account?.decodedAddress ? `?wallet=${account.decodedAddress}` : '';
      // @ts-ignore
      const data = await api.agentic.earn.listBounties(walletParam);
      setBounties(data as Bounty[]);
    } catch (err) {
      console.error('Failed to fetch bounties', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async (id: string) => {
    setClaimingId(id);
    try {
      const targetWallet = account?.decodedAddress || DUMMY_WALLET;
      await api.agentic.earn.claimBounty(id, { walletAddress: targetWallet });
      // Mark only THIS wallet's claim locally — bounty stays open for others
      setBounties(prev => prev.map(b => b.id === id ? { ...b, wallet_claimed: true } : b));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bountyClaimed'));
      }
    } catch (err: any) {
      if (err?.status === 409 || (err?.message || '').includes('409')) {
        // Already claimed by this wallet — just update local state
        setBounties(prev => prev.map(b => b.id === id ? { ...b, wallet_claimed: true } : b));
      } else {
        console.error('Failed to claim bounty', err);
      }
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, fontFamily: "'SN Pro Variable', 'SF Mono', 'Fira Code', monospace" }}>
      {/* Section header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(34,197,94,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>BOUNTIES</span>
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.08em' }}>
          {!isLoading && `${bounties.filter(b => b.status === 'open').length} OPEN`}
        </span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(34,197,94,0.15) transparent' }}>
        {isLoading ? (
          <>{[1,2,3].map(i => <BountySkeleton key={i} />)}</>
        ) : bounties.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', padding: '24px 0' }}>// No active bounties</p>
        ) : (
          bounties.map((bounty) => {
            const isActive = activeBountyId === bounty.id;
            const msgCount = bountyProgress?.[bounty.id] || 0;
            const canClaim = msgCount >= 3;
            const walletClaimed = bounty.wallet_claimed;

            return (
              <div
                key={bounty.id}
                className="gs-hw-row"
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '12px',
                  gap: '8px',
                  marginBottom: '6px',
                  border: isActive ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.04)',
                  background: isActive ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)',
                }}
              >
                {/* Top row: status + reward */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className={`gs-hw-row__dot gs-hw-row__dot--active`}
                    />
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e' }}>
                      OPEN
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#86efac', fontVariantNumeric: 'tabular-nums' }}>
                    +{bounty.reward_amount} VARA
                  </span>
                </div>

                {/* Title */}
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>
                  {bounty.title}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
                  {bounty.description}
                </p>

                {/* Progress bar - only show if wallet hasn't claimed yet */}
                {!walletClaimed && (
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
                      <span>PROGRESS</span>
                      <span>{msgCount}/3 MSG</span>
                    </div>
                    <div className="gs-bar__track">
                      <div className="gs-bar__fill" style={{ width: `${Math.min(100, (msgCount / 3) * 100)}%`, transition: 'width 0.4s ease' }} />
                    </div>
                  </div>
                )}

                {/* Actions */}
                {walletClaimed ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}>
                    <span style={{ fontSize: '9px' }}>✓</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#22c55e' }}>CLAIMED BY YOU</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    {onStartLearning && (
                      <button
                        onClick={() => onStartLearning(bounty.id)}
                        style={{
                          flex: 1,
                          padding: '6px 0',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          background: isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
                          border: `1px solid ${isActive ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                          color: isActive ? '#22c55e' : 'rgba(255,255,255,0.35)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isActive ? '● ACTIVE' : 'START'}
                      </button>
                    )}
                    <button
                      onClick={() => handleClaim(bounty.id)}
                      disabled={claimingId === bounty.id || !canClaim}
                      style={{
                        padding: '6px 14px',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        background: canClaim ? 'rgba(34,197,94,0.15)' : 'transparent',
                        border: `1px solid ${canClaim ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
                        color: canClaim ? '#22c55e' : 'rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        cursor: canClaim ? 'pointer' : 'not-allowed',
                        opacity: claimingId === bounty.id ? 0.5 : 1,
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {claimingId === bounty.id ? '...' : 'CLAIM'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
