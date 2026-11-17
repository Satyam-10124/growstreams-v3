'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useApi } from '@gear-js/react-hooks';
import { useActiveAccount } from '@/hooks/useActiveAccount';
import { useVaraWallet } from '@/lib/vara-wallet';
import VaraWalletButton from '@/components/VaraWalletButton';
import {
  LayoutDashboard, Waves, Vault, GitFork, Shield,
  Trophy, Fingerprint, LogOut, Menu, X, Coins,
  Medal, Zap, Bot, Briefcase,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

// Bottom nav items shown on mobile only (the most important 5)
const mobileNavItems = [
  { href: '/app', label: 'Home', icon: LayoutDashboard },
  { href: '/agents', label: 'Trade & AI', icon: Bot },
  { href: '/protocol-overview', label: 'Portfolio', icon: Trophy },
  { href: '/app/streams', label: 'Streams', icon: Waves },
  { href: '/app/vault', label: 'Vault', icon: Vault },
];

const coreNavItems = [
  { href: '/app', label: 'Overview & Balances', icon: LayoutDashboard },
  { href: '/app/streams', label: 'Money Streams', icon: Waves },
  { href: '/app/vault', label: 'Vault & Wrap (gVARA/wVARA)', icon: Vault },
  { href: '/app/grow', label: 'GROW Token & Faucet', icon: Coins },
  { href: '/app/splits', label: 'Revenue Splits (60/15/15/10)', icon: GitFork },
  { href: '/app/bounties', label: 'Bounties & Grants', icon: Briefcase },
];

const governanceNavItems = [
  { href: '/app/identity', label: 'Identity Registry', icon: Fingerprint },
  { href: '/app/permissions', label: 'Permissions Manager', icon: Shield },
  { href: '/app/campaign', label: 'Contributor Campaign', icon: Zap },
  { href: '/app/leaderboard', label: 'XP Leaderboard', icon: Medal },
];

const primeNavItems = [
  { href: '/agents', label: 'Stonk CLOB & Perps (1x–5x)', icon: Bot },
  { href: '/protocol-overview', label: 'DeFiLlama & 16 Contracts', icon: Trophy },
  { href: '/agentic', label: 'Agentic Hub (Learn & Earn)', icon: Zap },
];

function shortenAddress(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '…' + addr.slice(-4);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAccount();
  const { disconnect } = useVaraWallet();
  const activeAccount = useActiveAccount();
  const { isApiReady } = useApi();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [euclidLight, setEuclidLight] = useState(true);
  const sidebarRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        gsap.fromTo(
          sidebarRef.current,
          { x: -16, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.35,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(sidebarRef.current, { clearProps: 'transform,opacity' });
            },
          }
        );
      }
      gsap.fromTo(
        mainRef.current,
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out',
          delay: 0.05,
          onComplete: () => {
            gsap.set(mainRef.current, { clearProps: 'opacity,y' });
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div
      className={`${
        euclidLight ? 'gs-app euclid-app-light bg-[#FBFBF9] text-[#111827]' : 'gs-app-dark bg-[#0C0F12] text-[#F3F4F6]'
      } flex flex-col h-screen overflow-hidden relative transition-colors duration-200`}
      style={{ fontFamily: 'var(--font-space-grotesk), Inter, system-ui, sans-serif' }}
    >
      {euclidLight && (
        <style>{`
          .euclid-app-light {
            --gs-line: #E6E8E5;
            --gs-line-soft: #EEF0EC;
            --gs-ink: #111827;
            --gs-muted: #6B7280;
            --gs-sub: #136F46;
            --gs-forest: #136F46;
            --gs-moss: #136F46;
            --gs-lemongrass: #E6F4ED;
            background-color: #FBFBF9 !important;
            color: #111827 !important;
          }
          .euclid-app-light .gs-card,
          .euclid-app-light .gs-panel {
            background: #FFFFFF !important;
            border: 1px solid #E6E8E5 !important;
            clip-path: none !important;
            border-radius: 12px !important;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03) !important;
          }
          .euclid-app-light .gs-card--sage {
            background: #F4F5F2 !important;
            border: 1px solid #E6E8E5 !important;
          }
          .euclid-app-light .gs-btn-primary {
            background: #136F46 !important;
            color: #FFFFFF !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
          }
          .euclid-app-light .gs-btn-primary:hover {
            background: #0F5837 !important;
          }
          .euclid-app-light .gs-btn-secondary,
          .euclid-app-light .gs-iconbtn {
            background: #FFFFFF !important;
            border: 1px solid #E6E8E5 !important;
            color: #111827 !important;
            border-radius: 8px !important;
          }
          .euclid-app-light .gs-btn-secondary:hover,
          .euclid-app-light .gs-iconbtn:hover {
            background: #E6F4ED !important;
            border-color: #B6DFC8 !important;
            color: #136F46 !important;
          }
          .euclid-app-light .gs-input {
            background: #F4F5F2 !important;
            border: 1px solid #E6E8E5 !important;
            color: #111827 !important;
            border-radius: 8px !important;
          }
          .euclid-app-light .gs-input:focus {
            background: #FFFFFF !important;
            border-color: #136F46 !important;
            box-shadow: 0 0 0 3px rgba(19, 111, 70, 0.12) !important;
          }
          .euclid-app-light .text-white {
            color: #111827 !important;
          }
          .euclid-app-light .bg-\\[#080b10\\],
          .euclid-app-light .bg-\\[#0c1018\\] {
            background-color: #FFFFFF !important;
          }
          .euclid-app-light .border-\\[#1a2030\\] {
            border-color: #E6E8E5 !important;
          }
        `}</style>
      )}

      {/* ── Unified Top EuclidPrime Navigation Bar (56px) ── */}
      <header
        className={`h-14 shrink-0 border-b z-30 transition-colors ${
          euclidLight ? 'bg-white/95 border-[#E6E8E5]' : 'bg-[#12161B]/95 border-[#222934]'
        } backdrop-blur-md`}
      >
        <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Left: Brand + Horizontal Links */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-md border border-[#E6E8E5] text-[#6B7280]"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg bg-[#136F46] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                ✦
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className={`font-semibold tracking-tight text-sm ${euclidLight ? 'text-[#111827]' : 'text-white'}`}>
                  GrowStreams
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#E6F4ED] text-[#136F46] font-semibold">
                  Prime
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
              <Link
                href="/agents"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  euclidLight ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]' : 'text-[#8B95A5] hover:text-white hover:bg-[#191F26]'
                }`}
              >
                Trade & Perps
              </Link>
              <Link
                href="/protocol-overview"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  euclidLight ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]' : 'text-[#8B95A5] hover:text-white hover:bg-[#191F26]'
                }`}
              >
                Portfolio & Overview
              </Link>
              <Link
                href="/app"
                className={`px-3 py-1.5 rounded-md font-semibold relative ${
                  pathname === '/app'
                    ? euclidLight
                      ? 'text-[#111827]'
                      : 'text-white'
                    : euclidLight
                    ? 'text-[#6B7280] hover:text-[#111827]'
                    : 'text-[#8B95A5] hover:text-white'
                }`}
              >
                Dashboard
                {pathname === '/app' && (
                  <span className="absolute bottom-[-11px] left-2 right-2 h-[2px] bg-[#136F46] rounded-full" />
                )}
              </Link>
              <Link
                href="/app/streams"
                className={`px-3 py-1.5 rounded-md font-semibold relative ${
                  pathname.startsWith('/app/streams')
                    ? euclidLight
                      ? 'text-[#111827]'
                      : 'text-white'
                    : euclidLight
                    ? 'text-[#6B7280] hover:text-[#111827]'
                    : 'text-[#8B95A5] hover:text-white'
                }`}
              >
                Streams
                {pathname.startsWith('/app/streams') && (
                  <span className="absolute bottom-[-11px] left-2 right-2 h-[2px] bg-[#136F46] rounded-full" />
                )}
              </Link>
              <Link
                href="/app/vault"
                className={`px-3 py-1.5 rounded-md font-semibold relative ${
                  pathname.startsWith('/app/vault')
                    ? euclidLight
                      ? 'text-[#111827]'
                      : 'text-white'
                    : euclidLight
                    ? 'text-[#6B7280] hover:text-[#111827]'
                    : 'text-[#8B95A5] hover:text-white'
                }`}
              >
                Vault
                {pathname.startsWith('/app/vault') && (
                  <span className="absolute bottom-[-11px] left-2 right-2 h-[2px] bg-[#136F46] rounded-full" />
                )}
              </Link>
              <Link
                href="/agentic"
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  euclidLight ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]' : 'text-[#8B95A5] hover:text-white hover:bg-[#191F26]'
                }`}
              >
                Agentic Hub
              </Link>
            </nav>
          </div>

          {/* Right: Quick CTA + Light/Dark Toggle + SubWallet */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/agents"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#136F46] hover:bg-[#0F5837] !text-white text-xs font-medium transition-colors shadow-sm"
            >
              <span>Trade 5x Perps</span>
            </Link>

            <button
              onClick={() => setEuclidLight((v) => !v)}
              title="Toggle Light / Dark Theme"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                euclidLight
                  ? 'bg-[#F4F5F2] border-[#E6E8E5] text-[#111827] hover:bg-[#E6E8E5]'
                  : 'bg-[#191F26] border-[#222934] text-white hover:bg-[#222934]'
              }`}
            >
              {euclidLight ? '🌙 Dark' : '☀️ Light'}
            </button>

            <VaraWalletButton lightMode={euclidLight} />
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden bg-black/40 backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── 2-Column EuclidPrime Body (Sidebar + Main Content) ── */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Sidebar */}
        <aside
          ref={sidebarRef}
          className={`fixed lg:static inset-y-0 left-0 z-40 w-60 flex flex-col border-r transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${euclidLight ? 'bg-[#FBFBF9] border-[#E6E8E5]' : 'bg-[#0C0F12] border-[#222934]'}`}
        >
          {/* Mobile close row */}
          <div className="lg:hidden h-12 px-4 flex items-center justify-between border-b border-[#E6E8E5]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#136F46]">GrowStreams Prime</span>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-[#6B7280]" aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
            {/* Group 1: Core Streams & Vault */}
            <div>
              <p
                className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  euclidLight ? 'text-[#6B7280]' : 'text-[#8B95A5]'
                }`}
              >
                Streams & Vaults
              </p>
              <div className="space-y-0.5">
                {coreNavItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#E6F4ED] text-[#136F46] font-semibold border border-[#B6DFC8]'
                          : euclidLight
                          ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]'
                          : 'text-[#8B95A5] hover:text-white hover:bg-[#191F26]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Group 2: Stonk Trading & DeFiLlama */}
            <div>
              <p
                className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  euclidLight ? 'text-[#6B7280]' : 'text-[#8B95A5]'
                }`}
              >
                Prime Markets & Proofs
              </p>
              <div className="space-y-0.5">
                {primeNavItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#E6F4ED] text-[#136F46] font-semibold border border-[#B6DFC8]'
                          : euclidLight
                          ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]'
                          : 'text-[#8B95A5] hover:text-white hover:bg-[#191F26]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0 text-[#136F46]" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Group 3: On-Chain Identity & Governance */}
            <div>
              <p
                className={`px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                  euclidLight ? 'text-[#6B7280]' : 'text-[#8B95A5]'
                }`}
              >
                On-Chain Registry
              </p>
              <div className="space-y-0.5">
                {governanceNavItems.map(({ href, label, icon: Icon }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        active
                          ? 'bg-[#E6F4ED] text-[#136F46] font-semibold border border-[#B6DFC8]'
                          : euclidLight
                          ? 'text-[#6B7280] hover:text-[#111827] hover:bg-[#F4F5F2]'
                          : 'text-[#8B95A5] hover:text-white hover:bg-[#191F26]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Connected Wallet Chip */}
          {activeAccount.isConnected && (
            <div className={`p-3 border-t ${euclidLight ? 'border-[#E6E8E5]' : 'border-[#222934]'}`}>
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${
                  euclidLight ? 'bg-white border-[#E6E8E5]' : 'bg-[#12161B] border-[#222934]'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0 bg-[#136F46]" />
                <span className="font-mono text-xs flex-1 truncate">{shortenAddress(activeAccount.address)}</span>
                <button
                  onClick={() => {
                    disconnect();
                    try { logout(); } catch {}
                  }}
                  className="text-[#6B7280] hover:text-[#DC2626] transition-colors"
                  title="Disconnect"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto p-4 lg:p-7 relative gs-app-content"
          style={{ scrollbarWidth: 'thin' }}
        >
          {children}
        </main>
      </div>

      {/* ── Whisper-Quiet 28px EuclidPrime Bottom Status Bar ── */}
      <footer
        className={`hidden lg:flex h-7 shrink-0 border-t px-6 items-center justify-between text-[11px] font-mono ${
          euclidLight ? 'bg-white border-[#E6E8E5] text-[#6B7280]' : 'bg-[#12161B] border-[#222934] text-[#8B95A5]'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#136F46]" />
          <span className="text-[#136F46] font-semibold">LIVE</span>
          <span>· wss://rpc.vara.network · Vara Mainnet Sails Protocol</span>
        </div>
        <div className="flex items-center gap-4">
          <span>16/16 Sails Programs Active · Indexed on DeFiLlama</span>
          <a
            href="https://vara.subscan.io/account/0x4ae03ca006e92fe188d3c61d3d39a1d05c9fdf1c0a16c750b103269deccfa784"
            target="_blank"
            rel="noreferrer"
            className="text-[#136F46] hover:underline"
          >
            Subscan ↗
          </a>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <nav
        className={`gs-mobile-bottom-nav border-t ${
          euclidLight ? 'bg-white/95 border-[#E6E8E5]' : 'bg-[#12161B]/95 border-[#222934]'
        }`}
        style={{
          backdropFilter: 'blur(16px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {mobileNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/app' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 transition-colors"
              style={{ color: active ? '#136F46' : '#6B7280' }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-mono tracking-wider uppercase font-semibold">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
