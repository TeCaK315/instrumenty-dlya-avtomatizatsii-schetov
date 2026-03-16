'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Loader2, Plus, Clock, ArrowRight, FileText, TrendingUp, CheckCircle2 } from 'lucide-react';

interface HistoryItem {
  id: string;
  input: string;
  created_at: string;
  status: 'completed' | 'draft';
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      // Try Supabase first, fallback to localStorage
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (url && !url.includes('placeholder')) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('analyses')
              .select('id, input, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(10);
            if (data) {
              setHistory(data.map(a => ({ ...a, status: 'completed' as const })));
              setLoading(false);
              return;
            }
          }
        }
      } catch {}

      // localStorage fallback
      try {
        const stored = localStorage.getItem('Инструменты для автоматизации счетов_history');
        if (stored) setHistory(JSON.parse(stored));
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const totalItems = history.length;
  const lastDate = history[0]?.created_at
    ? new Date(history[0].created_at).toLocaleDateString()
    : 'No items yet';

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#edf2f7' }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: '#edf2f750' }}>Сокращение времени на выставление счетов и снижение ошибок благодаря автоматизации и интеграции.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
        >
          <Plus className="w-4 h-4" />
          New Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.
        </button>
      </div>

      {/* ─── Stats ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4" style={{ color: '#5a67d8' }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#edf2f750' }}>Total</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#edf2f7' }}>{totalItems}</p>
          <p className="text-xs mt-1" style={{ color: '#edf2f750' }}>Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.s created</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" style={{ color: '#4a5568' }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#edf2f750' }}>Last Created</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#edf2f7' }}>{lastDate}</p>
          <p className="text-xs mt-1" style={{ color: '#edf2f750' }}>Most recent Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: '#f6ad55' }} />
            <span className="text-xs font-medium uppercase tracking-wider" style={{ color: '#edf2f750' }}>Status</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: '#edf2f7' }}>Active</p>
          <p className="text-xs mt-1" style={{ color: '#edf2f750' }}>All systems operational</p>
        </div>
      </div>

      {/* ─── Create Form (collapsible) ─── */}
      {showForm && (
        <div className="rounded-2xl p-6 animate-fadeIn" style={{ background: '#ffffff12', boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)', border: '1px solid #5a67d810' }}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: '#edf2f7' }}>Автоматическое создание и отправка счетов на основе введенных данных</h2>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              try {
                const form = e.target as HTMLFormElement;
                const params = `${encodeURIComponent('client_name')}=${encodeURIComponent((form.elements.namedItem('client_name') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || '')}&${encodeURIComponent('invoice_amount')}=${encodeURIComponent((form.elements.namedItem('invoice_amount') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || '')}&${encodeURIComponent('due_date')}=${encodeURIComponent((form.elements.namedItem('due_date') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)?.value || '')}`;
                router.push(`/dashboard/analysis?${params}`);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#edf2f7' }}>Имя клиента для выставления счета</label>
                      <input
                        name="client_name"
                        type="text"
                        placeholder="Иван Иванов"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#edf2f7' }}>Сумма счета</label>
                      <input
                        name="invoice_amount"
                        type="number"
                        placeholder="1500"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: '#edf2f7' }}>Срок оплаты счета</label>
                      <input
                        name="due_date"
                        type="text"
                        placeholder="2023-12-31"
                        required
                        className="w-full px-3.5 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors"
                        style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                      />
                    </div>
                    </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: '#5a67d8' }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.</>
              )}
            </button>
          </form>
        </div>
      )}

      {/* ─── History ─── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#edf2f7' }}>
            Recent Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.s
          </h2>
          {history.length > 5 && (
            <Link href="/dashboard/history" className="text-xs font-medium flex items-center gap-1" style={{ color: '#5a67d8' }}>
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#5a67d8' }} />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: '#5a67d820' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: '#5a67d810' }}>
              <FileText className="w-6 h-6" style={{ color: '#5a67d8' }} />
            </div>
            <h3 className="text-base font-semibold mb-1" style={{ color: '#edf2f7' }}>
              No Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.s yet
            </h3>
            <p className="text-sm mb-4" style={{ color: '#edf2f750' }}>
              Create your first Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов. to get started.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: '#5a67d8' }}
            >
              <Plus className="w-4 h-4" /> New Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/analysis?id=${item.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border transition-all duration-150 hover:border-opacity-60 group"
                style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)'; e.currentTarget.style.borderColor = '#5a67d818'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)'; e.currentTarget.style.borderColor = '#5a67d808'; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#5a67d810' }}>
                  <CheckCircle2 className="w-4 h-4" style={{ color: '#5a67d8' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: '#edf2f7' }}>
                    {typeof item.input === 'string'
                      ? item.input.substring(0, 60) + (item.input.length > 60 ? '...' : '')
                      : 'Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов. #' + item.id.substring(0, 6)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#edf2f750' }}>
                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#5a67d8' }} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
