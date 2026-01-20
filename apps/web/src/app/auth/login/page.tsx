'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
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
        <linearGradient id="authJanusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="authJanusGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44"
        stroke="url(#authJanusGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4C35 4 44 13 44 24C44 35 35 44 24 44"
        stroke="url(#authJanusGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <line
        x1="24"
        y1="8"
        x2="24"
        y2="40"
        stroke="url(#authJanusGradient)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="16" cy="20" r="3" fill="url(#authJanusGradient2)" />
      <circle cx="32" cy="20" r="3" fill="url(#authJanusGradient)" />
      <circle cx="24" cy="32" r="4" fill="url(#authJanusGradient)" />
    </svg>
  );
}

function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type AuthStep = 'initial' | 'email-sent' | 'verify-code';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<AuthStep>('initial');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setIsLoading(true);

    try {
      await api.auth.sendCode({ email });
      setStep('verify-code');
      toast.success('Verification code sent to your email');
    } catch (error) {
      console.error('Send code error:', error);
      if (error instanceof ApiError) {
        const data = error.data as { message?: string };
        toast.error(data?.message || 'Failed to send verification code');
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code || code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);

    try {
      const { user, token } = await api.auth.verifyCode({ email, code });
      setAuth(user, token);
      toast.success(`Welcome, ${user.name || user.email}!`);
      router.push('/dashboard');
    } catch (error) {
      console.error('Verify code error:', error);
      if (error instanceof ApiError) {
        const data = error.data as { message?: string };
        toast.error(data?.message || 'Invalid or expired code');
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('initial');
    setCode('');
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await api.auth.sendCode({ email });
      toast.success('New code sent to your email');
    } catch (error) {
      toast.error('Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-12">
        <JanusLogo className="w-14 h-14" />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm">
        {step === 'initial' && (
          <>
            <h1 className="text-2xl font-semibold text-white text-center mb-8">
              Sign in
            </h1>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white/[0.03] border border-white/10 rounded-lg text-white font-medium hover:bg-white/[0.06] hover:border-white/20 transition-all mb-6"
            >
              <GoogleIcon />
              Sign in with Google
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSubmit}>
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work email address"
                  className="w-full pl-10 pr-4 py-3 bg-transparent border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </>
        )}

        {step === 'verify-code' && (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/60 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <h1 className="text-2xl font-semibold text-white mb-2">
              Check your email
            </h1>
            <p className="text-white/50 mb-6">
              We sent a verification code to <span className="text-white">{email}</span>
            </p>

            <form onSubmit={handleVerifyCode}>
              <div className="mb-4">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-lg text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/30 placeholder:tracking-normal placeholder:text-base focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="w-full mt-4 py-2 text-white/50 hover:text-white text-sm transition-colors disabled:opacity-50"
              >
                Didn&apos;t receive a code? Resend
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-16 text-center">
        <p className="text-white/30 text-sm mb-4 max-w-xs">
          By proceeding you acknowledge that you have read, understood and agree to our{' '}
          <a href="#" className="text-white/50 hover:text-white underline">
            Terms and Conditions
          </a>
          .
        </p>
        <div className="flex items-center justify-center gap-6 text-sm text-white/40">
          <span>&copy; 2026 Janus CRM</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </div>
  );
}
