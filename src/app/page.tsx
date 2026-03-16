'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Sparkles, Check, ArrowRight, Menu, X, Star, Zap, Target } from 'lucide-react';

const PLANS = [
  {
    "name": "Starter",
    "price": 0,
    "features": [
      "Limited access",
      "Basic features"
    ]
  },
  {
    "name": "Pro",
    "price": 9.99,
    "features": [
      "Безлимитные счета",
      "Интеграция с платежными системами"
    ],
    "limits": {}
  },
  {
    "name": "Business",
    "price": 29.97,
    "features": [
      "Безлимитные счета",
      "Интеграция с платежными системами",
      "Priority support",
      "API access",
      "Team collaboration"
    ]
  }
];
const FEATURES = [
  {
    "icon": "Zap",
    "title": "Автоматизированное создание счетов",
    "description": "Система автоматически генерирует счета на основе введенных данных."
  },
  {
    "icon": "Target",
    "title": "Интеграция с популярными платежными системами",
    "description": "Поддержка интеграции с PayPal, Stripe и другими системами."
  }
];
const STEPS = [
  {
    "step": 1,
    "action": "Пользователь открывает приложение и выбирает 'Создать новый счет'.",
    "detail": "Интерфейс для ввода данных о клиенте и счете."
  },
  {
    "step": 2,
    "action": "Пользователь вводит данные и нажимает 'Отправить'.",
    "detail": "Подтверждение о том, что счет успешно создан и отправлен клиенту."
  }
];
const PAIN_POINTS = [
  {
    "quote": "Необходимость автоматизации процессов выставления счетов и управления оплатами.",
    "source": "unmet_needs"
  },
  {
    "quote": "Проблемы с интеграцией и автоматизацией invoicing процессов у существующих решений.",
    "source": "unmet_needs"
  }
];

