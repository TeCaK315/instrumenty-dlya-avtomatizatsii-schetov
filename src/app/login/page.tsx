'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a202c' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: '#edf2f7' }}>
            Вход в Инструменты для автоматизации счетов
          </h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm mb-2" style={{ color: '#edf2f7' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ background: '#1a202c', borderColor: '#5a67d840', color: '#edf2f7' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-2" style={{ color: '#edf2f7' }}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:outline-none focus:ring-2"
              style={{ background: '#1a202c', borderColor: '#5a67d840', color: '#edf2f7' }}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
            style={{ background: '#5a67d8', color: 'white' }}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Войти'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 rounded-xl font-semibold border transition-colors hover:bg-white/5"
            style={{ borderColor: '#5a67d840', color: '#edf2f7' }}
          >
            Войти через Google
          </button>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: '#edf2f770' }}>
          Нет аккаунта?{' '}
          <Link href="/signup" style={{ color: '#5a67d8' }}>
            Зарегистрироваться
          </Link>
        </p>
      </div>
    </div>
  );
}
