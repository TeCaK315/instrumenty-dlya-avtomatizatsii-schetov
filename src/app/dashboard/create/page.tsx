'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, FileText } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

export default function CreatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');

  // ─── Calculations ───
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      ...formData,
      items: items.filter(i => i.description),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes,
    };

    try {
      // Call API
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        // Save to localStorage for history
        try {
          const historyKey = 'Инструменты для автоматизации счетов_history';
          const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');
          const newItem = {
            id: crypto.randomUUID(),
            input: formData[Object.keys(formData)[0]] || 'Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.',
            created_at: new Date().toISOString(),
            status: 'completed',
            data: payload,
            result: data.analysis,
          };
          localStorage.setItem(historyKey, JSON.stringify([newItem, ...existing].slice(0, 50)));

          // Navigate to result
          const params = new URLSearchParams();
          Object.entries(formData).forEach(([k, v]) => params.set(k, v));
          params.set('_result', JSON.stringify(data.analysis));
          router.push(`/dashboard/analysis?${params.toString()}`);
        } catch {
          router.push('/dashboard/analysis?q=' + encodeURIComponent(JSON.stringify(payload)));
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: '#edf2f750' }} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif', color: '#edf2f7' }}>
            New Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Form (left 3 cols) ─── */}
        <div className="lg:col-span-3 space-y-5">
          {/* Header fields */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#edf2f7' }}>Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#edf2f750' }}>Срок оплаты счета</label>
                <input
                  type="text"
                  value={formData['due_date'] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, 'due_date': e.target.value }))}
                  placeholder="2023-12-31"
                  className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                  style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                />
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#edf2f7' }}>Items</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                style={{ color: '#5a67d8', background: '#5a67d810' }}
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 px-1">
              <div className="col-span-5 text-xs font-medium" style={{ color: '#edf2f750' }}>Description</div>
              <div className="col-span-2 text-xs font-medium" style={{ color: '#edf2f750' }}>Qty</div>
              <div className="col-span-2 text-xs font-medium" style={{ color: '#edf2f750' }}>Rate</div>
              <div className="col-span-2 text-xs font-medium text-right" style={{ color: '#edf2f750' }}>Amount</div>
              <div className="col-span-1" />
            </div>

            {/* Items */}
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.rate || ''}
                      onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                      style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-sm font-medium" style={{ color: '#edf2f7' }}>
                      {formatCurrency(item.quantity * item.rate)}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                      style={{ color: items.length > 1 ? '#ef4444' : '#edf2f750' }}
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#edf2f7' }}>Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or terms..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
            />
          </div>
        </div>

        {/* ─── Summary (right 2 cols) ─── */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-5">
            {/* Totals */}
            <div className="rounded-2xl p-5" style={{ background: '#ffffff12', boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)', border: '1px solid #5a67d810' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#edf2f7' }}>Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#edf2f750' }}>Subtotal</span>
                  <span style={{ color: '#edf2f7' }}>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span style={{ color: '#edf2f750' }}>Tax</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={taxRate || ''}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-16 px-2 py-1 rounded-md border text-xs text-right focus:outline-none"
                      style={{ background: '#1a202c', borderColor: '#5a67d820', color: '#edf2f7' }}
                    />
                    <span className="text-xs" style={{ color: '#edf2f750' }}>%</span>
                  </div>
                </div>
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#edf2f750' }}>Tax amount</span>
                    <span style={{ color: '#edf2f7' }}>{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div className="border-t pt-3 flex justify-between" style={{ borderColor: '#5a67d820' }}>
                  <span className="text-sm font-semibold" style={{ color: '#edf2f7' }}>Total</span>
                  <span className="text-lg font-bold" style={{ color: '#5a67d8' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleSubmit}
              disabled={submitting || items.every(i => !i.description)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="w-4 h-4" /> Generate Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.</>
              )}
            </button>

            <Link
              href="/dashboard"
              className="block w-full py-2.5 rounded-xl text-sm font-medium text-center border transition-all hover:bg-white/5"
              style={{ borderColor: '#5a67d820', color: '#edf2f750' }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
