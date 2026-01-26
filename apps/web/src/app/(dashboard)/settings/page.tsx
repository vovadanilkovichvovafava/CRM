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
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
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
  { value: 'Europe/Moscow', label: 'Москва (GMT+3)' },
  { value: 'Europe/Kiev', label: 'Киев (GMT+2)' },
  { value: 'Europe/London', label: 'Лондон (GMT+0)' },
  { value: 'America/New_York', label: 'Нью-Йорк (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Лос-Анджелес (GMT-8)' },
  { value: 'Asia/Tokyo', label: 'Токио (GMT+9)' },
];

const locales = [
  { value: 'ru', label: 'Русский' },
  { value: 'en', label: 'English' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuth, logout, token } = useAuthStore();

  // Form state
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [locale, setLocale] = useState('ru');

  // Password change state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email settings state
  const [resendApiKey, setResendApiKey] = useState('');
  const [emailFrom, setEmailFrom] = useState('');
  const [showResendKey, setShowResendKey] = useState(false);

  // Fetch current user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => api.users.me() as Promise<UserProfile>,
  });

  // Fetch system settings (admin only)
  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: () => api.systemSettings.get(),
    enabled: profile?.role === 'ADMIN',
  });

  // Fetch integration status
  const { data: integrationStatus } = useQuery({
    queryKey: ['system-settings', 'status'],
    queryFn: () => api.systemSettings.getStatus(),
  });

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setTimezone(profile.timezone || 'UTC');
      setLocale(profile.locale || 'ru');
    }
  }, [profile]);

  // Initialize email settings
  useEffect(() => {
    if (systemSettings) {
      setResendApiKey(systemSettings.resend_api_key || '');
      setEmailFrom(systemSettings.email_from || '');
    }
  }, [systemSettings]);

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; timezone?: string; locale?: string }) =>
      api.users.updateMe(data) as Promise<UserProfile>,
    onSuccess: (updatedUser) => {
      toast.success(t('settings.messages.profileUpdated'));
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
        const message = (err.data as { message?: string })?.message || t('errors.general');
        toast.error(message);
      }
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      api.users.changePassword(data),
    onSuccess: () => {
      toast.success(t('settings.messages.passwordChanged'));
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const message = (err.data as { message?: string })?.message || t('errors.general');
        toast.error(message);
      }
    },
  });

  // Update email settings mutation
  const updateEmailSettingsMutation = useMutation({
    mutationFn: (data: { resend_api_key?: string; email_from?: string }) =>
      api.systemSettings.update(data),
    onSuccess: () => {
      toast.success(t('settings.messages.emailSettingsUpdated'));
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        const message = (err.data as { message?: string })?.message || t('errors.general');
        toast.error(message);
      }
    },
  });

  const handleSaveProfile = () => {
    // Change language in i18n
    if (locale !== i18n.language) {
      i18n.changeLanguage(locale);
      localStorage.setItem('janus-locale', locale);
    }
    updateMutation.mutate({ name, timezone, locale });
  };

  const handleSaveEmailSettings = () => {
    updateEmailSettingsMutation.mutate({
      resend_api_key: resendApiKey,
      email_from: emailFrom,
    });
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.messages.fillAllFields'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('settings.messages.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.messages.passwordsDoNotMatch'));
      return;
    }
    changePasswordMutation.mutate({ currentPassword, newPassword });
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
        <h1 className="text-3xl font-bold text-white">{t('settings.title')}</h1>
        <p className="text-white/50">{t('settings.subtitle')}</p>
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
                <CardTitle className="text-white">{t('settings.profile.title')}</CardTitle>
                <CardDescription className="text-white/50">
                  {t('settings.profile.subtitle')}
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
                <p className="text-lg font-medium text-white">{name || t('common.user')}</p>
                <p className="text-sm text-white/50">{profile?.email}</p>
                <p className="text-xs text-white/30 mt-1">
                  {t('settings.profile.role')}: <span className="text-indigo-400">{profile?.role}</span>
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">{t('settings.profile.displayName')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('common.name')}
                  className="pl-10 bg-white/[0.03] border-white/10"
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">{t('settings.profile.email')}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                <Input
                  value={profile?.email || ''}
                  disabled
                  className="pl-10 bg-white/[0.02] border-white/5 text-white/50 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-white/30">{t('settings.profile.emailCannotChange')}</p>
            </div>

            {/* Timezone */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">{t('settings.profile.timezone')}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10 pointer-events-none" />
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Locale */}
            <div className="grid gap-2">
              <label className="text-sm font-medium text-white/70">{t('settings.profile.language')}</label>
              <div className="relative">
                <Globe2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 z-10 pointer-events-none" />
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locales.map((loc) => (
                      <SelectItem key={loc.value} value={loc.value}>
                        {loc.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
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
                  {t('settings.profile.saving')}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t('settings.profile.saveChanges')}
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
                <CardTitle className="text-white">{t('settings.security.title')}</CardTitle>
                <CardDescription className="text-white/50">
                  {t('settings.security.subtitle')}
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
                  <p className="font-medium text-white">{t('settings.security.password')}</p>
                  <p className="text-sm text-white/50">{t('settings.security.changePassword')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-white/10"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                {t('settings.security.change')}
              </Button>
            </div>

            {/* Sessions (placeholder) */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-white/40" />
                <div>
                  <p className="font-medium text-white">{t('settings.security.activeSessions')}</p>
                  <p className="text-sm text-white/50">{t('settings.security.manageSessions')}</p>
                </div>
              </div>
              <Button variant="outline" className="border-white/10" disabled>
                {t('common.view')}
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
                <CardTitle className="text-white">{t('settings.notifications.title')}</CardTitle>
                <CardDescription className="text-white/50">
                  {t('settings.notifications.subtitle')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{t('settings.notifications.email')}</p>
                  <p className="text-sm text-white/50">{t('settings.notifications.emailDescription')}</p>
                </div>
                <Button variant="outline" className="border-white/10" disabled>
                  {t('settings.notifications.configure')}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{t('settings.notifications.telegram')}</p>
                  <p className="text-sm text-white/50">{t('settings.notifications.telegramDescription')}</p>
                </div>
                <Button variant="outline" className="border-white/10" disabled>
                  {t('settings.notifications.connect')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Settings Card (Admin only) */}
        {profile?.role === 'ADMIN' && (
          <Card className="bg-white/[0.02] border-white/[0.05]">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                  <Send className="h-5 w-5 text-green-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-white">{t('settings.email.title')}</CardTitle>
                    {integrationStatus?.email ? (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        {t('settings.email.connected')}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <AlertCircle className="h-3 w-3" />
                        {t('settings.email.notConfigured')}
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-white/50">
                    {t('settings.email.subtitle')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSettings ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-white/30" />
                </div>
              ) : (
                <>
                  {/* Resend API Key */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/70">{t('settings.email.apiKey')}</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type={showResendKey ? 'text' : 'password'}
                        value={resendApiKey}
                        onChange={(e) => setResendApiKey(e.target.value)}
                        placeholder={t('settings.email.apiKeyPlaceholder')}
                        className="pl-10 pr-10 bg-white/[0.03] border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowResendKey(!showResendKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                      >
                        {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-white/30">
                      {t('settings.email.apiKeyHelp')}{' '}
                      <a
                        href="https://resend.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-400 hover:underline"
                      >
                        resend.com
                      </a>
                    </p>
                  </div>

                  {/* Email From */}
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-white/70">{t('settings.email.fromAddress')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input
                        type="email"
                        value={emailFrom}
                        onChange={(e) => setEmailFrom(e.target.value)}
                        placeholder={t('settings.email.fromAddressPlaceholder')}
                        className="pl-10 bg-white/[0.03] border-white/10"
                      />
                    </div>
                    <p className="text-xs text-white/30">
                      {t('settings.email.fromAddressHelp')}
                    </p>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveEmailSettings}
                    disabled={updateEmailSettingsMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                  >
                    {updateEmailSettingsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('settings.profile.saving')}
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        {t('settings.email.saveEmailSettings')}
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Integrations Card */}
        <Card className="bg-white/[0.02] border-white/[0.05]">
          <CardHeader>
            <CardTitle className="text-white">{t('settings.integrations.title')}</CardTitle>
            <CardDescription className="text-white/50">
              {t('settings.integrations.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02]">
                <div>
                  <p className="font-medium text-white">{t('settings.integrations.keitaro')}</p>
                  <p className="text-sm text-white/50">{t('settings.integrations.keitaroDescription')}</p>
                </div>
                <Button variant="outline" className="border-white/10" disabled>
                  {t('settings.notifications.connect')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="bg-red-500/5 border-red-500/20">
          <CardHeader>
            <CardTitle className="text-red-400">{t('settings.danger.title')}</CardTitle>
            <CardDescription className="text-white/50">
              {t('settings.danger.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">{t('settings.danger.logout')}</p>
                <p className="text-sm text-white/50">{t('settings.danger.logoutDescription')}</p>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('common.logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {
          setIsPasswordModalOpen(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }}
        title={t('settings.security.changePassword')}
        description={t('settings.security.enterCurrentPassword')}
      >
        <div className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">{t('settings.security.currentPassword')}</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t('settings.security.enterCurrentPassword')}
                className="pr-10 bg-white/[0.03] border-white/10"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">{t('settings.security.newPassword')}</label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.security.enterNewPassword')}
                className="pr-10 bg-white/[0.03] border-white/10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">{t('settings.security.confirmPassword')}</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('settings.security.confirmNewPassword')}
              className="bg-white/[0.03] border-white/10"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-white/10"
              onClick={() => {
                setIsPasswordModalOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordMutation.isPending}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings.security.changing')}
                </>
              ) : (
                t('settings.security.changePassword')
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
