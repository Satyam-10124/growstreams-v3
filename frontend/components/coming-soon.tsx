'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Coins, Waves, Vault } from 'lucide-react';
import Link from 'next/link';

const quickLinks = [
  { title: 'GROW Token', desc: 'Mint & manage tokens', href: '/app/grow', icon: Coins, color: 'text-moss', tile: 'bg-lemon/40' },
  { title: 'Streams', desc: 'Create per-second streams', href: '/app/streams', icon: Waves, color: 'text-forest', tile: 'bg-sage-3/60' },
  { title: 'Vault', desc: 'Deposit & withdraw', href: '/app/vault', icon: Vault, color: 'text-clay-dark', tile: 'bg-clay/15' },
];

function ArrowMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 22 16" fill="none" aria-hidden>
      <path d="M2.0326 15.6442L5.93597e-07 13.5799L9.02336e-08 2.0643L2.0326 -8.88478e-08L21.48 7.27606L21.48 8.36816L2.0326 15.6442Z" fill="currentColor" />
    </svg>
  );
}

export default function ComingSoon({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-12 sm:mb-16 relative">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-clay-dark" />
          <span className="gs-chip gs-chip-clay">Coming Soon</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center gap-4 mb-4"
        >
          <ArrowMark className="w-5 h-4 text-forest hidden sm:block" />
          <div className="w-14 h-14 rounded-md bg-white border border-black/10 flex items-center justify-center shadow-sm">
            <Icon className="w-7 h-7 text-sage-5" />
          </div>
          <h1 className="gs-display text-40px-heading-thin text-black">{title}</h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="gs-muted text-sm sm:text-base leading-relaxed max-w-lg"
        >
          {description}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6"
        >
          <Link href="/app" className="gs-btn-primary !text-xs">
            Back to Dashboard
          </Link>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="text-xs gs-sub uppercase tracking-wider mb-4 gs-mono"
      >
        Explore what&apos;s live
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quickLinks.map((link, i) => (
          <motion.div
            key={link.href}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
          >
            <Link href={link.href}
              className="group block gs-card p-5 hover:!border-moss/40 transition-all">
              <div className="flex items-center justify-center w-full h-24 mb-4">
                <div className={`w-16 h-16 rounded-md ${link.tile} flex items-center justify-center`}>
                  <link.icon className={`w-8 h-8 ${link.color}`} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">{link.title}</span>
                  <p className="text-[10px] gs-sub mt-0.5">{link.desc}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-sage-1 border border-black/10 flex items-center justify-center group-hover:bg-forest group-hover:text-lemongrass group-hover:border-forest transition-colors">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
