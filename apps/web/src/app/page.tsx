'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Zap,
  BarChart3,
  Users,
  Layers,
  Shield,
  Globe,
  CheckCircle2,
  Play,
  Eye,
  History,
  TrendingUp,
  Target,
  Clock,
  Sparkles
} from 'lucide-react';

function JanusLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Dual face symbol - abstract representation of Janus */}
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
      {/* Left face - looking to past */}
      <path
        d="M24 4C13 4 4 13 4 24C4 35 13 44 24 44"
        stroke="url(#janusGradient2)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right face - looking to future */}
      <path
        d="M24 4C35 4 44 13 44 24C44 35 35 44 24 44"
        stroke="url(#janusGradient)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center vertical line */}
      <line x1="24" y1="8" x2="24" y2="40" stroke="url(#janusGradient)" strokeWidth="2" strokeLinecap="round" />
      {/* Left eye - past */}
      <circle cx="16" cy="20" r="3" fill="url(#janusGradient2)" />
      {/* Right eye - future */}
      <circle cx="32" cy="20" r="3" fill="url(#janusGradient)" />
      {/* Connection point */}
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
            Features
          </Link>
          <Link href="#demo" className="text-sm text-white/60 hover:text-white transition-colors">
            Demo
          </Link>
          <Link href="/api/docs" className="text-sm text-white/60 hover:text-white transition-colors">
            API Docs
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/25"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background effects */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute inset-0 radial-gradient" />

      {/* Animated dual orbs - representing past and future */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[150px] animate-pulse-glow" />
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
          <Eye className="w-4 h-4 text-indigo-400" />
          <span className="text-sm text-white/70">See everything. Miss nothing.</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
          <span className="text-white">Видим прошлое,</span>
          <br />
          <span className="bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">строим будущее</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <span className="text-white/80 font-medium">Janus CRM</span> — полная картина клиента.
        </p>
        <p className="text-base sm:text-lg text-white/50 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          Платформа нового поколения для affiliate marketing. Управляйте партнёрами,
          сделками и масштабируйте бизнес с мощной автоматизацией.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Link
            href="/dashboard"
            className="group px-6 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            Начать бесплатно
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-6 py-3.5 text-white/80 font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2">
            <Play className="w-4 h-4" />
            Смотреть демо
          </button>
        </div>

        {/* Janus concept - Past & Future */}
        <div className="flex items-center justify-center gap-16 mt-20 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 text-sky-400/80">
            <History className="w-5 h-5" />
            <span className="text-sm font-medium">История взаимодействий</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex items-center gap-3 text-purple-400/80">
            <TrendingUp className="w-5 h-5" />
            <span className="text-sm font-medium">Прогнозы и аналитика</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mt-16 pt-16 border-t border-white/5 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">360°</div>
            <div className="text-sm text-white/50 mt-1">Обзор клиента</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">AI</div>
            <div className="text-sm text-white/50 mt-1">Умный скоринг</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">Real-time</div>
            <div className="text-sm text-white/50 mt-1">Синхронизация</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Eye,
      title: 'Полная видимость',
      description: 'Вся история взаимодействий с клиентом в одном месте. Звонки, письма, сделки, задачи — ничего не упустите.',
      gradient: 'from-sky-500 to-blue-500',
    },
    {
      icon: Layers,
      title: 'Гибкая модель данных',
      description: 'Создавайте кастомные объекты, поля и связи. CRM адаптируется под ваш бизнес, а не наоборот.',
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Users,
      title: 'Управление партнёрами',
      description: 'Отслеживайте аффилиатов, вебмастеров и партнёров. Управляйте выплатами и коммуникациями.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Аналитика в реальном времени',
      description: 'Мгновенные инсайты по воронке, конверсиям и доходам. Принимайте решения на основе данных.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Zap,
      title: 'Автоматизация',
      description: 'Автоматизируйте рутинные задачи, уведомления и обновления. Фокусируйтесь на важном.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Target,
      title: 'Lead Scoring',
      description: 'AI-скоринг лидов на основе поведения и данных. Приоритизируйте самые горячие сделки.',
      gradient: 'from-teal-500 to-cyan-500',
    },
  ];

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 radial-gradient-bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            Возможности
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Всё для
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent"> масштабирования бизнеса</span>
          </h2>
          <p className="text-lg text-white/60">
            Создан для современных команд affiliate marketing,
            которые требуют гибкости, мощности и скорости.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-white/60 leading-relaxed">{feature.description}</p>

              {/* Hover effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const demoData = [
    { name: 'MediaBuyers Pro', status: 'Gold', score: 95, revenue: '$124,500', trend: '+23%' },
    { name: 'TrafficFlow Inc', status: 'Silver', score: 78, revenue: '$89,200', trend: '+18%' },
    { name: 'AdScale Ltd', status: 'Bronze', score: 65, revenue: '$67,800', trend: '+12%' },
    { name: 'ConvertMax', status: 'Gold', score: 92, revenue: '$156,000', trend: '+31%' },
  ];

  return (
    <section id="demo" className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-6">
              <Eye className="w-4 h-4" />
              Live Preview
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ваши данные,
              <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent"> красиво организованы</span>
            </h2>
            <p className="text-lg text-white/60 mb-8">
              Все партнёры, сделки и активности в единой системе.
              Фильтруйте, сортируйте и настраивайте под свой workflow.
            </p>

            <ul className="space-y-4">
              {[
                { icon: Layers, text: 'Кастомные представления и фильтры' },
                { icon: Users, text: 'Real-time коллаборация' },
                { icon: Clock, text: 'История всех изменений' },
                { icon: Target, text: 'AI-скоринг партнёров' },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-white/80">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Demo table */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            <div className="relative glass-card p-1 animate-float">
              <div className="bg-black/60 rounded-xl overflow-hidden backdrop-blur-sm">
                {/* Table header */}
                <div className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/5 text-sm font-medium text-white/50">
                  <div>Партнёр</div>
                  <div>Статус</div>
                  <div>Score</div>
                  <div>Доход</div>
                  <div>Тренд</div>
                </div>

                {/* Table rows */}
                {demoData.map((row, index) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
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
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                            style={{ width: `${row.score}%` }}
                          />
                        </div>
                        <span className="text-sm text-white/60">{row.score}</span>
                      </div>
                    </div>
                    <div className="text-white/80">{row.revenue}</div>
                    <div className="text-green-400 font-medium">{row.trend}</div>
                  </div>
                ))}
              </div>
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

      {/* Animated background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-purple-500/10 rounded-full blur-[100px] animate-pulse-glow" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <JanusLogo className="w-16 h-16 mx-auto mb-8" />

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Готовы видеть
          <span className="bg-gradient-to-r from-sky-400 to-purple-400 bg-clip-text text-transparent"> полную картину?</span>
        </h2>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
          Присоединяйтесь к командам, которые уже используют Janus
          для масштабирования своего бизнеса.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            Начать бесплатно
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/api/docs"
            className="px-8 py-4 text-white/80 font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all"
          >
            API Documentation
          </Link>
        </div>

        <p className="text-sm text-white/40 mt-6">
          Без кредитной карты. 14 дней бесплатно.
        </p>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <JanusLogo className="w-8 h-8" />
            <div>
              <span className="font-bold text-lg">Janus</span>
              <span className="text-white/40 text-sm ml-2">See everything. Miss nothing.</span>
            </div>
          </div>

          <div className="flex items-center gap-8 text-sm text-white/50">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="/api/docs" className="hover:text-white transition-colors">API</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
          </div>

          <div className="text-sm text-white/40">
            &copy; 2026 Janus CRM
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <NavBar />
      <HeroSection />
      <FeaturesSection />
      <DemoSection />
      <CTASection />
      <Footer />
    </main>
  );
}
