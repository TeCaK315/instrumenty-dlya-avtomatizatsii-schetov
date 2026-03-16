'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { generatePDF } from '@/lib/pdf-generator';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  due_date: string;
  created_at: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
}

interface InvoiceListProps {
  refreshTrigger?: string;
}

export default function InvoiceList({ refreshTrigger }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const statusColors = {
    draft: 'bg-gray-500',
    sent: 'bg-blue-500',
    paid: 'bg-green-500',
    overdue: 'bg-red-500'
  };

  const statusLabels = {
    draft: 'Черновик',
    sent: 'Отправлен',
    paid: 'Оплачен',
    overdue: 'Просрочен'
  };

  const fetchInvoices = async () => {
    try {
      const supabase = createClient();
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedStatus, refreshTrigger]);

  const downloadInvoicePDF = (invoice: Invoice) => {
    const pdfSections = [
      {
        heading: 'Информация о клиенте',
        content: `${invoice.client_name}\n${invoice.client_email}`
      },
      {
        heading: 'Позиции счета',
        table: {
          headers: ['Описание', 'Кол-во', 'Цена', 'Сумма'],
          rows: invoice.items.map(item => [
            item.description,
            item.quantity.toString(),
            `₽${item.rate.toFixed(2)}`,
            `₽${item.amount.toFixed(2)}`
          ]),
          alignRight: [2, 3]
        }
      }
    ];

    generatePDF({
      title: `Счет ${invoice.invoice_number}`,
      subtitle: `Дата выставления: ${new Date(invoice.created_at).toLocaleDateString('ru-RU')}\nСрок оплаты: ${new Date(invoice.due_date).toLocaleDateString('ru-RU')}\nИтого: ₽${invoice.total_amount.toFixed(2)}`,
      sections: pdfSections,
      brandColor: '#5a67d8'
    }, `invoice-${invoice.invoice_number}.pdf`);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;
      fetchInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот счет?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) throw error;
      fetchInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Montserrat' }}>
          Мои счета
        </h2>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Все статусы</option>
          <option value="draft">Черновики</option>
          <option value="sent">Отправленные</option>
          <option value="paid">Оплаченные</option>
          <option value="overdue">Просроченные</option>
        </select>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">
            {selectedStatus === 'all' ? 'У вас пока нет счетов' : `Нет счетов со статусом "${statusLabels[selectedStatus as keyof typeof statusLabels]}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {invoice.invoice_number}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="font-medium">Клиент:</span> {invoice.client_name}
                    </div>
                    <div>
                      <span className="font-medium">Сумма:</span> ₽{invoice.total_amount.toFixed(2)}
                    </div>
                    <div>
                      <span className="font-medium">Срок оплаты:</span> {new Date(invoice.due_date).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => downloadInvoicePDF(invoice)}
                    className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                    title="Скачать PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <select
                    value={invoice.status}
                    onChange={(e) => updateInvoiceStatus(invoice.id, e.target.value as Invoice['status'])}
                    className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Черновик</option>
                    <option value="sent">Отправлен</option>
                    <option value="paid">Оплачен</option>
                    <option value="overdue">Просрочен</option>
                  </select>
                  <button
                    onClick={() => deleteInvoice(invoice.id)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}