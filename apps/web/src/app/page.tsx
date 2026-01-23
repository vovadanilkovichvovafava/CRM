'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  Layers,
  Shield,
  CheckCircle2,
  TrendingUp,
  Target,
  Clock,
  Loader2,
  AlertTriangle,
  DollarSign,
  Globe2,
  Workflow,
  FileSpreadsheet,
  LineChart,
  UserCheck,
  MessageSquare,
  Lock,
  Gauge,
  Award,
  Mail,
  LayoutDashboard,
  KanbanSquare,
  Link2,
  Wrench,
  type LucideIcon
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth';

function JanusLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="janusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
        <linearGradient id="janusGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44"
        stroke="url(#janusGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M24 4C35 4 44 13 44 24C44 35 35 44 24 44"
        stroke="url(#janusGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <line x1="24" y1="8" x2="24" y2="40" stroke="url(#janusGradient)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="20" r="3" fill="url(#janusGradient2)" />
      <circle cx="32" cy="20" r="3" fill="url(#janusGradient)" />
      <circle cx="24" cy="32" r="4" fill="url(#janusGradient)" />
    </svg>
  );
}

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <JanusLogo className="w-9 h-9" />
          <span className="font-bold text-xl tracking-tight">Janus</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">
            Возможности
          </Link>
          <Link href="#solutions" className="text-sm text-white/60 hover:text-white transition-colors">
            Решения
          </Link>
          <Link href="#integrations" className="text-sm text-white/60 hover:text-white transition-colors">
            Интеграции
          </Link>
          <Link href="/api/docs" className="text-sm text-white/60 hover:text-white transition-colors">
            API
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
          >
            Начать работу
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 radial-gradient" />

      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px] animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
          <Target className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-white/70">CRM для арбитражных команд</span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
          <span className="text-white">Партнёры, лиды, выплаты —</span>
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">полный контроль</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/60 max-w-3xl mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          Единая система для управления партнёрами, скоринга качества трафика,
          контроля выплат и real-time аналитики. Без Excel и хаоса.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Link
            href="/dashboard"
            className="group px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            Начать работу
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3.5 text-white/80 font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2"
          >
            Войти в систему
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Без кредитной карты</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Онбординг за 15 минут</span>
          </div>
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Поддержка в Telegram</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mt-20 pt-16 border-t border-white/5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">+32%</div>
            <div className="text-sm text-white/50 mt-1">к ROI с авто-скорингом</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">0</div>
            <div className="text-sm text-white/50 mt-1">ошибок в выплатах</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Real-time</div>
            <div className="text-sm text-white/50 mt-1">данные из Keitaro</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemsSection() {
  const problems = [
    {
      problem: 'Данные в 5 местах',
      description: 'Excel, Google Sheets, Telegram, трекер, голова...',
      solution: 'Единый таймлайн по каждому партнёру',
      icon: FileSpreadsheet,
      color: 'from-red-500 to-orange-500',
    },
    {
      problem: 'Партнёр сливает мусор',
      description: 'Узнаёте когда уже потеряли деньги',
      solution: 'Авто-скоринг и алерты при падении качества',
      icon: AlertTriangle,
      color: 'from-yellow-500 to-amber-500',
    },
    {
      problem: 'Выплаты путаются',
      description: 'Кому сколько должны, кто когда платил',
      solution: 'Баланс, история, автоматизация расчётов',
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    {
      problem: 'ROI видно через сутки',
      description: 'Решения принимаете по вчерашним данным',
      solution: 'Real-time аналитика из Keitaro',
      icon: Clock,
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 radial-gradient-bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Знакомые
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"> проблемы?</span>
          </h2>
          <p className="text-lg text-white/60">
            Мы создали Janus, потому что сами устали от этого хаоса
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((item, index) => (
            <div
              key={item.problem}
              className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-300"
            >
              <div className="flex items-start gap-6">
                <div className={`flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                  <item.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white/40 text-sm">Проблема:</span>
                    <span className="text-white font-semibold">{item.problem}</span>
                  </div>
                  <p className="text-white/50 text-sm mb-4">{item.description}</p>
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">{item.solution}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Award,
      title: 'Webmaster Scoring',
      description: 'Автоматический скоринг партнёров по объёму, качеству, надёжности и коммуникации. Градация Gold / Silver / Bronze.',
      gradient: 'from-yellow-500 to-amber-500',
      badge: 'AI-powered',
    },
    {
      icon: LineChart,
      title: 'Keitaro Integration',
      description: 'Live статистика по кампаниям прямо в CRM. Clicks, conversions, ROI, CR — всё в реальном времени.',
      gradient: 'from-sky-500 to-blue-500',
      badge: 'Real-time',
    },
    {
      icon: Globe2,
      title: 'Offer Management',
      description: 'Multi-GEO офферы с автоматическим cap tracking. Знайте когда оффер close to cap.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: DollarSign,
      title: 'Контроль выплат',
      description: 'История балансов, автоматизация расчётов, прозрачность для партнёров. Конец спорам о деньгах.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Workflow,
      title: 'Workflow Automation',
      description: 'Автоматические алерты, смена статусов, отправка в Telegram. Настройте один раз — работает всегда.',
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      icon: KanbanSquare,
      title: 'Project Management',
      description: 'ClickUp-style задачи: Kanban, списки, подзадачи, time tracking. Всё для командной работы.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Target,
      title: 'Lead Scoring',
      description: 'AI-скоринг лидов на основе поведения и данных. Приоритизируйте самые горячие сделки.',
      gradient: 'from-teal-500 to-cyan-500',
    },
    {
      icon: Layers,
      title: 'Гибкая модель данных',
      description: 'Создавайте кастомные объекты, поля и связи. CRM адаптируется под ваш бизнес.',
      gradient: 'from-rose-500 to-pink-500',
    },
  ];

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 radial-gradient-bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
            <Zap className="w-4 h-4" />
            Возможности
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Всё что нужно
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> арбитражной команде</span>
          </h2>
          <p className="text-lg text-white/60">
            Не generic CRM, а специализированный инструмент для affiliate marketing
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-300"
            >
              {feature.badge && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {feature.badge}
                  </span>
                </div>
              )}

              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const useCases = [
    {
      role: 'Affiliate Manager',
      description: 'Полный контроль над партнёрской сетью',
      features: ['Карточки партнёров с историей', 'Скоринг и сегментация', 'Массовые коммуникации'],
      icon: Users,
      color: 'from-purple-500 to-pink-500',
    },
    {
      role: 'Media Buyer',
      description: 'Быстрые решения на основе данных',
      features: ['Real-time статистика', 'Алерты по CR/ROI', 'Связь оффер-кампания'],
      icon: TrendingUp,
      color: 'from-sky-500 to-blue-500',
    },
    {
      role: 'Finance / Payouts',
      description: 'Прозрачные выплаты без ошибок',
      features: ['Баланс каждого партнёра', 'История транзакций', 'Автоматические расчёты'],
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
    },
    {
      role: 'Team Lead / Owner',
      description: 'Полная картина бизнеса',
      features: ['Дашборд с KPI', 'Аналитика по команде', 'Прогноз revenue'],
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <section id="solutions" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
            <UserCheck className="w-4 h-4" />
            Для кого
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Решения для
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> каждой роли</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase) => (
            <div
              key={useCase.role}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center mb-5`}>
                <useCase.icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold mb-2">{useCase.role}</h3>
              <p className="text-white/50 text-sm mb-4">{useCase.description}</p>

              <ul className="space-y-2">
                {useCase.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function IntegrationsSection() {
  const integrations: { name: string; description: string; icon: LucideIcon; gradient: string }[] = [
    { name: 'Keitaro', description: 'Real-time трекинг', icon: BarChart3, gradient: 'from-green-500 to-emerald-500' },
    { name: 'Telegram', description: 'Алерты и уведомления', icon: MessageSquare, gradient: 'from-sky-500 to-blue-500' },
    { name: 'Postback/S2S', description: 'Любые партнёрки', icon: Link2, gradient: 'from-purple-500 to-pink-500' },
    { name: 'Webhooks', description: 'Custom интеграции', icon: Zap, gradient: 'from-yellow-500 to-amber-500' },
    { name: 'REST API', description: 'Полный доступ', icon: Wrench, gradient: 'from-slate-400 to-slate-500' },
    { name: 'Email', description: 'Resend, SMTP', icon: Mail, gradient: 'from-indigo-500 to-violet-500' },
  ];

  return (
    <section id="integrations" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 radial-gradient-bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm mb-6">
              <Zap className="w-4 h-4" />
              Интеграции
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Подключается к
              <span className="bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent"> вашему стеку</span>
            </h2>
            <p className="text-lg text-white/60 mb-8">
              Keitaro, Telegram, любые партнёрки через Postback.
              Полный API для кастомных интеграций.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/80">Синхронизация данных в реальном времени</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/80">Webhooks для двусторонней интеграции</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-white/80">OpenAPI документация</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all text-center group"
              >
                <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${integration.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <integration.icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-medium text-white mb-1">{integration.name}</div>
                <div className="text-xs text-white/50">{integration.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <Gauge className="w-8 h-8 text-indigo-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-1">99.9%</div>
            <div className="text-sm text-white/50">Uptime SLA</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <Shield className="w-8 h-8 text-green-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-1">GDPR</div>
            <div className="text-sm text-white/50">Compliant</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <Lock className="w-8 h-8 text-purple-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-1">Role-based</div>
            <div className="text-sm text-white/50">Access control</div>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
            <MessageSquare className="w-8 h-8 text-sky-400 mx-auto mb-4" />
            <div className="text-2xl font-bold text-white mb-1">24/7</div>
            <div className="text-sm text-white/50">Telegram support</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const tabs = [
    { id: 'partners', label: 'Партнёры', icon: Users },
    { id: 'analytics', label: 'Аналитика', icon: BarChart3 },
    { id: 'tasks', label: 'Задачи', icon: KanbanSquare },
  ];

  const [activeTab, setActiveTab] = useState('partners');

  const demoData = {
    partners: [
      { name: 'TrafficMaster', status: 'Gold', score: 95, revenue: '$124,500', cr: '4.2%', trend: '+23%' },
      { name: 'AffiliateKing', status: 'Silver', score: 78, revenue: '$89,200', cr: '3.1%', trend: '+18%' },
      { name: 'LeadGen Pro', status: 'Gold', score: 92, revenue: '$156,000', cr: '3.8%', trend: '+31%' },
      { name: 'ConvertMax', status: 'Bronze', score: 65, revenue: '$45,800', cr: '2.4%', trend: '+8%' },
    ],
  };

  return (
    <section id="demo" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm mb-6">
            <LayoutDashboard className="w-4 h-4" />
            Live Preview
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Посмотрите
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent"> как это работает</span>
          </h2>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
          <div className="relative glass-card p-1">
            <div className="bg-black/60 rounded-xl overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 text-sm font-medium text-white/50">
                <div>Партнёр</div>
                <div>Статус</div>
                <div>Score</div>
                <div>Revenue</div>
                <div>CR</div>
                <div>Тренд</div>
              </div>

              {demoData.partners.map((row, index) => (
                <div
                  key={row.name}
                  className="grid grid-cols-6 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="font-medium text-white/90">{row.name}</div>
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      row.status === 'Gold'
                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                        : row.status === 'Silver'
                        ? 'bg-slate-400/10 text-slate-300 border border-slate-400/20'
                        : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {row.status}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            row.score >= 90 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                            row.score >= 70 ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                            'bg-gradient-to-r from-orange-500 to-red-500'
                          }`}
                          style={{ width: `${row.score}%` }}
                        />
                      </div>
                      <span className="text-sm text-white/60">{row.score}</span>
                    </div>
                  </div>
                  <div className="text-white/80">{row.revenue}</div>
                  <div className="text-white/60">{row.cr}</div>
                  <div className="text-green-400 font-medium">{row.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 radial-gradient" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-purple-500/10 rounded-full blur-[100px] animate-pulse-glow" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <JanusLogo className="w-16 h-16 mx-auto mb-8" />

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Готовы навести порядок
          <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent"> в партнёрке?</span>
        </h2>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
          Начните использовать Janus прямо сейчас — регистрация займёт меньше минуты.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            Начать работу
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-4 text-white/80 font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all"
          >
            Войти в систему
          </Link>
        </div>

        <p className="text-sm text-white/40 mt-6">
          Полный доступ ко всем функциям. Без ограничений.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <JanusLogo className="w-8 h-8" />
              <span className="font-bold text-lg">Janus</span>
            </div>
            <p className="text-sm text-white/50 mb-4">
              CRM для арбитражных команд.
              Партнёры, лиды, выплаты — полный контроль.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Продукт</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="#features" className="hover:text-white transition-colors">Возможности</Link></li>
              <li><Link href="#solutions" className="hover:text-white transition-colors">Решения</Link></li>
              <li><Link href="#integrations" className="hover:text-white transition-colors">Интеграции</Link></li>
              <li><Link href="/api/docs" className="hover:text-white transition-colors">API</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Компания</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="#" className="hover:text-white transition-colors">О нас</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Блог</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Вакансии</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Контакты</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Правовое</h4>
            <ul className="space-y-2 text-sm text-white/50">
              <li><Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5">
          <div className="text-sm text-white/40">
            &copy; 2026 Janus CRM. All rights reserved.
          </div>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <Link href="https://t.me/janus_crm" className="hover:text-white transition-colors">Telegram</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
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

  if (isChecking || token) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />
      <HeroSection />
      <ProblemsSection />
      <FeaturesSection />
      <IntegrationsSection />
      <UseCasesSection />
      <DemoSection />
      <TrustSection />
      <CTASection />
      <Footer />
    </main>
  );
}
