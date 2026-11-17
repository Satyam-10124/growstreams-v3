"use client";

import { type ReactNode } from "react";
import { Reveal } from "./Reveal";

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Reveal className="relative flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="relative z-10">
        {/* Eyebrow — adapts via CSS var */}
        <p
          className="gs-chip gs-chip-sage mb-3 font-mono tracking-widest"
          style={{ fontSize: '10px', letterSpacing: '0.14em' }}
        >
          {eyebrow}
        </p>
        <h1
          className="gs-display flex items-center gap-3"
          style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--gs-ink, #090f05)' }}
        >
          {icon && <span style={{ color: 'var(--gs-moss, #3f7308)' }}>{icon}</span>}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="gs-muted mt-1.5 max-w-xl" style={{ fontSize: '0.875rem' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 relative z-10">{actions}</div>
      )}
    </Reveal>
  );
}
