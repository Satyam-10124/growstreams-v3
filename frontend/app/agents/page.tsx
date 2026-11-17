'use client';

import dynamic from 'next/dynamic';

const AgentsDashboardClient = dynamic(
  () => import('./AgentsDashboardClient'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#FBFBF9] flex items-center justify-center font-mono text-[#136F46] text-xs tracking-wide">
        <span className="w-2 h-2 rounded-full bg-[#136F46] animate-ping mr-2.5" />
        LOADING GROWSTREAMS PRIME · VARA MAINNET...
      </div>
    ),
  }
);

export default function AgentsPage() {
  return <AgentsDashboardClient />;
}
