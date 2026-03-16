'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Eye, Download, Send, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Spinner } from '@/components/LoadingStates';
import { generatePDF } from '@/lib/pdf-generator';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
}

interface InvoiceListProps {
  refreshTrigger?: string;
}

export default function InvoiceList({ refreshTrigger }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchInvoices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'sent':
        return <Send className="w-4 h-4 text-blue-400" />;
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'overdue':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Черновик';
      case 'sent':
        return 'Отправлен';
      case 'paid':
        return 'Оплачен';
      case 'overdue':
        return 'Просрочен';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-700 text-gray-300';
      case 'sent':
        return 'bg-blue-900 text-blue-300';
      case 'paid':
        return 'bg-green-900 text-green-300';
      case 'overdue':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const handleDownloadPDF = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      const supabase = createClient();
      
      // Fetch full invoice data with items
      const { data: fullInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoice.id)
        .single();

      if (invoiceError) throw invoiceError;

      const { data: items, error: itemsError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', invoice.id);

      if (itemsError) throw itemsError;

      // Generate PDF
      const pdfData = {
        title: `Счет ${fullInvoice.invoice_number}`,
        content: [
          { label: 'Номер счета', value: fullInvoice.invoice_number },
          { label: 'Клиент', value: fullInvoice.client_name },
          { label: 'Email', value: fullInvoice.client_email },
          { label: 'Срок оплаты', value: new Date(fullInvoice.due_date).toLocaleDateString('ru-RU') },
          { label: 'Статус', value: getStatusText(fullInvoice.status) },
          { label: 'Итого', value: `${fullInvoice.total.toFixed(2)} ₽` }
        ],
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity.toString(),
          rate: `${item.rate.toFixed(2)} ₽`,
          amount: `${item.amount.toFixed(2)} ₽`
        }))
      };

      const pdfBlob = await generatePDF(pdfData);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fullInvoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      const supabase = createClient();
      
      // Update status to sent
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);

      if (error) throw error;

      // Refresh the list
      await fetchInvoices();
    } catch (error) {
      console.error('Error sending invoice:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-semibold text-gray-100">Список счетов</h2>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Счета не найдены</p>
          <p className="text-sm text-gray-500 mt-2">Создайте первый счет для начала работы</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Номер</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Клиент</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Сумма</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Статус</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Срок оплаты</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4">
                    <span className="text-gray-100 font-medium">{invoice.invoice_number}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="text-gray-100">{invoice.client_name}</div>
                      <div className="text-sm text-gray-400">{invoice.client_email}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-100 font-medium">
                      {invoice.total.toFixed(2)} ₽
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusIcon(invoice.status)}
                      {getStatusText(invoice.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-300">
                      {new Date(invoice.due_date).toLocaleDateString('ru-RU')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={actionLoading === invoice.id}
                        className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-50"
                        title="Скачать PDF"
                      >
                        {actionLoading === invoice.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => handleSendInvoice(invoice)}
                          disabled={actionLoading === invoice.id}
                          className="p-2 text-blue-400 hover:text-blue-300 disabled:opacity-50"
                          title="Отправить счет"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}