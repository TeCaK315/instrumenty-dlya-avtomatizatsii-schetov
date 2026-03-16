'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Loader2, FileText, Download, Save, Building2, User } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface SenderProfile {
  business_name: string;
  email: string;
  address: string;
  phone: string;
}

const PAYMENT_TERMS = [
  { value: 'due_on_receipt', label: 'Due on Receipt' },
  { value: 'net_15', label: 'Net 15' },
  { value: 'net_30', label: 'Net 30' },
  { value: 'net_60', label: 'Net 60' },
];

const PROFILE_KEY = 'Инструменты для автоматизации счетов_sender_profile';
const HISTORY_KEY = 'Инструменты для автоматизации счетов_history';
const COUNTER_KEY = 'Инструменты для автоматизации счетов_doc_counter';

function getNextDocNumber(): string {
  try {
    const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0') + 1;
    localStorage.setItem(COUNTER_KEY, String(counter));
    return 'INV-' + String(counter).padStart(4, '0');
  } catch { return 'INV-0001'; }
}

export default function CreatePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // ─── Sender (From) ───
  const [sender, setSender] = useState<SenderProfile>({
    business_name: '', email: '', address: '', phone: '',
  });
  const [senderSaved, setSenderSaved] = useState(false);

  // ─── Recipient (To) ───
  const [recipient, setRecipient] = useState({
    name: '', email: '', address: '',
  });

  // ─── Document meta ───
  const [docNumber, setDocNumber] = useState('');
  const [docDate, setDocDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('net_30');

  // ─── Line items ───
  const [items, setItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, rate: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('USD');

  // ─── Load saved profile + generate doc number ───
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROFILE_KEY);
      if (saved) {
        const profile = JSON.parse(saved);
        setSender(profile);
        setSenderSaved(true);
      }
    } catch {}
    setDocNumber(getNextDocNumber());

    // Set default due date (30 days from now)
    const due = new Date();
    due.setDate(due.getDate() + 30);
    setDueDate(due.toISOString().split('T')[0]);
  }, []);

  // Update due date when payment terms change
  useEffect(() => {
    const days = paymentTerms === 'due_on_receipt' ? 0
      : paymentTerms === 'net_15' ? 15
      : paymentTerms === 'net_60' ? 60 : 30;
    const due = new Date(docDate);
    due.setDate(due.getDate() + days);
    setDueDate(due.toISOString().split('T')[0]);
  }, [paymentTerms, docDate]);

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
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  };

  const saveSenderProfile = () => {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(sender));
      setSenderSaved(true);
    } catch {}
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const payload = {
      ...formData,
      doc_number: docNumber,
      date: docDate,
      due_date: dueDate,
      payment_terms: paymentTerms,
      currency,
      sender,
      recipient,
      items: items.filter(i => i.description),
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
      notes,
    };

    try {
      // Save to history
      const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const historyItem = {
        id: crypto.randomUUID(),
        doc_number: docNumber,
        input: recipient.name || 'Unnamed',
        created_at: new Date().toISOString(),
        status: 'completed',
        data: payload,
        result: payload, // For invoice, result IS the data
      };
      localStorage.setItem(HISTORY_KEY, JSON.stringify([historyItem, ...existing].slice(0, 50)));

      // Navigate to result/preview page
      const params = new URLSearchParams();
      params.set('_result', JSON.stringify(payload));
      params.set('doc_number', docNumber);
      router.push(`/dashboard/analysis?${params.toString()}`);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputClasses = "w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all";
  const inputStyle = { background: '#1a202c', borderColor: '#5a67d815', color: '#edf2f7' };
  const labelClasses = "block text-xs font-medium mb-1.5";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl transition-all hover:bg-white/[0.06]">
          <ArrowLeft className="w-5 h-5" style={{ color: '#edf2f750' }} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: '#edf2f7' }}>
            New Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.
          </h1>
          <p className="text-xs mt-0.5" style={{ color: '#edf2f740' }}>
            {docNumber && <span className="font-mono">{docNumber}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Form (left 3 cols) ─── */}
        <div className="lg:col-span-3 space-y-5">

          {/* ─── FROM / TO ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* From (Sender) */}
            <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: '#5a67d8' }} />
                  <h2 className="text-sm font-semibold" style={{ color: '#edf2f7' }}>From</h2>
                </div>
                <button
                  onClick={saveSenderProfile}
                  className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg transition-all"
                  style={{ color: senderSaved ? '#f6ad55' : '#5a67d8', background: senderSaved ? '#f6ad5515' : '#5a67d810' }}
                  title="Save as default"
                >
                  <Save className="w-3 h-3" />
                  {senderSaved ? 'Saved' : 'Save'}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClasses} style={{ color: '#edf2f750' }}>Business Name</label>
                  <input
                    type="text"
                    value={sender.business_name}
                    onChange={(e) => setSender(prev => ({ ...prev, business_name: e.target.value }))}
                    placeholder="Your Company LLC"
                    className={inputClasses}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClasses} style={{ color: '#edf2f750' }}>Email</label>
                  <input
                    type="email"
                    value={sender.email}
                    onChange={(e) => setSender(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="billing@company.com"
                    className={inputClasses}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClasses} style={{ color: '#edf2f750' }}>Address</label>
                  <input
                    type="text"
                    value={sender.address}
                    onChange={(e) => setSender(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State"
                    className={inputClasses}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* To (Recipient) */}
            <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4" style={{ color: '#f6ad55' }} />
                <h2 className="text-sm font-semibold" style={{ color: '#edf2f7' }}>To</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClasses} style={{ color: '#edf2f750' }}>Client Name</label>
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => setRecipient(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Acme Corp"
                    className={inputClasses}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClasses} style={{ color: '#edf2f750' }}>Client Email</label>
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) => setRecipient(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="client@acme.com"
                    className={inputClasses}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelClasses} style={{ color: '#edf2f750' }}>Client Address</label>
                  <input
                    type="text"
                    value={recipient.address}
                    onChange={(e) => setRecipient(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="456 Oak Ave, City, State"
                    className={inputClasses}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ─── Document Details ─── */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#edf2f7' }}>Details</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClasses} style={{ color: '#edf2f750' }}>Number</label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  className={inputClasses + ' font-mono'}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClasses} style={{ color: '#edf2f750' }}>Date</label>
                <input
                  type="date"
                  value={docDate}
                  onChange={(e) => setDocDate(e.target.value)}
                  className={inputClasses}
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelClasses} style={{ color: '#edf2f750' }}>Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className={inputClasses}
                  style={inputStyle}
                >
                  {PAYMENT_TERMS.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClasses} style={{ color: '#edf2f750' }}>Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClasses}
                  style={inputStyle}
                />
              </div>
            </div>

          </div>

          {/* ─── Line items ─── */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold" style={{ color: '#edf2f7' }}>Items</h2>
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all hover:scale-[1.03]"
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
                <div key={item.id} className="grid grid-cols-12 gap-3 items-center group">
                  <div className="col-span-12 sm:col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className={inputClasses}
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className={inputClasses}
                      style={inputStyle}
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
                      className={inputClasses}
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-span-3 sm:col-span-2 text-right">
                    <span className="text-sm font-semibold" style={{ color: '#edf2f7' }}>
                      {formatCurrency(item.quantity * item.rate)}
                    </span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 rounded-lg transition-all opacity-40 group-hover:opacity-100 hover:bg-red-500/10"
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

          {/* ─── Notes ─── */}
          <div className="rounded-2xl p-5" style={{ background: '#ffffff08', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)', border: '1px solid #5a67d808' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#edf2f7' }}>Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment instructions, thank you message, or additional terms..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none transition-all"
              style={{ background: '#1a202c', borderColor: '#5a67d815', color: '#edf2f7' }}
            />
          </div>
        </div>

        {/* ─── Summary (right 2 cols) ─── */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-5">
            {/* Totals */}
            <div className="rounded-2xl p-5" style={{ background: '#ffffff12', boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.2)', border: '1px solid #5a67d810' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#edf2f7' }}>Summary</h2>

              {/* Mini preview */}
              {(sender.business_name || recipient.name) && (
                <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #5a67d810' }}>
                  {sender.business_name && (
                    <p className="text-xs font-medium" style={{ color: '#edf2f770' }}>{sender.business_name}</p>
                  )}
                  {recipient.name && (
                    <p className="text-xs mt-1" style={{ color: '#edf2f750' }}>To: {recipient.name}</p>
                  )}
                  {docNumber && (
                    <p className="text-[11px] font-mono mt-1" style={{ color: '#edf2f740' }}>{docNumber}</p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#edf2f750' }}>Items</span>
                  <span className="font-mono text-xs" style={{ color: '#edf2f750' }}>{items.filter(i => i.description).length}</span>
                </div>
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
                      className="w-16 px-2 py-1 rounded-lg border text-xs text-right focus:outline-none transition-all"
                      style={{ background: '#1a202c', borderColor: '#5a67d815', color: '#edf2f7' }}
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
                <div className="border-t pt-3 flex justify-between" style={{ borderColor: '#5a67d815' }}>
                  <span className="text-sm font-semibold" style={{ color: '#edf2f7' }}>Total</span>
                  <span className="text-xl font-bold" style={{ color: '#5a67d8' }}>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={handleSubmit}
              disabled={submitting || items.every(i => !i.description)}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:opacity-90 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)', boxShadow: '0 0 24px #5a67d820' }}
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="w-4 h-4" /> Generate Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.</>
              )}
            </button>

            <Link
              href="/dashboard"
              className="block w-full py-2.5 rounded-xl text-sm font-medium text-center border transition-all duration-200 hover:bg-white/[0.04]"
              style={{ borderColor: '#5a67d815', color: '#edf2f750' }}
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
