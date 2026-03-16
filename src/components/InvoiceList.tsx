'use client';

import { useState, useEffect } from 'react';
import { Eye, Download, Edit, Trash2, Send } from 'lucide-react';
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

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showModal, setShowModal] = useState(false);

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
      console.error('Error loading invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-600';
      case 'sent': return 'bg-blue-600';
      case 'paid': return 'bg-green-600';
      case 'overdue': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'sent': return 'Отправлен';
      case 'paid': return 'Оплачен';
      case 'overdue': return 'Просрочен';
      default: return status;
    }
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    const pdfSections = [
      {
        heading: 'Информация о клиенте',
        content: `${invoice.client_data.name}\n${invoice.client_data.email}\n${invoice.client_data.address}${invoice.client_data.phone ? '\n' + invoice.client_data.phone : ''}`
      },
      {
        heading: 'Услуги/Товары',
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
      },
      {
        content: `Подытог: ₽${invoice.subtotal.toFixed(2)}\nНалог: ₽${invoice.tax.toFixed(2)}\nИтого: ₽${invoice.total.toFixed(2)}`
      }
    ];

    if (invoice.notes) {
      pdfSections.push({
        heading: 'Примечания',
        content: invoice.notes
      });
    }

    generatePDF({
      title: `Счет ${invoice.invoice_number}`,
      subtitle: `Дата создания: ${new Date(invoice.created_at).toLocaleDateString('ru-RU')} | Срок оплаты: ${new Date(invoice.due_date).toLocaleDateString('ru-RU')}`,
      sections: pdfSections,
      brandColor: '#5a67d8'
    }, `${invoice.invoice_number}.pdf`);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('invoices')
        .update({ status: newStatus })
        .eq('id', invoiceId);

      if (error) throw error;
      
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv
      ));
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
      
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Список счетов</h2>
        <div className="text-sm text-gray-400">
          Всего счетов: {invoices.length}
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Счета не найдены</p>
          <p className="text-gray-500 mt-2">Создайте свой первый счет, чтобы начать работу</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {invoice.invoice_number}
                  </h3>
                  <p className="text-gray-400">{invoice.client_data.name}</p>
                  <p className="text-sm text-gray-500">{invoice.client_data.email}</p>
                </div>
                <div className="text-right">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(invoice.status)}`}>
                    {getStatusText(invoice.status)}
                  </div>
                  <p className="text-lg font-bold text-white mt-2">₽{invoice.total.toFixed(2)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-400">Создан:</span>
                  <p className="text-white">{new Date(invoice.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Срок оплаты:</span>
                  <p className="text-white">{new Date(invoice.due_date).toLocaleDateString('ru-RU')}</p>
                </div>
                <div>
                  <span className="text-gray-400">Позиций:</span>
                  <p className="text-white">{invoice.items.length}</p>
                </div>
                <div>
                  <span className="text-gray-400">Подытог:</span>
                  <p className="text-white">₽{invoice.subtotal.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setShowModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <Eye size={14} />
                  Просмотр
                </button>
                
                <button
                  onClick={() => downloadInvoicePDF(invoice)}
                  className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                >
                  <Download size={14} />
                  PDF
                </button>

                {invoice.status === 'draft' && (
                  <button
                    onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                    className="flex items-center gap-1 px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors"
                  >
                    <Send size={14} />
                    Отправить
                  </button>
                )}

                {invoice.status === 'sent' && (
                  <button
                    onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                    className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Оплачен
                  </button>
                )}

                <button
                  onClick={() => deleteInvoice(invoice.id)}
                  className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={14} />
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно просмотра */}
      {showModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                  Счет {selectedInvoice.invoice_number}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2">Информация о клиенте</h4>
                    <p className="text-gray-300">{selectedInvoice.client_data.name}</p>
                    <p className="text-gray-400">{selectedInvoice.client_data.email}</p>
                    <p className="text-gray-400">{selectedInvoice.client_data.address}</p>
                    {selectedInvoice.client_data.phone && (
                      <p className="text-gray-400">{selectedInvoice.client_data.phone}</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-2">Детали счета</h4>
                    <p className="text-gray-300">Создан: {new Date(selectedInvoice.created_at).toLocaleDateString('ru-RU')}</p>
                    <p className="text-gray-300">Срок оплаты: {new Date(selectedInvoice.due_date).toLocaleDateString('ru-RU')}</p>
                    <p className="text-gray-300">Статус: {getStatusText(selectedInvoice.status)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-2">Позиции</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-2 text-gray-300">Описание</th>
                          <th className="text-right py-2 text-gray-300">Кол-во</th>
                          <th className="text-right py-2 text-gray-300">Цена</th>
                          <th className="text-right py-2 text-gray-300">Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.items.map((item, index) => (
                          <tr key={index} className="border-b border-gray-700">
                            <td className="py-2 text-white">{item.description}</td>
                            <td className="py-2 text-right text-gray-300">{item.quantity}</td>
                            <td className="py-2 text-right text-gray-300">₽{item.rate.toFixed(2)}</td>
                            <td className="py-2 text-right text-white">₽{item.amount.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between text-gray-300">
                      <span>Подытог:</span>
                      <span>₽{selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Налог:</span>
                      <span>₽{selectedInvoice.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-bold text-lg border-t border-gray-600 pt-1">
                      <span>Итого:</span>
                      <span>₽{selectedInvoice.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {selectedInvoice.notes && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Примечания</h4>
                    <p className="text-gray-300">{selectedInvoice.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => downloadInvoicePDF(selectedInvoice)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  Скачать PDF
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
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