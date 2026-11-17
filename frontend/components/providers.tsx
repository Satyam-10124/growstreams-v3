'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';

const VaraProviders = dynamic(
  () => import('@/contexts/VaraContext').then((mod) => mod.VaraProviders),
  { ssr: false }
);
export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <VaraProviders>
        {children}
        <Toaster position="top-right" richColors />
      </VaraProviders>
    </QueryClientProvider>
  );
} 