'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generatePDF, downloadPDF } from '@/lib/pdf-generator';

interface ExportButtonsProps {
  title: string;
  data: any;
  filename?: string;
  [key: string]: any;
}

export default function ExportButtons({ title, data, filename }: ExportButtonsProps) {
  const [exporting, setExporting] = useState(false);

  function buildSections() {
    const sections: any[] = [];

    if (data.executive_summary) {
      sections.push({ heading: 'Summary', content: data.executive_summary });
    }

    if (data.sections) {
      data.sections.forEach((s: any) => {
        sections.push({
          heading: s.heading,
          content: s.content,
          items: s.key_points,
        });
      });
    }

    // Support invoice-style data with line items
    if (data.items && Array.isArray(data.items) && data.items.length > 0) {
      const first = data.items[0];
      if (first.description && first.rate !== undefined) {
        // Invoice line items
        sections.push({
          heading: 'Items',
          table: {
            headers: ['Description', 'Qty', 'Rate', 'Amount'],
            rows: data.items.map((item: any) => [
              item.description || '',
              String(item.quantity || 1),
              '$' + (item.rate || 0).toFixed(2),
              '$' + ((item.quantity || 1) * (item.rate || 0)).toFixed(2),
            ]),
            alignRight: [2, 3],
          },
        });
      } else {
        // Generic list items
        sections.push({
          heading: 'Results',
          items: data.items.map((item: any) =>
            typeof item === 'string' ? item : `${item.name || item.title}: ${item.description || ''}`
          ),
        });
      }
    }

    // Totals
    if (data.subtotal !== undefined || data.total !== undefined) {
      const totalLines: string[] = [];
      if (data.subtotal !== undefined) totalLines.push('Subtotal: $' + Number(data.subtotal).toFixed(2));
      if (data.tax_amount !== undefined && data.tax_amount > 0) totalLines.push('Tax: $' + Number(data.tax_amount).toFixed(2));
      if (data.total !== undefined) totalLines.push('Total: $' + Number(data.total).toFixed(2));
      sections.push({ heading: 'Totals', items: totalLines });
    }

    if (data.recommendations && data.recommendations.length > 0) {
      sections.push({
        heading: 'Recommendations',
        items: data.recommendations.map((r: any) =>
          typeof r === 'string' ? r : r.title + ': ' + (r.description || '')
        ),
      });
    }

    if (data.conclusion) {
      sections.push({ heading: 'Conclusion', content: data.conclusion });
    }

    if (data.notes) {
      sections.push({ heading: 'Notes', content: data.notes });
    }

    return sections;
  }

  async function handleDownload() {
    setExporting(true);
    try {
      const sections = buildSections();
      const doc = generatePDF({ title, sections });
      const fname = filename || title.replace(/[^a-zA-Z0-9]/g, '_');
      downloadPDF(doc, fname + '.pdf');
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all hover:opacity-80 disabled:opacity-50"
      style={{ borderColor: '#5a67d820', color: '#edf2f7' }}
    >
      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      Download PDF
    </button>
  );
}
