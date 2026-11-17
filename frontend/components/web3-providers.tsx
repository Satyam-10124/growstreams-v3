'use client';

import { VaraProviders } from '@/contexts/VaraContext';

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  return <VaraProviders>{children}</VaraProviders>;
}