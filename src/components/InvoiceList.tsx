'use client';

import { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Send, Download, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generatePDF } from '@/lib/pdf-generator';

interface Invoice {
  id: string;
  invoice_number: string;
  client_data: {
    name: string;
    email: string;
    address: string;
    phone?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  notes?: string;
}

interface InvoiceListProps {
  onCreateNew?: () => void;
  onEditInvoice?: (invoice: Invoice) => void;
}

export default function InvoiceList({ onCreateNew, onEditInvoice }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Ошибка загрузки счетов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteInvoice = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот счет?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInvoices(prev => prev.filter(inv => inv.id !== id));
    } catch (error) {
      console.error('Ошибка удаления счета:', error);
      alert('Ошибка при удалении счета');
    }
  };

  const sendInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch('/api/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          clientEmail: invoice.client_data.email,
          invoiceData: invoice
        })
      });

      if (!response.ok) throw new Error('Ошибка отправки');

      // Обновляем статус счета
      const supabase = createClient();
      await supabase
        .from('invoices')
        .update({ status: 'sent' })
        .eq('id', invoice.id);

      setInvoices(prev => prev.map(inv => 
        inv.id === invoice.id ? { ...inv, status: 'sent' as const } : inv
      ));

      alert('Счет успешно отправлен!');
    } catch (error) {
      console.error('Ошибка отправки счета:', error);
      alert('Ошибка при отправке счета');
    }
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    const tableRows = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      `₽${item.rate.toFixed(2)}`,
      `₽${item.amount.toFixed(2)}`
    ]);

    tableRows.push(
      ['', '', 'Подытог:', `₽${invoice.subtotal.toFixed(2)}`],
      ['', '', 'Налог (10%):', `₽${invoice.tax.toFixed(2)}`],
      ['', '', 'Итого:', `₽${invoice.total.toFixed(2)}`]
    );

    const sections = [
      {
        heading: 'Информация о клиенте',
        content: `${invoice.client_data.name}\n${invoice.client_data.email}\n${invoice.client_data.address}${invoice.client_data.phone ? '\n' + invoice.client_data.phone : ''}`
      },
      {
        heading: 'Детали счета',
        table: {
          headers: ['Описание', 'Кол-во', 'Цена', 'Сумма'],
          rows: tableRows,
          alignRight: [2, 3]
        }
      }
    ];

    if (invoice.notes) {
      sections.push({
        heading: 'Примечания',
        content: invoice.notes
      });
    }

    generatePDF({
      title: `Счет ${invoice.invoice_number}`,
      subtitle: `Дата: ${new Date(invoice.created_at).toLocaleDateString('ru-RU')} | Срок оплаты: ${new Date(invoice.due_date).toLocaleDateString('ru-RU')}`,
      sections,
      brandColor: '#5a67d8'
    }, `invoice-${invoice.invoice_number}.pdf`);
  };

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-600 text-gray-200';
      case 'sent': return 'bg-blue-600 text-blue-100';
      case 'paid': return 'bg-green-600 text-green-100';
      case 'overdue': return 'bg-red-600 text-red-100';
      default: return 'bg-gray-600 text-gray-200';
    }
  };

  const getStatusText = (status: Invoice['status']) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'paid': return 'Оплачен';
      case 'overdue': return 'Просрочен';
      default: return status;
    }
  };

  const filteredInvoices = filter === 'all' 
    ? invoices 
    : invoices.filter(inv => inv.status === filter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'Montserrat' }}>
          Мои счета
        </h2>
        
        <div className="flex flex-wrap gap-2">
          {(['all', 'draft', 'sent', 'paid', 'overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status === 'all' ? 'Все' : getStatusText(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Кнопка создания нового счета */}
      {onCreateNew && (
        <button
          onClick={onCreateNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Создать новый счет
        </button>
      )}

      {/* Список счетов */}
      {filteredInvoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            {filter === 'all' ? 'У вас пока нет счетов' : `Нет счетов со статусом "${getStatusText(filter)}"`}
          </div>
          {onCreateNew && filter === 'all' && (
            <button
              onClick={onCreateNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Создать первый счет
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredInvoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {invoice.invoice_number}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 space-y-1">
                    <p><strong>Клиент:</strong> {invoice.client_data.name}</p>
                    <p><strong>Email:</strong> {invoice.client_data.email}</p>
                    <p><strong>Сумма:</strong> ₽{invoice.total.toFixed(2)}</p>
                    <p><strong>Срок оплаты:</strong> {new Date(invoice.due_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadInvoicePDF(invoice)}
                    className="p-2 text-orange-400 hover:text-orange-300 hover:bg-gray-700 rounded-md transition-colors"
                    title="Скачать PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {invoice.status === 'draft' && (
                    <button
                      onClick={() => sendInvoice(invoice)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-gray-700 rounded-md transition-colors"
                      title="Отправить клиенту"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}

                  {onEditInvoice && (
                    <button
                      onClick={() => onEditInvoice(invoice)}
                      className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-md transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => deleteInvoice(invoice.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-700 rounded-md transition-colors"
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