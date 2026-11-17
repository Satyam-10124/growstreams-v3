'use client';

import { useEffect, useState, useCallback } from 'react';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { api } from '@/lib/growstreams-api';
import {
  Trophy, Medal, TrendingUp, TrendingDown, Minus,
  Users, Zap, DollarSign, GitBranch, Twitter,
  ChevronLeft, ChevronRight, Search, Filter, Crown, PartyPopper,
} from 'lucide-react';
import PageHeader from '@/components/gsui/PageHeader';
import { RevealGroup, Reveal } from '@/components/gsui/Reveal';
import CountUp from '@/components/gsui/CountUp';
import { RowsSkeleton } from '@/components/gsui/Skeleton';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  displayName: string;
  track: string;
  totalXP: number;
  contributions: number;
  estimatedUSDC: number;
  rankChange: number;
}

interface LeaderboardData {
  totalParticipants: number;
  totalXP: number;
  poolUSDC: number;
  campaignEndsIn: number | null;
  page: number;
  limit: number;
  entries: LeaderboardEntry[];
}

interface StatsData {
  totalParticipants: number;
  totalXP: number;
  totalContributions: number;
  ossContributions: number;
  contentContributions: number;
  topContributor: { wallet: string; displayName: string; totalXP: number; track: string } | null;
  campaignDaysRemaining: number | null;
  poolUSDC: number;
}

function shortenWallet(w: string) {
  if (!w || w.length < 12) return w;
  return w.slice(0, 6) + '...' + w.slice(-4);
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-8 h-8 rounded-full bg-lemon flex items-center justify-center"><Medal className="w-4 h-4 text-moss" /></div>;
  if (rank === 2) return <div className="w-8 h-8 rounded-full bg-sage-3 flex items-center justify-center"><Medal className="w-4 h-4 text-sage-5" /></div>;
  if (rank === 3) return <div className="w-8 h-8 rounded-full bg-clay/25 flex items-center justify-center"><Medal className="w-4 h-4 text-clay-dark" /></div>;
  return <div className="w-8 h-8 rounded-full bg-sage-1 border border-black/10 flex items-center justify-center gs-mono text-xs font-bold gs-sub">#{rank}</div>;
}

function RankChange({ change }: { change: number }) {
  if (change > 0) return <span className="inline-flex items-center gap-0.5 text-moss text-xs font-medium"><TrendingUp className="w-3 h-3" />+{change}</span>;
  if (change < 0) return <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-medium"><TrendingDown className="w-3 h-3" />{change}</span>;
  return <span className="inline-flex items-center gap-0.5 gs-sub text-xs"><Minus className="w-3 h-3" /></span>;
}

function TrackBadge({ track }: { track: string }) {
  if (track === 'OSS') return <span className="gs-chip gs-chip-moss !text-[9px] inline-flex items-center gap-1"><GitBranch className="w-2.5 h-2.5" />OSS</span>;
  if (track === 'CONTENT') return <span className="gs-chip gs-chip-sage !text-[9px] inline-flex items-center gap-1"><Twitter className="w-2.5 h-2.5" />Content</span>;
  return <span className="gs-chip gs-chip-ink !text-[9px]">Both</span>;
}

