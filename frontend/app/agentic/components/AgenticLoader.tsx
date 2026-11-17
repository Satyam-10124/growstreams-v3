'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@gear-js/react-hooks';

export default function AgenticLoader() {
  const { isApiReady } = useApi();
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Hide if API is ready, OR if 3 seconds have passed (fallback)
    let timer: NodeJS.Timeout;
    
    if (mounted && isApiReady) {
      timer = setTimeout(() => setShow(false), 800);
    }
    
    const fallbackTimer = setTimeout(() => setShow(false), 3000);
    
    return () => {
      if (timer) clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, [mounted, isApiReady]);

  useEffect(() => {
    // Aggressively force scroll to top during the loading phase
    if (show) {
      window.scrollTo(0, 0);
      const interval = setInterval(() => {
        window.scrollTo(0, 0);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center transition-opacity duration-1000 bg-provn-bg ${
        mounted && isApiReady ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-provn-muted">Connecting to Vara...</p>
      </div>
    </div>
  );
}