function FeatureIcon({ name }: { name: string }) {
  const icons: Record<string, any> = { Zap, Target };
  const Icon = icons[name] || Sparkles;
  return <Icon className="w-5 h-5" />;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: '#1a202c', color: '#edf2f7' }}>
      {/* ═══════════ Header ═══════════ */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl" style={{ background: '#1a202ce6', borderBottom: '1px solid #5a67d808' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 40px #5a67d825, 0 0 80px #5a67d810' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Инструменты для автоматизации счетов
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'How It Works', 'Pricing'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5"
                style={{ color: '#edf2f770' }}
              >
                {item}
              </a>
            ))}
            <div className="w-px h-5 mx-2" style={{ background: '#5a67d812' }} />
            <Link href="/login" className="px-3 py-2 rounded-lg text-sm transition-colors hover:bg-white/5" style={{ color: '#edf2f770' }}>Sign In</Link>
            <Link
              href="/dashboard"
              className="ml-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: '#5a67d8', boxShadow: '0 0 20px #5a67d820' }}
            >
              Get Started
            </Link>
          </nav>

          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: '#edf2f7' }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 space-y-1 animate-slideDown" style={{ borderTop: '1px solid #5a67d808', background: '#1a202c' }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm" style={{ color: '#edf2f770' }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm" style={{ color: '#edf2f770' }}>How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm" style={{ color: '#edf2f770' }}>Pricing</a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="px-3 py-2.5 rounded-lg text-sm text-center" style={{ color: '#edf2f770' }}>Sign In</Link>
              <Link href="/dashboard" className="px-3 py-2.5 rounded-lg text-sm font-medium text-white text-center" style={{ background: '#5a67d8' }}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ Hero ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-40%] right-[-10%] w-[700px] h-[700px] rounded-full opacity-[0.06]" style={{ background: '#5a67d8', filter: 'blur(140px)' }} />
          <div className="absolute bottom-[-30%] left-[-15%] w-[500px] h-[500px] rounded-full opacity-[0.04]" style={{ background: '#f6ad55', filter: 'blur(120px)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-28 md:pt-32 md:pb-36 text-center">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: '#5a67d810', color: '#5a67d8', border: '1px solid #5a67d818' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            &lt; 2 минут
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
            style={{ fontFamily: 'Montserrat, sans-serif' }}
          >
            Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.
          </h1>

          <p className="text-base sm:text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#edf2f770' }}>
            Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 glow-primary"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
            >
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-semibold transition-all hover:bg-white/5 text-center"
              style={{ border: '1px solid #5a67d818', color: '#edf2f7' }}
            >
              See How It Works
            </a>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: '#edf2f750' }}>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {[0,1,2,3,4].map(i => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ borderColor: '#1a202c', background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <span>Trusted by 500+ users</span>
            </div>
            <div className="hidden sm:block w-px h-4" style={{ background: '#5a67d815' }} />
            <div className="flex items-center gap-1">
              {[0,1,2,3,4].map(i => <Star key={i} className="w-3.5 h-3.5 fill-current" style={{ color: '#facc15' }} />)}
              <span className="ml-1">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Problem ═══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5a67d8' }}>THE PROBLEM</p>
            <h2 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Sound familiar?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PAIN_POINTS.map((p: any, i: number) => (
              <div
                key={i}
                className="rounded-2xl p-6"
                style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}
              >
                <div className="text-2xl mb-3" style={{ color: '#5a67d8' }}>&ldquo;</div>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#edf2f780' }}>
                  {p.quote}
                </p>
                <span className="text-xs uppercase tracking-wider font-medium" style={{ color: '#edf2f750' }}>
                  {p.source.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Features ═══════════ */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5a67d8' }}>FEATURES</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Built to solve real problems
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: '#edf2f750' }}>
              Every feature addresses a real pain point.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map((feature: any, i: number) => (
              <div
                key={i}
                className="group rounded-2xl p-6 transition-all duration-300"
                style={{
                  background: '#ffffff08',
                  border: '1px solid #5a67d808',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)';
                  e.currentTarget.style.borderColor = '#5a67d820';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = '#5a67d808';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: '#5a67d812', color: '#5a67d8' }}
                >
                  <FeatureIcon name={feature.icon} />
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#edf2f750' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ How It Works ═══════════ */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5a67d8' }}>HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Three simple steps
            </h2>
            <p className="text-base" style={{ color: '#edf2f750' }}>
              Get your Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов. in &lt; 2 минут
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step: any, i: number) => (
              <div
                key={i}
                className="relative rounded-2xl p-6 text-center"
                style={{ background: '#ffffff08', border: '1px solid #5a67d808', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-5 text-base font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 24px #5a67d820' }}
                >
                  {step.step}
                </div>
                <h3 className="text-base font-semibold mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {step.action}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#edf2f750' }}>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ Pricing ═══════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#5a67d8' }}>PRICING</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Start free, upgrade when ready
            </h2>
            <p className="text-base" style={{ color: '#edf2f750' }}>
              No credit card required. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan: any, i: number) => {
              const isPro = i === 1;
              return (
                <div
                  key={i}
                  className="relative rounded-2xl p-7 flex flex-col transition-all duration-300"
                  style={{
                    background: isPro ? '#ffffff12' : '#ffffff08',
                    border: isPro ? '1px solid #5a67d830' : '1px solid #5a67d808',
                    boxShadow: isPro ? '0 8px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25), 0 0 40px #5a67d825, 0 0 80px #5a67d810' : '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  {isPro && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight">
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm" style={{ color: '#edf2f750' }}>/month</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f6ad55' }} />
                        <span className="text-sm" style={{ color: '#edf2f770' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className="w-full py-3 rounded-xl font-semibold text-sm text-center block transition-all hover:opacity-90"
                    style={{
                      background: isPro ? 'linear-gradient(135deg, #5a67d8, #4a5568)' : 'transparent',
                      color: isPro ? 'white' : '#edf2f7',
                      border: isPro ? 'none' : '1px solid #5a67d818',
                      boxShadow: isPro ? '0 0 24px #5a67d820' : 'none',
                    }}
                  >
                    {plan.price === 0 ? 'Get Started' : 'Start Free Trial'}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="relative overflow-hidden rounded-3xl p-12 md:p-16"
            style={{ background: '#ffffff08', border: '1px solid #5a67d810', boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25)' }}
          >
            {/* Background glow */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[-50%] left-[20%] w-[400px] h-[400px] rounded-full opacity-[0.06]" style={{ background: '#5a67d8', filter: 'blur(80px)' }} />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Ready to get started?
              </h2>
              <p className="text-base mb-8" style={{ color: '#edf2f750' }}>
                Join hundreds of users who already save time with Инструменты для автоматизации счетов.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:opacity-90 glow-primary"
                style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
              >
                Create Your First Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов. <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ Footer ═══════════ */}
      <footer className="py-10 px-6" style={{ borderTop: '1px solid #5a67d808' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}>
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Инструменты для автоматизации счетов</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#edf2f750' }}>
            <a href="#" className="hover:opacity-80 transition-opacity">Privacy</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Terms</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Contact</a>
          </div>
          <p className="text-xs" style={{ color: '#edf2f750' }}>
            &copy; {new Date().getFullYear()} Инструменты для автоматизации счетов
          </p>
        </div>
      </footer>
    </div>
  );
}
