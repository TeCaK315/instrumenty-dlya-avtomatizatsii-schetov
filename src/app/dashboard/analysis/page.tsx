'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Loader2, Download, RefreshCw, Clock, AlertCircle,
  CheckCircle2, PlusCircle, FileText, Printer,
} from 'lucide-react';

/* ─── Types ─── */
interface AnalysisData {
  [key: string]: any;
}

/* ─── Page wrapper with Suspense ─── */
export default function AnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#5a67d8' }} />
      </div>
    }>
      <AnalysisContent />
    </Suspense>
  );
}

function AnalysisContent() {
  const [result, setResult] = useState<AnalysisData | null>(null);
  const [inputData, setInputData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  const loadingSteps = [
    'Preparing data...',
    'Processing your request...',
    'Generating Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов....',
    'Finalizing...',
  ];

  /* ─── Load result from URL or API ─── */
  useEffect(() => {
    const resultParam = searchParams.get('_result');
    const idParam = searchParams.get('id');

    if (resultParam) {
      // Result passed directly from create-page — no API call needed
      try {
        const parsed = JSON.parse(resultParam);
        setResult(parsed);
        // Collect input fields from other params
        const input: Record<string, any> = {};
        searchParams.forEach((value, key) => {
          if (key !== '_result' && key !== 'id') input[key] = value;
        });
        setInputData(input);
      } catch {
        setError('Failed to parse result data');
      }
    } else if (idParam) {
      loadFromHistory(idParam);
    } else {
      // No result param — call API with query params
      runAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingStep(0);

    const interval = setInterval(() => {
      setLoadingStep(prev => Math.min(prev + 1, loadingSteps.length - 1));
    }, 2500);

    try {
      const body: Record<string, any> = {};
      searchParams.forEach((value, key) => {
        if (key !== '_result' && key !== 'id') body[key] = value;
      });
      if (!body.input && Object.keys(body).length > 0) {
        body.input = Object.values(body).join(' ');
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await res.json();
      setResult(data.analysis || data);
      setInputData(body);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }, [searchParams]);

  const loadFromHistory = useCallback(async (id: string) => {
    setLoading(true);
    try {
      // Try localStorage first
      const historyKey = 'Инструменты для автоматизации счетов_history';
      const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const found = history.find((h: any) => h.id === id);
      if (found) {
        setResult(found.result || found.data);
        setInputData(found.data || {});
        setLoading(false);
        return;
      }

      // Fallback to Supabase
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from('analyses')
        .select('*')
        .eq('id', id)
        .single();
      if (dbErr || !data) throw new Error('Not found');
      setResult(data.result);
      setInputData(data.input || {});
    } catch (err: any) {
      setError(err.message || 'Could not load');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── PDF Export ─── */
  const handleExportPdf = useCallback(async () => {
    if (!result) return;
    try {
      const { generatePDF, downloadPDF } = await import('@/lib/pdf-generator');
      const sections: any[] = [];

      // From/To info
      const sender = result.sender || {};
      const recipient = result.recipient || {};
      if (sender.business_name || recipient.name) {
        const contactLines: string[] = [];
        if (sender.business_name) {
          contactLines.push('From: ' + sender.business_name + (sender.email ? ' (' + sender.email + ')' : '') + (sender.address ? ', ' + sender.address : ''));
        }
        if (recipient.name) {
          contactLines.push('To: ' + recipient.name + (recipient.email ? ' (' + recipient.email + ')' : '') + (recipient.address ? ', ' + recipient.address : ''));
        }
        if (result.doc_number) contactLines.push('Number: ' + result.doc_number);
        if (result.date) contactLines.push('Date: ' + result.date);
        if (result.due_date) contactLines.push('Due: ' + result.due_date);
        sections.push({ heading: 'Details', items: contactLines });
      }

      // Build sections from result
      if (result.executive_summary) {
        sections.push({ heading: 'Summary', content: result.executive_summary });
      }
      if (result.sections) {
        result.sections.forEach((s: any) => {
          sections.push({ heading: s.heading, content: s.content, items: s.key_points });
        });
      }
      // Line items table
      if (result.items && Array.isArray(result.items) && result.items.length > 0) {
        const first = result.items[0];
        if (first.description && first.rate !== undefined) {
          sections.push({
            heading: 'Items',
            table: {
              headers: ['Description', 'Qty', 'Rate', 'Amount'],
              rows: result.items.map((item: any) => [
                item.description || '',
                String(item.quantity || 1),
                '$' + (item.rate || 0).toFixed(2),
                '$' + ((item.quantity || 1) * (item.rate || 0)).toFixed(2),
              ]),
              alignRight: [2, 3],
            },
          });
        }
      }
      // Totals
      if (result.subtotal !== undefined || result.total !== undefined) {
        const lines: string[] = [];
        if (result.subtotal !== undefined) lines.push('Subtotal: $' + Number(result.subtotal).toFixed(2));
        if (result.tax_amount !== undefined && result.tax_amount > 0) lines.push('Tax: $' + Number(result.tax_amount).toFixed(2));
        if (result.total !== undefined) lines.push('Total: $' + Number(result.total).toFixed(2));
        sections.push({ heading: 'Totals', items: lines });
      }
      if (result.recommendations && result.recommendations.length > 0) {
        sections.push({
          heading: 'Recommendations',
          items: result.recommendations.map((r: any) =>
            typeof r === 'string' ? r : r.title + ': ' + (r.description || '')
          ),
        });
      }
      if (result.conclusion) {
        sections.push({ heading: 'Conclusion', content: result.conclusion });
      }
      if (result.notes) {
        sections.push({ heading: 'Notes', content: result.notes });
      }
      // If nothing matched, dump all string values
      if (sections.length === 0) {
        Object.entries(result).forEach(([key, val]) => {
          if (typeof val === 'string' && val.length > 0) {
            sections.push({ heading: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), content: val });
          }
        });
      }

      const title = result.title || 'Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.';
      const subtitle = result.doc_number ? result.doc_number + (recipient.name ? ' — ' + recipient.name : '') : undefined;
      const doc = generatePDF({ title, subtitle, sections });
      const filename = (result.doc_number || title).replace(/[^a-zA-Z0-9-]/g, '_') + '.pdf';
      downloadPDF(doc, filename);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  }, [result]);

  /* ─── Print ─── */
  const handlePrint = useCallback(() => window.print(), []);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{ background: '#5a67d8' }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: '#5a67d820' }}
            >
              <Loader2 className="w-9 h-9 animate-spin" style={{ color: '#5a67d8' }} />
            </div>
          </div>
          <p className="text-base font-medium mb-1" style={{ color: '#edf2f7' }}>
            {loadingSteps[loadingStep] || loadingSteps[0]}
          </p>
          <p className="text-sm" style={{ color: '#edf2f750' }}>
            This may take a moment
          </p>
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mt-4">
            {loadingSteps.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i <= loadingStep ? '#5a67d8' : '#5a67d820',
                  transform: i === loadingStep ? 'scale(1.3)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Error State ─── */
  if (error) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ background: '#ef444415' }}
          >
            <AlertCircle className="w-7 h-7" style={{ color: '#ef4444' }} />
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: '#edf2f7' }}>Something went wrong</h2>
          <p className="text-sm mb-6" style={{ color: '#edf2f770' }}>{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => runAnalysis()}
              className="px-5 py-2 rounded-xl text-sm font-medium text-white flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
            <Link
              href="/dashboard/create"
              className="px-5 py-2 rounded-xl text-sm font-medium border flex items-center gap-2"
              style={{ borderColor: '#5a67d820', color: '#edf2f7' }}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── No Result ─── */
  if (!result) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: '#edf2f750' }} />
          <p className="text-sm mb-4" style={{ color: '#edf2f770' }}>No data to display</p>
          <Link
            href="/dashboard/create"
            className="px-5 py-2 rounded-xl text-sm font-medium text-white inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
          >
            <PlusCircle className="w-4 h-4" /> Create Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Detect content type ─── */
  const hasLineItems = result.items && Array.isArray(result.items) && result.items.length > 0
    && result.items[0]?.description !== undefined && result.items[0]?.rate !== undefined;
  const hasReportSections = result.sections && Array.isArray(result.sections) && result.sections.length > 0;

  /* ─── Result Display ─── */
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-lg transition-colors hover:opacity-80"
            style={{ background: '#ffffff08' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: '#5a67d8' }} />
          </Link>
          <div>
            <h1
              className="text-xl font-bold"
              style={{ fontFamily: 'Montserrat, sans-serif', color: '#edf2f7' }}
            >
              {result.title || 'Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.'}
            </h1>
            {result.subtitle && (
              <p className="text-sm mt-0.5" style={{ color: '#edf2f750' }}>{result.subtitle}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="p-2 rounded-lg border transition-colors hover:opacity-80 hidden sm:flex"
            style={{ borderColor: '#5a67d820', color: '#edf2f770' }}
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:opacity-80"
            style={{ borderColor: '#5a67d820', color: '#edf2f7' }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <Link
            href="/dashboard/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New</span>
          </Link>
        </div>
      </div>

      {/* ─── Document Preview ─── */}
      <div
        className="rounded-xl border overflow-hidden print:border-0 print:rounded-none"
        style={{ borderColor: '#5a67d808' }}
      >
        {hasLineItems ? (
          <DocumentView data={result} inputData={inputData} />
        ) : hasReportSections ? (
          <ReportView data={result} />
        ) : (
          <GenericView data={result} />
        )}
      </div>

      {/* ─── Footer ─── */}
      <div className="flex items-center justify-between pt-2 print:hidden">
        <Link
          href="/dashboard"
          className="text-sm flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          style={{ color: '#edf2f750' }}
        >
          <Clock className="w-3.5 h-3.5" /> View History
        </Link>
        <p className="text-xs" style={{ color: '#edf2f750' }}>
          Generated by Инструменты для автоматизации счетов
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Document View — for invoices, quotes, line-item data
   ═══════════════════════════════════════════════════ */
function DocumentView({ data, inputData }: { data: any; inputData: Record<string, any> }) {
  const cur = data.currency || 'USD';
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: cur }).format(n);

  const items = data.items || [];
  const subtotal = data.subtotal ?? items.reduce((s: number, i: any) => s + (i.quantity || 1) * (i.rate || 0), 0);
  const taxRate = data.tax_rate ?? 0;
  const taxAmount = data.tax_amount ?? subtotal * (taxRate / 100);
  const total = data.total ?? subtotal + taxAmount;

  const sender = data.sender || {};
  const recipient = data.recipient || {};
  const docNumber = data.doc_number || '';
  const docDate = data.date || '';
  const dueDate = data.due_date || '';
  const paymentTerms = data.payment_terms || '';

  const formatDate = (d: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch { return d; }
  };

  const termsLabel = (t: string) => {
    const map: Record<string, string> = { due_on_receipt: 'Due on Receipt', net_15: 'Net 15', net_30: 'Net 30', net_60: 'Net 60' };
    return map[t] || t;
  };

  return (
    <div className="divide-y" style={{ borderColor: '#5a67d808' }}>
      {/* ─── Document Header with From / To ─── */}
      <div className="p-6 sm:p-8" style={{ background: '#ffffff08' }}>
        {/* Top row: title + doc number */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold" style={{ fontFamily: "'Montserrat', sans-serif", color: '#edf2f7' }}>
              {data.title || 'Автоматизированная система выставления счетов с интеграцией для фрилансеров и малых бизнесов.'}
            </h2>
            {data.executive_summary && (
              <p className="text-sm mt-1 max-w-lg" style={{ color: '#edf2f770' }}>
                {data.executive_summary}
              </p>
            )}
          </div>
          <div className="text-sm space-y-1 sm:text-right" style={{ color: '#edf2f770' }}>
            {docNumber && <p className="font-mono font-semibold" style={{ color: '#5a67d8' }}>{docNumber}</p>}
            {docDate && <p>{formatDate(docDate)}</p>}
            {dueDate && <p><span style={{ color: '#edf2f750' }}>Due: </span>{formatDate(dueDate)}</p>}
            {paymentTerms && <p className="text-xs" style={{ color: '#edf2f750' }}>{termsLabel(paymentTerms)}</p>}
          </div>
        </div>

        {/* From / To */}
        {(sender.business_name || recipient.name) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4" style={{ borderTop: '1px solid #5a67d810' }}>
            {sender.business_name && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#edf2f740' }}>From</p>
                <p className="text-sm font-semibold" style={{ color: '#edf2f7' }}>{sender.business_name}</p>
                {sender.email && <p className="text-xs mt-0.5" style={{ color: '#edf2f750' }}>{sender.email}</p>}
                {sender.address && <p className="text-xs mt-0.5" style={{ color: '#edf2f750' }}>{sender.address}</p>}
                {sender.phone && <p className="text-xs mt-0.5" style={{ color: '#edf2f750' }}>{sender.phone}</p>}
              </div>
            )}
            {recipient.name && (
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#edf2f740' }}>To</p>
                <p className="text-sm font-semibold" style={{ color: '#edf2f7' }}>{recipient.name}</p>
                {recipient.email && <p className="text-xs mt-0.5" style={{ color: '#edf2f750' }}>{recipient.email}</p>}
                {recipient.address && <p className="text-xs mt-0.5" style={{ color: '#edf2f750' }}>{recipient.address}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Line Items Table ─── */}
      <div className="p-6 sm:p-8">
        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '2px solid #5a67d820' }}>
                <th className="text-left py-3 font-semibold" style={{ color: '#edf2f7', width: '50%' }}>Description</th>
                <th className="text-center py-3 font-semibold" style={{ color: '#edf2f7' }}>Qty</th>
                <th className="text-right py-3 font-semibold" style={{ color: '#edf2f7' }}>Rate</th>
                <th className="text-right py-3 font-semibold" style={{ color: '#edf2f7' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid #5a67d810' }}
                >
                  <td className="py-3" style={{ color: '#edf2f7' }}>{item.description}</td>
                  <td className="py-3 text-center" style={{ color: '#edf2f770' }}>{item.quantity || 1}</td>
                  <td className="py-3 text-right" style={{ color: '#edf2f770' }}>{formatCurrency(item.rate || 0)}</td>
                  <td className="py-3 text-right font-medium" style={{ color: '#edf2f7' }}>
                    {formatCurrency((item.quantity || 1) * (item.rate || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {items.map((item: any, i: number) => (
            <div
              key={i}
              className="rounded-lg border p-3"
              style={{ borderColor: '#5a67d808' }}
            >
              <p className="font-medium text-sm mb-1" style={{ color: '#edf2f7' }}>{item.description}</p>
              <div className="flex justify-between text-xs" style={{ color: '#edf2f750' }}>
                <span>{item.quantity || 1} x {formatCurrency(item.rate || 0)}</span>
                <span className="font-medium" style={{ color: '#edf2f7' }}>
                  {formatCurrency((item.quantity || 1) * (item.rate || 0))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Totals ─── */}
        <div className="mt-6 flex justify-end">
          <div className="w-full sm:w-64 space-y-2">
            <div className="flex justify-between text-sm" style={{ color: '#edf2f770' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm" style={{ color: '#edf2f770' }}>
                <span>Tax ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div
              className="flex justify-between pt-2 border-t"
              style={{ borderColor: '#5a67d820' }}
            >
              <span className="text-sm font-semibold" style={{ color: '#edf2f7' }}>Total</span>
              <span className="text-lg font-bold" style={{ color: '#5a67d8' }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Notes ─── */}
      {data.notes && (
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#edf2f750' }}>
            Notes
          </h3>
          <p className="text-sm" style={{ color: '#edf2f770' }}>{data.notes}</p>
        </div>
      )}

      {/* ─── AI Recommendations (if available) ─── */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#edf2f750' }}>
            Recommendations
          </h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f6ad55' }} />
                <span style={{ color: '#edf2f770' }}>
                  {typeof rec === 'string' ? rec : rec.title + ': ' + (rec.description || '')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Report Sections (if AI returned structured analysis) ─── */}
      {data.sections && data.sections.length > 0 && (
        <div className="p-6 sm:p-8 space-y-5">
          {data.sections.map((section: any, i: number) => (
            <div key={i}>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#edf2f7' }}>
                <span
                  className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
                >
                  {i + 1}
                </span>
                {section.heading}
              </h3>
              {section.content && (
                <p className="text-sm leading-relaxed ml-8" style={{ color: '#edf2f770' }}>{section.content}</p>
              )}
              {section.key_points && section.key_points.length > 0 && (
                <ul className="mt-2 ml-8 space-y-1">
                  {section.key_points.map((point: string, j: number) => (
                    <li key={j} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#5a67d8' }} />
                      <span style={{ color: '#edf2f770' }}>{point}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Report View — for structured report with sections
   ═══════════════════════════════════════════════════ */
function ReportView({ data }: { data: any }) {
  const sections = data.sections || [];
  const executiveSummary = data.executive_summary || '';
  const conclusion = data.conclusion || '';
  const recommendations = data.recommendations || [];

  return (
    <div className="divide-y" style={{ borderColor: '#5a67d808' }}>
      {/* Executive Summary */}
      {executiveSummary && (
        <div className="p-6 sm:p-8" style={{ background: '#ffffff08' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#edf2f750' }}>
            Summary
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#edf2f7' }}>{executiveSummary}</p>
        </div>
      )}

      {/* Sections */}
      <div className="p-6 sm:p-8 space-y-6">
        {sections.map((section: any, i: number) => (
          <div key={i}>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#edf2f7' }}>
              <span
                className="w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #5a67d8, #4a5568)' }}
              >
                {i + 1}
              </span>
              {section.heading}
            </h3>
            {section.content && (
              <p className="text-sm leading-relaxed ml-8 mb-2" style={{ color: '#edf2f770' }}>{section.content}</p>
            )}
            {section.key_points && section.key_points.length > 0 && (
              <ul className="ml-8 space-y-1">
                {section.key_points.map((point: string, j: number) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: '#f6ad55' }} />
                    <span style={{ color: '#edf2f770' }}>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="p-6 sm:p-8">
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#edf2f750' }}>
            Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec: any, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#f6ad55' }} />
                <span style={{ color: '#edf2f770' }}>
                  {typeof rec === 'string' ? rec : rec.title + ': ' + (rec.description || '')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conclusion */}
      {conclusion && (
        <div className="p-6 sm:p-8" style={{ background: '#ffffff08' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#edf2f750' }}>
            Conclusion
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#edf2f7' }}>{conclusion}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Generic View — fallback for any data structure
   ═══════════════════════════════════════════════════ */
function GenericView({ data }: { data: any }) {
  // Extract displayable fields
  const entries = Object.entries(data).filter(
    ([key, val]) => val !== null && val !== undefined && key !== 'title' && key !== 'subtitle'
  );

  return (
    <div className="divide-y" style={{ borderColor: '#5a67d808' }}>
      {entries.map(([key, value], i) => (
        <div key={i} className="p-6 sm:p-8">
          <h3
            className="text-xs font-semibold uppercase tracking-wider mb-2"
            style={{ color: '#edf2f750' }}
          >
            {key.replace(/_/g, ' ')}
          </h3>
          {typeof value === 'string' ? (
            <p className="text-sm leading-relaxed" style={{ color: '#edf2f7' }}>{value}</p>
          ) : Array.isArray(value) ? (
            <ul className="space-y-1.5">
              {value.map((item: any, j: number) => (
                <li key={j} className="flex items-start gap-2 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#5a67d8' }} />
                  <span style={{ color: '#edf2f770' }}>
                    {typeof item === 'string' ? item : JSON.stringify(item)}
                  </span>
                </li>
              ))}
            </ul>
          ) : typeof value === 'number' ? (
            <p className="text-2xl font-bold" style={{ color: '#5a67d8' }}>{value}</p>
          ) : (
            <pre className="text-xs whitespace-pre-wrap rounded-lg p-3" style={{ color: '#edf2f770', background: '#5a67d810' }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}
