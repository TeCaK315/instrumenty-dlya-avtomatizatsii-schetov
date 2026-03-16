'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';
import { Eye, Download, Edit, Trash2, Send } from 'lucide-react';
import { generatePDF } from '@/lib/pdf-generator';

interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  client_email: string;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  due_date: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  notes?: string;
  client_address?: string;
  client_phone?: string;
}

const statusColors = {
  draft: 'bg-gray-600 text-gray-200',
  sent: 'bg-blue-600 text-blue-100',
  paid: 'bg-green-600 text-green-100',
  overdue: 'bg-red-600 text-red-100'
};

const statusLabels = {
  draft: 'Черновик',
  sent: 'Отправлен',
  paid: 'Оплачен',
  overdue: 'Просрочен'
};

export default function InvoiceList() {
  const { user } = useUser();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (user) {
      loadInvoices();
    }
  }, [user]);

  const loadInvoices = async () => {
    if (!user) return;

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Ошибка загрузки счетов:', error);
    } finally {
      setLoading(false);
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
      
      setInvoices(prev => prev.filter(invoice => invoice.id !== id));
      alert('Счет успешно удален');
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Ошибка при удалении счета');
    }
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    const tableRows = invoice.items.map(item => [
      item.description,
      item.quantity.toString(),
      `₽${item.rate.toFixed(2)}`,
      `₽${item.amount.toFixed(2)}`
    ]);

    generatePDF({
      title: `Счет ${invoice.invoice_number}`,
      subtitle: `Дата: ${new Date(invoice.created_at).toLocaleDateString('ru-RU')} | Срок оплаты: ${new Date(invoice.due_date).toLocaleDateString('ru-RU')}`,
      sections: [
        {
          heading: 'Клиент',
          content: `${invoice.client_name}\n${invoice.client_email}${invoice.client_address ? '\n' + invoice.client_address : ''}${invoice.client_phone ? '\n' + invoice.client_phone : ''}`
        },
        {
          heading: 'Услуги/Товары',
          table: {
            headers: ['Описание', 'Кол-во', 'Цена', 'Сумма'],
            rows: tableRows,
            alignRight: [2, 3]
          }
        },
        {
          content: `Подытог: ₽${invoice.subtotal.toFixed(2)}\nНалог: ₽${invoice.tax.toFixed(2)}\nИтого: ₽${invoice.total.toFixed(2)}${invoice.notes ? '\n\nПримечания: ' + invoice.notes : ''}`
        }
      ],
      brandColor: '#5a67d8'
    }, `invoice-${invoice.invoice_number}.pdf`);
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      setInvoices(prev => prev.map(invoice => 
        invoice.id === id ? { ...invoice, status } : invoice
      ));
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Ошибка при обновлении статуса');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Мои счета</h2>
        <div className="text-sm text-gray-400">
          Всего счетов: {invoices.length}
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">У вас пока нет счетов</p>
            <p className="text-sm">Создайте свой первый счет, чтобы начать работу</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {invoice.invoice_number}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
                    <div>
                      <span className="text-gray-400">Клиент:</span>
                      <div className="font-medium">{invoice.client_name}</div>
                      <div className="text-gray-400">{invoice.client_email}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Сумма:</span>
                      <div className="font-medium text-lg text-white">₽{invoice.total.toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Срок оплаты:</span>
                      <div className="font-medium">
                        {new Date(invoice.due_date).toLocaleDateString('ru-RU')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Создан: {new Date(invoice.created_at).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="flex items-center px-3 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Просмотр
                  </button>
                  <button
                    onClick={() => downloadInvoicePDF(invoice)}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    PDF
                  </button>
                  {invoice.status === 'sent' && (
                    <button
                      onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                      className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Оплачен
                    </button>
                  )}
                  <button
                    onClick={() => deleteInvoice(invoice.id)}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно просмотра счета */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Счет {selectedInvoice.invoice_number}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Дата создания:</span>
                    <div className="text-white">{new Date(selectedInvoice.created_at).toLocaleDateString('ru-RU')}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Срок оплаты:</span>
                    <div className="text-white">{new Date(selectedInvoice.due_date).toLocaleDateString('ru-RU')}</div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Клиент</h4>
                  <div className="bg-gray-700 p-4 rounded-lg text-sm">
                    <div className="text-white font-medium">{selectedInvoice.client_name}</div>
                    <div className="text-gray-300">{selectedInvoice.client_email}</div>
                    {selectedInvoice.client_address && (
                      <div className="text-gray-300">{selectedInvoice.client_address}</div>
                    )}
                    {selectedInvoice.client_phone && (
                      <div className="text-gray-300">{selectedInvoice.client_phone}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Позиции</h4>
                  <div className="bg-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-600">
                        <tr>
                          <th className="text-left p-3 text-gray-200">Описание</th>
                          <th className="text-right p-3 text-gray-200">Кол-во</th>
                          <th className="text-right p-3 text-gray-200">Цена</th>
                          <th className="text-right p-3 text-gray-200">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="border-t border-gray-600">
                            <td className="p-3 text-white">{item.description}</td>
                            <td className="p-3 text-right text-gray-300">{item.quantity}</td>
                            <td className="p-3 text-right text-gray-300">₽{item.rate.toFixed(2)}</td>
                            <td className="p-3 text-right text-white">₽{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-300">
                      <span>Подытог:</span>
                      <span>₽{selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Налог:</span>
                      <span>₽{selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2">
                      <div className="flex justify-between text-white font-semibold text-lg">
                        <span>Итого:</span>
                        <span>₽{selectedInvoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">Примечания</h4>
                    <div className="bg-gray-700 p-4 rounded-lg text-gray-300 text-sm">
                      {selectedInvoice.notes}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => downloadInvoicePDF(selectedInvoice)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Скачать PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}