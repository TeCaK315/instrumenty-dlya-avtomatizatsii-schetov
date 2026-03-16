'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a202c' }}>
        <div className="text-center">
          <h2 className="text-2xl font-heading font-bold mb-4" style={{ color: '#edf2f7' }}>
            Проверьте почту
          </h2>
          <p style={{ color: '#edf2f770' }}>
            Мы отправили ссылку для подтверждения на {email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#1a202c' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: '#edf2f7' }}>
            Регистрация
          </h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
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
              minLength={6}
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
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Создать аккаунт'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: '#edf2f770' }}>
          Уже есть аккаунт?{' '}
          <Link href="/login" style={{ color: '#5a67d8' }}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
