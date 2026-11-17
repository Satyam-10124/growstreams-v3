'use client';

import AppLayout from '@/components/app-layout';
import Providers from '@/components/providers';
import dynamic from 'next/dynamic';

const AppContent = dynamic(() => import('./AppContentWrapper'), {
  ssr: false,
});

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppContent>{children}</AppContent>
    </Providers>
  );
}
