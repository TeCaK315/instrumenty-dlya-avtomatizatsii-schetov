'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Sparkles, Check, ArrowRight, Menu, X, Star, ChevronRight, Zap, Target } from 'lucide-react';

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

function FeatureIcon({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const icons: Record<string, any> = { Zap, Target };
  const Icon = icons[name] || Sparkles;
  return <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />;
}

/* ─── Animated counter ─── */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1800;
    const step = Math.max(1, Math.floor(target / (duration / 16)));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [target]);
  return <>{count.toLocaleString()}{suffix}</>;
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#1a202c', color: '#edf2f7' }}>

      {/* ═══════════ HEADER — glass morphism ═══════════ */}
      <header
        className="sticky top-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? '#1a202ccc' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.4)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.4)' : 'none',
          borderBottom: scrolled ? '1px solid #5a67d812' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px #5a67d808' : 'none',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 20px #5a67d840' }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Инструменты для автоматизации счетов
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'How It Works', 'Pricing'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, '-')}`}
                className="px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/[0.06]"
                style={{ color: '#edf2f770' }}
              >
                {item}
              </a>
            ))}
            <div className="w-px h-5 mx-3" style={{ background: '#5a67d815' }} />
            <Link href="/login" className="px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-white/[0.06]" style={{ color: '#edf2f770' }}>Sign In</Link>
            <Link
              href="/dashboard"
              className="ml-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 24px #5a67d830' }}
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
          <div className="md:hidden px-6 py-4 space-y-1" style={{ background: '#1a202cf0', backdropFilter: 'blur(20px)', borderTop: '1px solid #5a67d810' }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm" style={{ color: '#edf2f770' }}>Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm" style={{ color: '#edf2f770' }}>How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 rounded-lg text-sm" style={{ color: '#edf2f770' }}>Pricing</a>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/login" className="px-3 py-2.5 rounded-lg text-sm text-center" style={{ color: '#edf2f770' }}>Sign In</Link>
              <Link href="/dashboard" className="px-3 py-2.5 rounded-xl text-sm font-semibold text-white text-center" style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}>Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ HERO — dramatic glow + gradient text ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Ambient orbs — visible this time */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-30%] right-[-5%] w-[800px] h-[800px] rounded-full" style={{ background: 'radial-gradient(circle, #5a67d818 0%, transparent 70%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, #f6ad5512 0%, transparent 70%)', filter: 'blur(60px)' }} />
          <div className="absolute top-[20%] left-[50%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, #4a556810 0%, transparent 70%)', filter: 'blur(100px)' }} />
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(#5a67d806 1px, transparent 1px), linear-gradient(90deg, #5a67d806 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
        }} />

        <div className="relative max-w-4xl mx-auto px-6 pt-28 pb-20 md:pt-40 md:pb-32 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold mb-10 transition-all duration-300 hover:scale-105 cursor-default"
            style={{
              background: '#5a67d810',
              color: '#5a67d8',
              border: '1px solid #5a67d820',
              boxShadow: '0 0 20px #5a67d810',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            &lt; 2 минут
          </div>

          {/* Gradient headline */}
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight mb-8"
            style={{
              fontFamily: "'Montserrat', sans-serif",
              background: 'linear-gradient(135deg, #edf2f7 0%, #edf2f7 40%, #5a67d8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl mb-14 max-w-2xl mx-auto leading-relaxed font-light" style={{ color: '#edf2f760' }}>
            Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 40px #5a67d830, 0 8px 32px #5a67d820' }}
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#how-it-works"
              className="group w-full sm:w-auto px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-white/[0.06] text-center flex items-center justify-center gap-2"
              style={{ border: '1px solid #5a67d820', color: '#edf2f7' }}
            >
              See How It Works
              <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" style={{ color: '#edf2f750' }} />
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF / STATS BAR ═══════════ */}
      <section className="relative z-10 py-6 px-6">
        <div
          className="max-w-4xl mx-auto rounded-2xl p-6 md:p-8 flex flex-wrap items-center justify-center gap-8 md:gap-16"
          style={{
            background: '#ffffff08',
            border: '1px solid #5a67d810',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#5a67d8' }}>
              <AnimatedNumber target={500} suffix="+" />
            </div>
            <div className="text-xs mt-1 uppercase tracking-wider font-medium" style={{ color: '#edf2f750' }}>Active Users</div>
          </div>
          <div className="hidden md:block w-px h-10" style={{ background: '#5a67d815' }} />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              {[0,1,2,3,4].map(i => <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#facc15' }} />)}
            </div>
            <div className="text-xs mt-2 uppercase tracking-wider font-medium" style={{ color: '#edf2f750' }}>4.9/5 Rating</div>
          </div>
          <div className="hidden md:block w-px h-10" style={{ background: '#5a67d815' }} />
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight" style={{ color: '#f6ad55' }}>
              <AnimatedNumber target={10} suffix="x" />
            </div>
            <div className="text-xs mt-1 uppercase tracking-wider font-medium" style={{ color: '#edf2f750' }}>Faster Results</div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROBLEM — glassmorphism quotes ═══════════ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#5a67d8' }}>THE PROBLEM</p>
            <h2
              className="text-3xl md:text-5xl font-bold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Sound familiar?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PAIN_POINTS.map((p: any, i: number) => (
              <div
                key={i}
                className="rounded-2xl p-7 transition-all duration-300 hover:translate-y-[-4px]"
                style={{
                  background: '#ffffff08',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid #5a67d812',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                }}
              >
                <div className="text-4xl mb-4 leading-none" style={{ color: '#5a67d8', opacity: 0.6 }}>&ldquo;</div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#edf2f780' }}>
                  {p.quote}
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full" style={{ background: '#5a67d8' }} />
                  <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: '#edf2f740' }}>
                    {p.source.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════ FEATURES — bento grid ═══════════ */}
      <section id="features" className="py-24 md:py-32 px-6 relative">
        {/* Section glow */}
        <div className="absolute right-0 top-[20%] w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #5a67d808 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#5a67d8' }}>FEATURES</p>
            <h2
              className="text-3xl md:text-5xl font-bold mb-5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Built to solve real problems
            </h2>
            <p className="text-base md:text-lg max-w-xl mx-auto" style={{ color: '#edf2f750' }}>
              Every feature addresses a real pain point.
            </p>
          </div>

          {/* Bento grid: first 2 large, rest normal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature: any, i: number) => {
              const isLarge = i < 2 && FEATURES.length >= 4;
              return (
                <div
                  key={i}
                  className={`group relative rounded-2xl p-7 transition-all duration-500 hover:translate-y-[-4px] overflow-hidden${isLarge ? ' sm:col-span-1 lg:col-span-1 lg:row-span-1' : ''}`}
                  style={{
                    background: '#ffffff08',
                    border: '1px solid #5a67d810',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2), 0 0 40px #5a67d808';
                    e.currentTarget.style.borderColor = '#5a67d825';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)';
                    e.currentTarget.style.borderColor = '#5a67d810';
                  }}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at 50% 0%, #5a67d808, transparent 70%)' }}
                  />
                  <div className="relative">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: '#5a67d815', color: '#5a67d8' }}
                    >
                      <FeatureIcon name={feature.icon} />
                    </div>
                    <h3 className="text-base font-semibold mb-2.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      {feature.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#edf2f750' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS — connected steps ═══════════ */}
      <section id="how-it-works" className="py-24 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#5a67d8' }}>HOW IT WORKS</p>
            <h2
              className="text-3xl md:text-5xl font-bold mb-5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Three simple steps
            </h2>
            <p className="text-base md:text-lg" style={{ color: '#edf2f750' }}>
              Get your Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов. in &lt; 2 минут
            </p>
          </div>
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[52px] left-[16.6%] right-[16.6%] h-px" style={{ background: 'linear-gradient(90deg, transparent, #5a67d830, #5a67d830, transparent)' }} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {STEPS.map((step: any, i: number) => (
                <div key={i} className="relative text-center group">
                  {/* Step number orb */}
                  <div className="relative inline-flex mb-8">
                    <div
                      className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center text-xl font-bold text-white transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: 'linear-gradient(135deg, #5a67d8, #4a5568)',
                        boxShadow: '0 0 30px #5a67d830, 0 8px 24px #5a67d815',
                      }}
                    >
                      {step.step}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {step.action}
                  </h3>
                  <p className="text-sm leading-relaxed max-w-[260px] mx-auto" style={{ color: '#edf2f750' }}>
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING — glass cards + featured glow ═══════════ */}
      <section id="pricing" className="py-24 md:py-32 px-6 relative">
        {/* Section glow */}
        <div className="absolute left-[10%] top-[30%] w-[400px] h-[400px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #5a67d808 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#5a67d8' }}>PRICING</p>
            <h2
              className="text-3xl md:text-5xl font-bold mb-5"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Start free, upgrade when ready
            </h2>
            <p className="text-base md:text-lg" style={{ color: '#edf2f750' }}>
              No credit card required. Cancel anytime.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {PLANS.map((plan: any, i: number) => {
              const isPro = i === 1;
              return (
                <div
                  key={i}
                  className={`relative rounded-2xl p-8 flex flex-col transition-all duration-500 hover:translate-y-[-4px]${isPro ? ' md:scale-[1.05] md:z-10' : ''}`}
                  style={{
                    background: isPro ? '#ffffff12' : '#ffffff08',
                    border: isPro ? '1px solid #5a67d830' : '1px solid #5a67d810',
                    boxShadow: isPro
                      ? '0 8px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25), 0 0 60px #5a67d815, 0 0 120px #5a67d808'
                      : '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                  }}
                >
                  {isPro && (
                    <div
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-wide uppercase"
                      style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 20px #5a67d830' }}
                    >
                      Most Popular
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-extrabold tracking-tight">
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm font-medium" style={{ color: '#edf2f740' }}>/month</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3.5 mb-10 flex-1">
                    {plan.features.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#f6ad5518' }}>
                          <Check className="w-3 h-3" style={{ color: '#f6ad55' }} />
                        </div>
                        <span className="text-sm" style={{ color: '#edf2f770' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className="w-full py-3.5 rounded-xl font-semibold text-sm text-center block transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: isPro ? 'linear-gradient(135deg, #5a67d8, #4a5568)' : 'transparent',
                      color: isPro ? 'white' : '#edf2f7',
                      border: isPro ? 'none' : '1px solid #5a67d818',
                      boxShadow: isPro ? '0 0 30px #5a67d825' : 'none',
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

      {/* ═══════════ CTA — prominent glow section ═══════════ */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="relative overflow-hidden rounded-3xl p-14 md:p-20"
            style={{
              background: '#ffffff08',
              border: '1px solid #5a67d815',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.25), 0 0 80px #5a67d810',
            }}
          >
            {/* Multiple background glows */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[-60%] left-[10%] w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, #5a67d812 0%, transparent 70%)', filter: 'blur(60px)' }} />
              <div className="absolute bottom-[-40%] right-[10%] w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, #f6ad5508 0%, transparent 70%)', filter: 'blur(60px)' }} />
            </div>
            <div className="relative">
              <h2
                className="text-3xl md:text-5xl font-bold mb-5"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Ready to get started?
              </h2>
              <p className="text-base md:text-lg mb-10" style={{ color: '#edf2f750' }}>
                Join hundreds of users who already save time with Инструменты для автоматизации счетов.
              </p>
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-semibold text-white text-lg transition-all duration-300 hover:scale-[1.03]"
                style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 40px #5a67d830, 0 8px 32px #5a67d820' }}
              >
                Create Your First Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid #5a67d808' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">Инструменты для автоматизации счетов</span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: '#edf2f750' }}>
            <a href="#" className="hover:opacity-80 transition-opacity">Privacy</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Terms</a>
            <a href="#" className="hover:opacity-80 transition-opacity">Contact</a>
          </div>
          <p className="text-xs" style={{ color: '#edf2f740' }}>
            &copy; {new Date().getFullYear()} Инструменты для автоматизации счетов
          </p>
        </div>
      </footer>
    </div>
  );
}
