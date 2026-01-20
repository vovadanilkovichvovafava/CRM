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
  Sparkles
} from 'lucide-react';

function NavBar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg">Nexus CRM</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/api/docs" className="text-sm text-white/60 hover:text-white transition-colors">
            API Docs
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm text-white/80 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 text-sm font-medium bg-white text-black rounded-lg hover:bg-white/90 transition-colors"
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
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute inset-0 radial-gradient" />

      {/* Animated orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[128px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse-glow" style={{ animationDelay: '1s' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm text-white/70">Now in public beta</span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up">
          <span className="gradient-text">The CRM that</span>
          <br />
          <span className="text-white">works for you</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          A next-generation CRM platform for affiliate marketing teams.
          Track partners, manage deals, and scale your business with powerful automation.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Link
            href="/dashboard"
            className="group px-6 py-3 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
          >
            Start for free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-6 py-3 text-white/80 font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all flex items-center gap-2">
            <Play className="w-4 h-4" />
            Watch demo
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16 mt-16 pt-16 border-t border-white/5 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">10K+</div>
            <div className="text-sm text-white/50 mt-1">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">$2B+</div>
            <div className="text-sm text-white/50 mt-1">Revenue Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-bold text-white">99.9%</div>
            <div className="text-sm text-white/50 mt-1">Uptime</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Layers,
      title: 'Flexible Data Model',
      description: 'Create custom objects, fields, and relationships. Your CRM adapts to your business, not the other way around.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Users,
      title: 'Partner Management',
      description: 'Track affiliates, webmasters, and partners in one place. Manage payouts, performance, and communications.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Instant insights into your pipeline, conversions, and revenue. Make data-driven decisions faster.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Zap,
      title: 'Workflow Automation',
      description: 'Automate repetitive tasks, notifications, and data updates. Focus on what matters most.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption, SSO, audit logs, and granular permissions. Your data is always protected.',
      gradient: 'from-indigo-500 to-violet-500',
    },
    {
      icon: Globe,
      title: 'API-First Platform',
      description: 'Full REST API and webhooks. Integrate with your existing tools or build custom solutions.',
      gradient: 'from-teal-500 to-blue-500',
    },
  ];

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 radial-gradient-bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Everything you need to
            <span className="gradient-text-blue"> scale your business</span>
          </h2>
          <p className="text-lg text-white/60">
            Built for modern affiliate marketing teams who demand flexibility,
            power, and speed.
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
    { name: 'Acme Corp', status: 'Active', revenue: '$124,500', growth: '+23%' },
    { name: 'TechFlow Inc', status: 'Active', revenue: '$89,200', growth: '+18%' },
    { name: 'DataSync Ltd', status: 'Pending', revenue: '$67,800', growth: '+12%' },
    { name: 'CloudBase', status: 'Active', revenue: '$156,000', growth: '+31%' },
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Your data,
              <span className="gradient-text"> beautifully organized</span>
            </h2>
            <p className="text-lg text-white/60 mb-8">
              See all your partners, deals, and activities in one unified view.
              Filter, sort, and customize to match your workflow.
            </p>

            <ul className="space-y-4">
              {['Custom views and filters', 'Real-time collaboration', 'Bulk actions and imports', 'Advanced search'].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-white/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Demo table */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-2xl" />
            <div className="relative glass-card p-1 animate-float">
              <div className="bg-black/40 rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 text-sm font-medium text-white/50">
                  <div>Partner</div>
                  <div>Status</div>
                  <div>Revenue</div>
                  <div>Growth</div>
                </div>

                {/* Table rows */}
                {demoData.map((row, index) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="font-medium">{row.name}</div>
                    <div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        row.status === 'Active'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="text-white/80">{row.revenue}</div>
                    <div className="text-green-400">{row.growth}</div>
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

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
          Ready to transform your
          <span className="gradient-text"> business?</span>
        </h2>
        <p className="text-lg text-white/60 mb-10 max-w-2xl mx-auto">
          Join thousands of affiliate marketing teams who are already using
          Nexus CRM to scale their operations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="group px-8 py-4 bg-white text-black font-medium rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
          >
            Start your free trial
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/api/docs"
            className="px-8 py-4 text-white/80 font-medium rounded-xl border border-white/10 hover:bg-white/5 transition-all"
          >
            View API Docs
          </Link>
        </div>

        <p className="text-sm text-white/40 mt-6">
          No credit card required. Free 14-day trial.
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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Nexus CRM</span>
          </div>

          <div className="flex items-center gap-8 text-sm text-white/50">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/api/docs" className="hover:text-white transition-colors">API</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>

          <div className="text-sm text-white/40">
            &copy; 2024 Nexus CRM. All rights reserved.
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
