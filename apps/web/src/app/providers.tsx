'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import '@/lib/i18n/config';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';

function LanguageSynchronizer({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // Synchronize language from user profile if available
    const savedLocale = localStorage.getItem('janus-locale');
    if (savedLocale) {
      i18n.changeLanguage(savedLocale);
    }
  }, [i18n, user]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageSynchronizer>
        {children}
      </LanguageSynchronizer>
    </QueryClientProvider>
  );
}
