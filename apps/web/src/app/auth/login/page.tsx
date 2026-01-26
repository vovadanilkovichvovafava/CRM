'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Mail, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { toast } from 'sonner';

function JanusLogo({ className = 'w-10 h-10' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="loginJanusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="loginJanusGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44"
        stroke="url(#loginJanusGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4C35 4 44 13 44 24C44 35 35 44 24 44"
        stroke="url(#loginJanusGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="40"
        stroke="url(#loginJanusGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="20" r="3" fill="url(#loginJanusGradient2)" />
      <circle cx="32" cy="20" r="3" fill="url(#loginJanusGradient)" />
      <circle cx="24" cy="32" r="4" fill="url(#loginJanusGradient)" />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('settings.messages.fillAllFields'));
      return;
    }

    setIsLoading(true);

    try {
      const { user, token } = await api.auth.login({ email, password });
      setAuth(user, token);
      toast.success(`Welcome back, ${user.name || user.email}!`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof ApiError) {
        const data = error.data as { message?: string | string[] };
        const message = Array.isArray(data?.message)
          ? data.message.join(', ')
          : data?.message || `Error ${error.status}: ${error.statusText}`;
        toast.error(message);
      } else if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error(t('errors.networkError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const { user, token } = await api.auth.getDevToken();
      setAuth(user, token);
      toast.success('Logged in as Developer');
      router.push('/dashboard');
    } catch (error) {
      console.error('Dev login error:', error);
      if (error instanceof ApiError) {
        const data = error.data as { message?: string };
        toast.error(data?.message || `Error ${error.status}`);
      } else if (error instanceof Error) {
        toast.error(`Error: ${error.message}`);
      } else {
        toast.error(t('errors.networkError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[150px]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <JanusLogo className="w-12 h-12" />
            <span className="text-2xl font-bold text-white">Janus</span>
          </Link>
          <p className="text-white/50 text-sm">See everything. Miss nothing.</p>
        </div>

        {/* Form card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-bold text-white mb-2">{t('auth.login.title')}</h1>
          <p className="text-white/50 mb-6">{t('auth.login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                {t('auth.login.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                {t('auth.login.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t('auth.login.signingIn')}
                </>
              ) : (
                t('auth.login.signIn')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0a0a0f] text-white/40">{t('common.or')}</span>
            </div>
          </div>

          {/* Dev login */}
          <button
            onClick={handleDevLogin}
            disabled={isLoading}
            className="w-full py-3 border border-white/10 text-white/70 font-medium rounded-xl hover:bg-white/5 hover:border-white/20 transition-all disabled:opacity-50"
          >
            Continue as Developer
          </button>

          {/* Register link */}
          <p className="mt-6 text-center text-white/50">
            {t('auth.login.noAccount')}{' '}
            <Link
              href="/auth/register"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {t('auth.login.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
