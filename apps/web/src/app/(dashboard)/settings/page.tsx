'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  User,
  Mail,
  Globe2,
  Clock,
  Save,
  LogOut,
  Shield,
  Key,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
  locale: string;
  avatar: string | null;
  createdAt: string;
}

const timezones = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/Moscow', label: 'Moscow (GMT+3)' },
  { value: 'Europe/Kiev', label: 'Kyiv (GMT+2)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (GMT+9)' },
];

const locales = [
  { value: 'en', label: 'English' },
  { value: 'ru', label: 'Русский' },
];

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, logout, token } = useAuthStore();

  // Form state
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [locale, setLocale] = useState('en');

  // Fetch current user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.me() as Promise<UserProfile>,
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTimezone(profile.timezone || 'UTC');
      setLocale(profile.locale || 'en');
    }
  }, [profile]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; timezone?: string; locale?: string }) =>
      api.users.updateMe(data) as Promise<UserProfile>,
    onSuccess: (updatedUser) => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['users', 'me'] });

      // Update auth store with new user data
      if (token) {
        setAuth(
          {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role,
          },
          token,
        );
      }
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const message = (err.data as { message?: string })?.message || 'Failed to update profile';
        toast.error(message);
      }
    },
  });

  const handleSaveProfile = () => {
    updateMutation.mutate({ name, timezone, locale });
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-white/50">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
                <User className="h-5 w-5 text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-white">Profile</CardTitle>
                <CardDescription className="text-white/50">
                  Update your personal information
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.02]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500">
                <span className="text-2xl font-bold text-white uppercase">
                  {name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-lg font-medium text-white">{name || 'User'}</p>
                <p className="text-sm text-white/50">{profile?.email}</p>
                <p className="text-xs text-white/30 mt-1">
                  Role: <span className="text-indigo-400">{profile?.role}</span>
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-10 bg-white/[0.03] border-white/10"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="pl-10 bg-white/[0.02] border-white/5 text-white/50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-white/30">Email cannot be changed</p>
            </div>

            {/* Timezone */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">Timezone</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                <Select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="pl-10"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Locale */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">Language</label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10" />
                <Select
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="pl-10"
                >
                  {locales.map((loc) => (
                    <option key={loc.value} value={loc.value}>
                      {loc.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSaveProfile}
              disabled={updateMutation.isPending}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Security Card */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-white">Security</CardTitle>
                <CardDescription className="text-white/50">
                  Manage your security settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Change Password */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-white/40" />
                <div>
                  <p className="font-medium text-white">Password</p>
                  <p className="text-sm text-white/50">Change your password</p>
                </div>
              </div>
              <Button variant="outline" className="border-white/10" disabled>
                Change
              </Button>
            </div>

            {/* Sessions (placeholder) */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-white/40" />
                <div>
                  <p className="font-medium text-white">Active Sessions</p>
                  <p className="text-sm text-white/50">Manage your active sessions</p>
                </div>
              </div>
              <Button variant="outline" className="border-white/10" disabled>
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Card */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Bell className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-white">Notifications</CardTitle>
                <CardDescription className="text-white/50">
                  Configure notification preferences
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-white/50">Receive email updates</p>
                </div>
                <Button variant="outline" className="border-white/10" disabled>
                  Configure
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">Telegram</p>
                  <p className="text-sm text-white/50">Get notifications in Telegram</p>
                </div>
                <Button variant="outline" className="border-white/10" disabled>
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Card */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="text-white">Integrations</CardTitle>
            <CardDescription className="text-white/50">
              Connect external services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02]">
                <div>
                  <p className="font-medium text-white">Keitaro</p>
                  <p className="text-sm text-white/50">Connect your Keitaro tracker</p>
                </div>
                <Button variant="outline" className="border-white/10" disabled>
                  Connect
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">Danger Zone</CardTitle>
            <CardDescription className="text-white/50">
              Irreversible actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Log out</p>
                <p className="text-sm text-white/50">Sign out from your account</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
