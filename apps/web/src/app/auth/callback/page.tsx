'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Authentication failed. Please try again.');
      router.replace('/auth/login');
      return;
    }

    if (token) {
      // Store token and fetch user info
      localStorage.setItem('janus-auth', JSON.stringify({ state: { token } }));

      // Fetch user info with the new token
      api.auth.me()
        .then((user) => {
          setAuth(user, token);
          toast.success(`Welcome, ${user.name || user.email}!`);
          router.replace('/dashboard');
        })
        .catch((err) => {
          console.error('Failed to fetch user:', err);
          toast.error('Authentication failed. Please try again.');
          router.replace('/auth/login');
        });
    } else {
      router.replace('/auth/login');
    }
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
      <p className="text-white/60">Completing sign in...</p>
    </div>
  );
}
