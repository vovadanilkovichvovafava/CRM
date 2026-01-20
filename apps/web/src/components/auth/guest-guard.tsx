'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Loader2 } from 'lucide-react';

interface GuestGuardProps {
  children: React.ReactNode;
}

/**
 * GuestGuard - protects auth pages from logged-in users
 * Redirects to dashboard if user is already authenticated
 */
export function GuestGuard({ children }: GuestGuardProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Small delay to allow zustand to hydrate from localStorage
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isChecking && token) {
      router.replace('/dashboard');
    }
  }, [isChecking, token, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-white/50 text-sm">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
