'use client';

import dynamic from 'next/dynamic';

const AgenticDashboard = dynamic(() => import('./AgenticDashboard'), {
  ssr: false,
});

export default function AgenticDashboardWrapper() {
  return <AgenticDashboard />;
}
