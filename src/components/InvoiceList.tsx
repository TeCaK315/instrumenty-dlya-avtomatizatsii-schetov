'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Eye, Download, Mail, Calendar, DollarSign } from 'lucide-react';
import { generatePDF } from '@/lib/pdf-generator';

interface Invoice {
  id: string;
  title: string;
  content: string;
  created_at: string;
  metadata: {
    client_name: string;
    client_email: string;
    total_amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
  };
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: {
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
  notes?: string;
}

export default function InvoiceList() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('type', 'invoice')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Ошибка загрузки счетов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Оплачен';
      case 'sent':
        return 'Отправлен';
      case 'overdue':
        return 'Просрочен';
      case 'draft':
        return 'Черновик';
      default:
        return status;
    }
  };

  const downloadInvoicePDF = (invoice: Invoice) => {
    try {
      const invoiceData: InvoiceData = JSON.parse(invoice.content);
      
      const sections = [
        {
          heading: 'Детали клиента',
          content: `${invoiceData.client.name}\n${invoiceData.client.email}\n${invoiceData.client.address}${invoiceData.client.phone ? '\n' + invoiceData.client.phone : ''}`
        },
        {
          heading: 'Товары и услуги',
          table: {
            headers: ['Описание', 'Кол-во', 'Цена', 'Сумма'],
            rows: invoiceData.items.map(item => [
              item.description,
              item.quantity.toString(),
              `₽${item.rate.toFixed(2)}`,
              `₽${item.amount.toFixed(2)}`
            ]),
            alignRight: [2, 3]
          }
        },
        {
          content: `Подытог: ₽${invoiceData.subtotal.toFixed(2)}\nНалог: ₽${invoiceData.tax.toFixed(2)}\nИтого: ₽${invoiceData.total.toFixed(2)}`
        }
      ];

      if (invoiceData.notes) {
        sections.push({
          heading: 'Примечания',
          content: invoiceData.notes
        });
      }

      generatePDF({
        title: `Счет ${invoiceData.invoiceNumber}`,
        subtitle: `Дата: ${new Date(invoiceData.date).toLocaleDateString('ru-RU')} | Срок оплаты: ${new Date(invoiceData.dueDate).toLocaleDateString('ru-RU')}`,
        sections,
        brandColor: '#5a67d8'
      }, `invoice-${invoiceData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      alert('Ошибка при создании PDF файла');
    }
  };

  const resendInvoice = async (invoice: Invoice) => {
    try {
      const invoiceData: InvoiceData = JSON.parse(invoice.content);
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: invoiceData.client.email,
          subject: `Напоминание: Счет ${invoiceData.invoiceNumber}`,
          html: `
            <h2>Счет ${invoiceData.invoiceNumber}</h2>
            <p>Уважаемый ${invoiceData.client.name},</p>
            <p>Напоминаем о счете на сумму ₽${invoiceData.total.toFixed(2)}.</p>
            <p>Срок оплаты: ${new Date(invoiceData.dueDate).toLocaleDateString('ru-RU')}</p>
            <p>С уважением,<br>Ваша команда</p>
          `
        })
      });

      if (!response.ok) {
        throw new Error('Ошибка отправки email');
      }

      alert('Счет успешно отправлен повторно!');
    } catch (error) {
      console.error('Ошибка отправки счета:', error);
      alert('Произошла ошибка при отправке счета');
    }
  };

  const viewInvoiceDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDetails(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-100">История счетов</h2>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-300 mb-2">Нет созданных счетов</h3>
          <p className="text-gray-500">Создайте свой первый счет, чтобы начать работу</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {invoices.map((invoice) => {
            const invoiceData: InvoiceData = JSON.parse(invoice.content);
            return (
              <div key={invoice.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">
                        {invoiceData.invoiceNumber}
                      </h3>
                      <p className="text-gray-400">{invoice.metadata.client_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.metadata.status)}`}>
                      {getStatusText(invoice.metadata.status)}
                    </span>
                    <span className="text-lg font-bold text-gray-100">
                      ₽{invoice.metadata.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Создан: {new Date(invoice.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Срок: {new Date(invoiceData.dueDate).toLocaleDateString('ru-RU')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{invoiceData.items.length} позиций</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => viewInvoiceDetails(invoice)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Просмотр
                  </button>
                  
                  <button
                    onClick={() => downloadInvoicePDF(invoice)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  
                  <button
                    onClick={() => resendInvoice(invoice)}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Отправить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно с деталями счета */}
      {showDetails && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-100">Детали счета</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {(() => {
              const invoiceData: InvoiceData = JSON.parse(selectedInvoice.content);
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2">Информация о счете</h4>
                      <p className="text-gray-400">Номер: {invoiceData.invoiceNumber}</p>
                      <p className="text-gray-400">Дата: {new Date(invoiceData.date).toLocaleDateString('ru-RU')}</p>
                      <p className="text-gray-400">Срок оплаты: {new Date(invoiceData.dueDate).toLocaleDateString('ru-RU')}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2">Клиент</h4>
                      <p className="text-gray-400">{invoiceData.client.name}</p>
                      <p className="text-gray-400">{invoiceData.client.email}</p>
                      <p className="text-gray-400">{invoiceData.client.address}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Позиции</h4>
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
                          {invoiceData.items.map((item, index) => (
                            <tr key={index} className="border-b border-gray-700">
                              <td className="py-2 text-gray-400">{item.description}</td>
                              <td className="py-2 text-right text-gray-400">{item.quantity}</td>
                              <td className="py-2 text-right text-gray-400">₽{item.rate.toFixed(2)}</td>
                              <td className="py-2 text-right text-gray-400">₽{item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="border-t border-gray-600 pt-4">
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Подытог:</span>
                      <span>₽{invoiceData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 mb-1">
                      <span>Налог:</span>
                      <span>₽{invoiceData.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-100">
                      <span>Итого:</span>
                      <span>₽{invoiceData.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {invoiceData.notes && (
                    <div>
                      <h4 className="font-semibold text-gray-200 mb-2">Примечания</h4>
                      <p className="text-gray-400">{invoiceData.notes}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}