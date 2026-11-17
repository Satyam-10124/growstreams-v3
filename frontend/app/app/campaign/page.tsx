'use client';

import { useEffect, useState, useCallback } from 'react';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { api } from '@/lib/growstreams-api';
import {
  Trophy, GitBranch, Twitter, Zap, ArrowRight, CheckCircle,
  AlertCircle, Loader2, DollarSign, Users, Calendar, Star, PartyPopper, Crown,
} from 'lucide-react';
import Link from 'next/link';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';
import { StatGridSkeleton, PanelSkeleton } from '@/components/gsui/Skeleton';
import CountUp from '@/components/gsui/CountUp';

type Track = 'OSS' | 'CONTENT' | 'BOTH';

interface CampaignConfig {
  campaignStartDate: string | null;
  campaignEndDate: string | null;
  poolUSDC: number;
  scoreThreshold: number;
}

export default function CampaignPage() {
  const account = useActiveAccount();
  const [config, setConfig] = useState<CampaignConfig | null>(null);
  const [participant, setParticipant] = useState<Record<string, unknown> | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [track, setTrack] = useState<Track>('OSS');
  const [githubHandle, setGithubHandle] = useState('');
  const [xHandle, setXHandle] = useState('');

  const wallet = account?.decodedAddress || '';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, stats] = await Promise.all([
        api.campaign.config().catch(() => null),
        wallet ? api.campaign.participant(wallet).catch(() => null) : null,
      ]);
      if (cfg) setConfig(cfg as unknown as CampaignConfig);
      if (stats && (stats as Record<string, unknown>).participant) {
        setParticipant(stats as Record<string, unknown>);
        setIsRegistered(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRegister = async () => {
    if (!wallet) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const params: { wallet: string; github_handle?: string; x_handle?: string; track: string } = {
        wallet,
        track,
      };
      if (track === 'OSS' || track === 'BOTH') {
        if (!githubHandle.trim()) {
          setError('GitHub handle is required for OSS track');
          setSubmitting(false);
          return;
        }
        params.github_handle = githubHandle.trim();
      }
      if (track === 'CONTENT' || track === 'BOTH') {
        if (!xHandle.trim()) {
          setError('X/Twitter handle is required for Content track');
          setSubmitting(false);
          return;
        }
        params.x_handle = xHandle.trim().replace(/^@/, '');
      }

      await api.campaign.register(params);
      setSuccess('Successfully registered! You can now start earning XP.');
      setIsRegistered(true);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <StatGridSkeleton count={4} />
        <PanelSkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  // Campaign ended - show winners
  const campaignEnded = true;
  const winners = [
    { rank: 1, name: '@anmolsinha21', points: 16, prize: 50 },
    { rank: 2, name: '@Goofywater_06', points: 15, prize: 50 },
    { rank: 3, name: '@Abastrump', points: 14, prize: 50 },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Campaign Ended Banner */}
      {campaignEnded && (
        <Reveal>
          <div className="gs-card gs-card--sage p-6 relative overflow-hidden">
            <div
              className="absolute inset-y-0 right-0 w-40 pointer-events-none opacity-[0.12]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(-45deg, #18280e 0 2px, transparent 2px 14px)',
              }}
              aria-hidden
            />
            <div className="flex items-start gap-4 relative">
              <PartyPopper className="w-8 h-8 text-clay-dark flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="gs-display text-xl font-bold text-forest mb-2">
                  VarAIbot Challenge Complete! 🎉
                </h2>
                <p className="text-sm leading-relaxed mb-4 max-w-2xl">
                  Big thanks to everyone who participated in the VarAIbot Challenge by GrowStreams 🙌
                  The videos and PR shared by the community were incredibly valuable and played a key role in improving the project.
                </p>
                <p className="text-xs gs-sub mb-4 max-w-xl">
                  There will be no VarAIbot challenge this week, as we&apos;re preparing new activities for next week. Have a great start to the week 🚀
                </p>
                <Link
                  href="/app/leaderboard"
                  className="gs-btn-secondary !min-h-10 !text-xs"
                >
                  <Trophy className="w-4 h-4" />
                  View Full Leaderboard
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {/* Winners Section */}
      {campaignEnded && (
        <Reveal delay={0.05}>
          <div className="gs-card overflow-hidden">
            <div className="px-5 py-4 border-b gs-divider bg-sage-1/60 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <Crown className="w-5 h-5 text-clay-dark" />
                🏆 Campaign Winners
              </h3>
              <span className="gs-chip gs-chip-lemon">$150 USDC PAID</span>
            </div>
            <div className="p-5">
              <RevealGroup className="grid grid-cols-1 md:grid-cols-3 gap-4" stagger={0.1}>
                {winners.map((winner) => (
                  <div
                    key={winner.rank}
                    data-reveal-item
                    className={`relative rounded-md p-5 border ${
                      winner.rank === 1
                        ? 'bg-gradient-to-br from-lemon/50 to-lemon/15 border-moss/40 shadow-md shadow-moss/5'
                        : winner.rank === 2
                        ? 'bg-gradient-to-br from-sage-2 to-white border-black/15'
                        : 'bg-gradient-to-br from-clay/15 to-white border-clay/35'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                        winner.rank === 1 ? 'bg-white border-moss/30' :
                        winner.rank === 2 ? 'bg-white border-black/15' : 'bg-white border-clay/30'
                      }`}>
                        <Trophy className={`w-6 h-6 ${
                          winner.rank === 1 ? 'text-moss' :
                          winner.rank === 2 ? 'text-sage-5' : 'text-clay-dark'
                        }`} />
                      </div>
                      <div>
                        <p className="text-11px-stat-description uppercase tracking-wider gs-sub">{winner.rank === 1 ? '1st' : winner.rank === 2 ? '2nd' : '3rd'} Place</p>
                        <p className="font-bold text-lg">{winner.name}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 pt-2 border-t border-black/10">
                      <div className="flex justify-between items-center">
                        <span className="text-sm gs-sub">Points</span>
                        <span className="gs-display gs-mono font-bold text-clay-dark tabular-nums">{winner.points}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm gs-sub">Prize</span>
                        <span className="gs-display gs-mono font-bold text-moss tabular-nums">${winner.prize} USDC</span>
                      </div>
                    </div>
                  </div>
                ))}
              </RevealGroup>
            </div>
          </div>
        </Reveal>
      )}

      {/* Header */}
      <Reveal delay={0.08}>
        <div className="text-center space-y-3 relative">
          <div className="gs-ruler gs-ruler-l text-forest hidden lg:flex justify-end pr-4" aria-hidden>
            {Array.from({ length: 14 }).map((_, i) => (
              <span key={i} className="w-1.5" />
            ))}
          </div>
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-lg bg-forest text-lemongrass flex items-center justify-center shadow-md shadow-forest/20">
              <Trophy className="w-8 h-8" />
            </div>
          </div>
          <h1 className="gs-display text-40px-heading-thin text-black">GrowStreams Campaign</h1>
          <p className="gs-muted max-w-lg mx-auto">
            Earn XP and USDC rewards by contributing code or creating content about GrowStreams.
          </p>
        </div>
      </Reveal>

      {/* Stats Cards */}
      {!loading && (
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div data-reveal-item className="gs-card p-4 text-center">
            <DollarSign className="w-5 h-5 text-moss mx-auto mb-1" />
            <p className="gs-display gs-mono text-2xl font-bold text-moss tabular-nums">${config?.poolUSDC || 500}</p>
            <p className="text-[10px] gs-sub uppercase tracking-wider">Prize Pool</p>
          </div>
          <div data-reveal-item className="gs-card p-4 text-center">
            <Star className="w-5 h-5 text-clay-dark mx-auto mb-1" />
            <p className="gs-display gs-mono text-2xl font-bold text-clay-dark tabular-nums"><CountUp value={config?.scoreThreshold || 70} /></p>
            <p className="text-[10px] gs-sub uppercase tracking-wider">Min Score</p>
          </div>
          <div data-reveal-item className="rounded-md bg-red-500/8 border border-red-500/30 p-4 text-center">
            <Calendar className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="gs-display gs-mono text-2xl font-bold text-red-600">ENDED</p>
            <p className="text-[10px] gs-sub uppercase tracking-wider">Campaign Status</p>
          </div>
          <Link href="/app/leaderboard" data-reveal-item className="gs-card p-4 text-center group block">
            <Users className="w-5 h-5 text-forest mx-auto mb-1 group-hover:text-moss transition-colors" />
            <p className="gs-display text-2xl font-bold text-forest group-hover:text-moss transition-colors">View</p>
            <p className="text-[10px] gs-sub uppercase tracking-wider">Leaderboard</p>
          </Link>
        </RevealGroup>
      )}

      {/* Campaign Ended - No Registration */}
      {campaignEnded ? (
        <Reveal delay={0.1}>
          <div className="gs-panel p-6 text-center">
            <Trophy className="w-12 h-12 text-forest mx-auto mb-3" />
            <h3 className="gs-display text-lg font-semibold mb-2">Campaign Has Ended</h3>
            <p className="gs-muted mb-4 max-w-md mx-auto text-sm">
              Thank you to all participants! Check the leaderboard to see final rankings.
            </p>
            <Link href="/app/leaderboard" className="gs-btn-primary !text-xs">
              <Trophy className="w-4 h-4" />
              View Final Leaderboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </Reveal>
      ) : isRegistered && participant ? (
        <Reveal>
          <div className="rounded-md bg-lemon/25 border border-moss/35 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-moss" />
              <div>
                <h2 className="gs-display text-lg font-semibold text-moss">You&apos;re Registered!</h2>
                <p className="text-sm gs-sub">Start contributing to earn XP.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/70 rounded-md p-3 border border-black/5">
                <p className="text-10px-nav-heading uppercase tracking-wider gs-sub">Total XP</p>
                <p className="gs-display gs-mono text-xl font-bold text-moss tabular-nums">
                  <CountUp value={((participant as Record<string, unknown>).participant as Record<string, unknown>)?.total_xp as number || 0} />
                </p>
              </div>
              <div className="bg-white/70 rounded-md p-3 border border-black/5">
                <p className="text-10px-nav-heading uppercase tracking-wider gs-sub">Rank</p>
                <p className="gs-display gs-mono text-xl font-bold text-clay-dark tabular-nums">
                  #{(participant as Record<string, unknown>).rank as number || '--'}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/app/leaderboard" className="flex-1 gs-btn-secondary !py-2.5 !min-h-0 !text-sm text-center">
                View Leaderboard
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (
        /* Registration Form */
        <Reveal>
          <div className="gs-panel p-6 space-y-5">
            <h2 className="gs-display text-lg font-semibold flex items-center gap-2">
              <Zap className="w-5 h-5 text-clay-dark" />
              Register for the Campaign
            </h2>

            {/* Track Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium gs-sub">Choose Your Track</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'OSS' as Track, label: 'OSS', desc: 'GitHub PRs', icon: GitBranch },
                  { value: 'CONTENT' as Track, label: 'Content', desc: 'X/Twitter', icon: Twitter },
                  { value: 'BOTH' as Track, label: 'Both', desc: 'PR + Content', icon: Zap },
                ]).map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTrack(value)}
                    className={`rounded-md p-4 text-left transition-all border cursor-pointer ${
                      track === value
                        ? 'bg-white border-moss ring-1 ring-moss/30'
                        : 'bg-white/60 border-black/10 hover:border-moss/40'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${track === value ? 'text-moss' : 'gs-sub'}`} />
                    <p className="font-medium text-sm">{label}</p>
                    <p className="text-[11px] gs-sub">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Handle Inputs */}
            {(track === 'OSS' || track === 'BOTH') && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium gs-sub flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" /> GitHub Username
                </label>
                <input
                  type="text"
                  value={githubHandle}
                  onChange={e => setGithubHandle(e.target.value)}
                  placeholder="e.g. octocat"
                  className="gs-input"
                />
              </div>
            )}
            {(track === 'CONTENT' || track === 'BOTH') && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium gs-sub flex items-center gap-1.5">
                  <Twitter className="w-3.5 h-3.5" /> X/Twitter Handle
                </label>
                <input
                  type="text"
                  value={xHandle}
                  onChange={e => setXHandle(e.target.value)}
                  placeholder="e.g. @growstreams"
                  className="gs-input"
                />
              </div>
            )}

            {/* Wallet */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium gs-sub">Wallet Address</label>
              <div className="bg-white border border-black/10 rounded-md px-4 py-2.5 text-sm gs-mono gs-sub truncate">
                {wallet || 'Connect wallet first'}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-500/8 border border-red-500/25 rounded-md p-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 text-moss text-sm bg-lemon/30 border border-moss/30 rounded-md p-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}

            <button
              onClick={handleRegister}
              disabled={submitting || !wallet}
              className="gs-btn-primary w-full !min-h-11"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Registering...</>
              ) : (
                <>Register & Start Earning <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </Reveal>
      )}

      {/* How XP Works */}
      {!loading && (
        <RevealGroup className="grid md:grid-cols-2 gap-4">
          <div data-reveal-item className="gs-card gs-card--sage p-5 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-moss" />
              <h3 className="font-semibold text-moss">OSS Track (GitHub)</h3>
            </div>
            <ul className="space-y-2 text-sm gs-sub">
              <li className="flex items-start gap-2">
                <span className="gs-mono text-moss mt-0.5 font-medium">1.</span>
                Submit a PR to GrowStreams repo
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-moss mt-0.5 font-medium">2.</span>
                AI scores your code (0-100)
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-moss mt-0.5 font-medium">3.</span>
                Score &ge;70 = instant XP (700-2000)
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-moss mt-0.5 font-medium">4.</span>
                Daily XP accrual for 14 days (100-200/day)
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-moss mt-0.5 font-medium">5.</span>
                Merge bonus: +500 XP
              </li>
            </ul>
          </div>
          <div data-reveal-item className="gs-card gs-card--sage p-5 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Twitter className="w-5 h-5 text-forest" />
              <h3 className="font-semibold text-forest">Content Track (X/Twitter)</h3>
            </div>
            <ul className="space-y-2 text-sm gs-sub">
              <li className="flex items-start gap-2">
                <span className="gs-mono text-forest mt-0.5 font-medium">1.</span>
                Post about GrowStreams (@GrowwStreams / #GrowStreams)
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-forest mt-0.5 font-medium">2.</span>
                AI scores quality + engagement
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-forest mt-0.5 font-medium">3.</span>
                Score &ge;70 = instant XP (500-1200)
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-forest mt-0.5 font-medium">4.</span>
                Thread bonus: +30% for 5+ tweets
              </li>
              <li className="flex items-start gap-2">
                <span className="gs-mono text-forest mt-0.5 font-medium">5.</span>
                Viral bonus: +800 XP at 500+ engagements
              </li>
            </ul>
          </div>
        </RevealGroup>
      )}

      {/* Payout Formula */}
      {!loading && (
        <Reveal delay={0.05}>
          <div className="gs-card gs-card--flat p-6 space-y-3">
            <h2 className="gs-display text-lg font-semibold">Payout Formula</h2>
            <div className="bg-sage-1 rounded-md p-4 text-center border border-black/5">
              <p className="gs-display gs-mono text-base text-forest">
                Your USDC = (Your XP / Total XP) &times; ${config?.poolUSDC || 500} Pool
              </p>
            </div>
            <p className="text-sm gs-muted text-center">
              Payouts are distributed proportionally based on your share of the total XP pool.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}