export default function LeaderboardPage() {
  const account = useActiveAccount();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [trackFilter, setTrackFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 20;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; track?: string } = { page, limit };
      if (trackFilter) params.track = trackFilter;

      const [lb, st] = await Promise.all([
        api.campaign.leaderboard(params),
        api.campaign.leaderboardStats(),
      ]);

      setData(lb as unknown as LeaderboardData);
      setStats(st as unknown as StatsData);
    } catch (err) {
      console.error('Leaderboard load failed:', err);
    } finally {
      setLoading(false);
    }
  }, [page, trackFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalPages = data ? Math.ceil((data.totalParticipants || 1) / limit) : 1;
  const myWallet = account?.decodedAddress?.toLowerCase() || '';

  const filteredEntries = data?.entries?.filter(e => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return e.displayName.toLowerCase().includes(q) || e.wallet.toLowerCase().includes(q);
  }) || [];

  // Campaign winners data
  const winners = [
    { rank: 1, name: '@anmolsinha21', points: 16, prize: 50 },
    { rank: 2, name: '@Goofywater_06', points: 15, prize: 50 },
    { rank: 3, name: '@Abastrump', points: 14, prize: 50 },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pl-2 lg:pl-8">
      {/* Campaign Ended Banner */}
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
              <p className="text-xs gs-sub max-w-xl">
                There will be no VarAIbot challenge this week, as we&apos;re preparing new activities for next week. Have a great start to the week 🚀
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Winners Podium */}
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
                      <Medal className={`w-6 h-6 ${
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

      {/* Header */}
      <PageHeader
        eyebrow="RANKINGS"
        title="Full Leaderboard"
        subtitle="Final campaign rankings and XP standings"
        icon={<Trophy className="w-7 h-7 text-clay-dark" />}
        actions={
          <div className="rounded-md bg-red-500/8 border border-red-500/30 px-4 py-2 text-center">
            <p className="gs-display gs-mono text-base font-bold text-red-600">ENDED</p>
            <p className="text-10px-nav-heading uppercase tracking-wider gs-sub">Campaign Status</p>
          </div>
        }
      />

      {/* Stats Row */}
      {!loading && stats && (
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { icon: Users, label: 'Participants', value: String(stats.totalParticipants), color: 'text-forest', mono: false },
            { icon: Zap, label: 'Total XP', value: (stats.totalXP || 0).toLocaleString(), color: 'text-clay-dark', mono: true },
            { icon: DollarSign, label: 'Prize Pool', value: `$${stats.poolUSDC}`, color: 'text-moss', mono: true },
            { icon: GitBranch, label: 'OSS PRs', value: String(stats.ossContributions), color: 'text-moss', mono: false },
            { icon: Twitter, label: 'Content Posts', value: String(stats.contentContributions), color: 'text-forest', mono: false },
          ].map(({ icon: Icon, label, value, color, mono }) => (
            <div key={label} data-reveal-item className="gs-card p-3 text-center">
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <p className={`gs-display text-lg font-bold tabular-nums ${mono ? 'gs-mono' : ''}`}>{value}</p>
              <p className="text-[10px] gs-sub">{label}</p>
            </div>
          ))}
        </RevealGroup>
      )}

      {/* Top Contributor Callout */}
      {!loading && stats?.topContributor && (
        <Reveal delay={0.05}>
          <div className="bg-gradient-to-r from-lemon/45 via-lemon/20 to-transparent border border-moss/30 rounded-md px-5 py-3 flex items-center gap-3">
            <Medal className="w-6 h-6 text-clay-dark flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold text-moss">{stats.topContributor.displayName}</span>
                {' '}is leading with{' '}
                <CountUp value={stats.topContributor.totalXP} format={n => n.toLocaleString()} className="gs-mono font-bold" />
                {' '}XP
              </p>
            </div>
            <TrackBadge track={stats.topContributor.track} />
          </div>
        </Reveal>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 gs-sub" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or wallet..."
            className="gs-input !pl-10"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-black/10 rounded-md p-1 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 gs-sub ml-2 shrink-0" />
          {(['', 'OSS', 'CONTENT'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTrackFilter(t); setPage(1); }}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                trackFilter === t
                  ? 'bg-forest text-lemongrass'
                  : 'gs-sub hover:text-black hover:bg-sage-1'
              }`}
            >
              {t || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <RowsSkeleton rows={6} />
      ) : (
        <Reveal>
          <div className="gs-card overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[3rem_1fr_5rem_6rem_4rem_5rem_3rem] gap-2 px-5 py-3 border-b gs-divider bg-sage-1/50 text-10px-nav-heading uppercase tracking-wider font-medium gs-sub">
              <div>Rank</div>
              <div>Participant</div>
              <div>Track</div>
              <div className="text-right">XP</div>
              <div className="text-right">PRs</div>
              <div className="text-right">USDC</div>
              <div className="text-right">24h</div>
            </div>

            {/* Rows */}
            {filteredEntries.length === 0 ? (
              <div className="px-5 py-10 text-center gs-sub text-sm">
                No participants found. Be the first to register!
              </div>
            ) : (
              <div className="divide-y gs-divider">
                {filteredEntries.map(entry => {
                  const isMe = entry.wallet.toLowerCase() === myWallet;
                  return (
                    <div
                      key={entry.wallet}
                      className={`grid grid-cols-[3rem_1fr_5rem_6rem_4rem_5rem_3rem] gap-2 px-5 py-3 items-center transition-colors ${
                        isMe ? 'bg-lemon/20 border-l-2 border-l-moss' : 'hover:bg-sage-1/40'
                      }`}
                    >
                      <div><RankBadge rank={entry.rank} /></div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate flex items-center">
                          {entry.displayName}
                          {isMe && <span className="ml-1.5 gs-chip gs-chip-moss !text-[9px]">You</span>}
                        </p>
                        <p className="text-[10px] gs-sub gs-mono">{shortenWallet(entry.wallet)}</p>
                      </div>
                      <div><TrackBadge track={entry.track} /></div>
                      <div className="text-right">
                        <p className="gs-display gs-mono font-bold text-sm tabular-nums">{entry.totalXP.toLocaleString()}</p>
                      </div>
                      <div className="text-right text-sm gs-sub">{entry.contributions}</div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-moss gs-mono">${entry.estimatedUSDC}</p>
                      </div>
                      <div className="text-right"><RankChange change={entry.rankChange} /></div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t gs-divider bg-sage-1/30">
                <p className="text-xs gs-sub">
                  Page {page} of {totalPages} ({data?.totalParticipants} participants)
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="gs-iconbtn !w-8 !h-8 disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="gs-iconbtn !w-8 !h-8 disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      )}
    </div>
  );
}

