'use client';

import { useState } from 'react';
import { Plus, Trash2, Save, Send } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generatePDF } from '@/lib/pdf-generator';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface ClientData {
  name: string;
  email: string;
  address: string;
  phone?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate: string;
  client: ClientData;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
}

export default function InvoiceForm() {
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    client: {
      name: '',
      email: '',
      address: '',
      phone: ''
    },
    items: [{
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }],
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const calculateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% налог
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    const updatedItems = invoice.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });

    const totals = calculateTotals(updatedItems);
    setInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (id: string) => {
    if (invoice.items.length === 1) return;
    
    const updatedItems = invoice.items.filter(item => item.id !== id);
    const totals = calculateTotals(updatedItems);
    setInvoice(prev => ({
      ...prev,
      items: updatedItems,
      ...totals
    }));
  };

  const saveInvoice = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoice.invoiceNumber,
          client_data: invoice.client,
          items: invoice.items,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          due_date: invoice.dueDate,
          notes: invoice.notes,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      setMessage('Счет успешно сохранен!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving invoice:', error);
      setMessage('Ошибка при сохранении счета');
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvoice = async () => {
    setIsLoading(true);
    try {
      // Сначала сохраняем счет
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoice.invoiceNumber,
          client_data: invoice.client,
          items: invoice.items,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          due_date: invoice.dueDate,
          notes: invoice.notes,
          status: 'sent'
        })
        .select()
        .single();

      if (error) throw error;

      // Генерируем PDF
      const pdfSections = [
        {
          heading: 'Информация о клиенте',
          content: `${invoice.client.name}\n${invoice.client.email}\n${invoice.client.address}${invoice.client.phone ? '\n' + invoice.client.phone : ''}`
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
        title: `Счет ${invoice.invoiceNumber}`,
        subtitle: `Дата: ${new Date(invoice.date).toLocaleDateString('ru-RU')} | Срок оплаты: ${new Date(invoice.dueDate).toLocaleDateString('ru-RU')}`,
        sections: pdfSections,
        brandColor: '#5a67d8'
      }, `${invoice.invoiceNumber}.pdf`);

      setMessage('Счет успешно создан и отправлен клиенту!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error sending invoice:', error);
      setMessage('Ошибка при отправке счета');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Создание счета</h2>
        {message && (
          <div className={`p-3 rounded ${message.includes('Ошибка') ? 'bg-red-600' : 'bg-green-600'} text-white`}>
            {message}
          </div>
        )}
      </div>

      {/* Основная информация */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Номер счета
          </label>
          <input
            type="text"
            value={invoice.invoiceNumber}
            onChange={(e) => setInvoice(prev => ({ ...prev, invoiceNumber: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Дата
          </label>
          <input
            type="date"
            value={invoice.date}
            onChange={(e) => setInvoice(prev => ({ ...prev, date: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Срок оплаты
          </label>
          <input
            type="date"
            value={invoice.dueDate}
            onChange={(e) => setInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Информация о клиенте */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Информация о клиенте</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Имя клиента *
            </label>
            <input
              type="text"
              value={invoice.client.name}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, name: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={invoice.client.email}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, email: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Адрес
            </label>
            <input
              type="text"
              value={invoice.client.address}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, address: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={invoice.client.phone}
              onChange={(e) => setInvoice(prev => ({
                ...prev,
                client: { ...prev.client, phone: e.target.value }
              }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Позиции счета */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-white">Позиции счета</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Добавить позицию
          </button>
        </div>

        <div className="space-y-3">
          {invoice.items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-gray-700 rounded">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="Описание услуги/товара"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Кол-во"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Цена"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">₽{item.amount.toFixed(2)}</span>
                {invoice.items.length > 1 && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Итоги */}
      <div className="mb-6">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Подытог:</span>
              <span>₽{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Налог (10%):</span>
              <span>₽{invoice.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white font-bold text-lg border-t border-gray-600 pt-2">
              <span>Итого:</span>
              <span>₽{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Примечания */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Примечания
        </label>
        <textarea
          value={invoice.notes}
          onChange={(e) => setInvoice(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
          placeholder="Дополнительная информация..."
        />
      </div>

      {/* Кнопки действий */}
      <div className="flex gap-3">
        <button
          onClick={saveInvoice}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          Сохранить как черновик
        </button>
        <button
          onClick={sendInvoice}
          disabled={isLoading || !invoice.client.name || !invoice.client.email}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Send size={16} />
          Создать и отправить счет
        </button>
      </div>
    </div>
  );
}