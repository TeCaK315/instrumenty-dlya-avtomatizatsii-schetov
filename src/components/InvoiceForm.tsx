'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Send, FileText } from 'lucide-react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<ClientData>({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  
  const [invoiceDetails, setInvoiceDetails] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }
  ]);

  const [taxRate, setTaxRate] = useState(0);

  const addItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.amount = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const generateInvoicePDF = () => {
    const invoiceData: InvoiceData = {
      ...invoiceDetails,
      client,
      items,
      subtotal,
      tax,
      total
    };

    const sections = [
      {
        heading: 'Детали клиента',
        content: `${client.name}\n${client.email}\n${client.address}${client.phone ? '\n' + client.phone : ''}`
      },
      {
        heading: 'Товары и услуги',
        table: {
          headers: ['Описание', 'Кол-во', 'Цена', 'Сумма'],
          rows: items.map(item => [
            item.description,
            item.quantity.toString(),
            `₽${item.rate.toFixed(2)}`,
            `₽${item.amount.toFixed(2)}`
          ]),
          alignRight: [2, 3]
        }
      },
      {
        content: `Подытог: ₽${subtotal.toFixed(2)}\nНалог (${taxRate}%): ₽${tax.toFixed(2)}\nИтого: ₽${total.toFixed(2)}`
      }
    ];

    if (invoiceDetails.notes) {
      sections.push({
        heading: 'Примечания',
        content: invoiceDetails.notes
      });
    }

    generatePDF({
      title: `Счет ${invoiceDetails.invoiceNumber}`,
      subtitle: `Дата: ${new Date(invoiceDetails.date).toLocaleDateString('ru-RU')} | Срок оплаты: ${new Date(invoiceDetails.dueDate).toLocaleDateString('ru-RU')}`,
      sections,
      brandColor: '#5a67d8'
    }, `invoice-${invoiceDetails.invoiceNumber}.pdf`);
  };

  const saveAndSendInvoice = async () => {
    if (!client.name || !client.email || items.some(item => !item.description || item.rate <= 0)) {
      alert('Пожалуйста, заполните все обязательные поля');
      return;
    }

    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const invoiceData: InvoiceData = {
        ...invoiceDetails,
        client,
        items,
        subtotal,
        tax,
        total
      };

      // Сохранить счет в базу данных
      const { data, error } = await supabase
        .from('items')
        .insert({
          title: `Счет ${invoiceDetails.invoiceNumber}`,
          content: JSON.stringify(invoiceData),
          type: 'invoice',
          metadata: {
            client_name: client.name,
            client_email: client.email,
            total_amount: total,
            status: 'sent'
          }
        })
        .select()
        .single();

      if (error) throw error;

      // Отправить email клиенту
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.email,
          subject: `Счет ${invoiceDetails.invoiceNumber}`,
          html: `
            <h2>Счет ${invoiceDetails.invoiceNumber}</h2>
            <p>Уважаемый ${client.name},</p>
            <p>Прикрепляем счет на сумму ₽${total.toFixed(2)}.</p>
            <p>Срок оплаты: ${new Date(invoiceDetails.dueDate).toLocaleDateString('ru-RU')}</p>
            <p>С уважением,<br>Ваша команда</p>
          `
        })
      });

      if (!emailResponse.ok) {
        throw new Error('Ошибка отправки email');
      }

      // Генерировать PDF
      generateInvoicePDF();

      alert('Счет успешно создан и отправлен клиенту!');
      
      // Сбросить форму
      setClient({ name: '', email: '', address: '', phone: '' });
      setItems([{ id: crypto.randomUUID(), description: '', quantity: 1, rate: 0, amount: 0 }]);
      setInvoiceDetails({
        invoiceNumber: `INV-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: ''
      });
      
    } catch (error) {
      console.error('Ошибка создания счета:', error);
      alert('Произошла ошибка при создании счета');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-gray-100">Создать новый счет</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Детали счета */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Детали счета</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Номер счета
            </label>
            <input
              type="text"
              value={invoiceDetails.invoiceNumber}
              onChange={(e) => setInvoiceDetails({...invoiceDetails, invoiceNumber: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Дата
              </label>
              <input
                type="date"
                value={invoiceDetails.date}
                onChange={(e) => setInvoiceDetails({...invoiceDetails, date: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Срок оплаты
              </label>
              <input
                type="date"
                value={invoiceDetails.dueDate}
                onChange={(e) => setInvoiceDetails({...invoiceDetails, dueDate: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Данные клиента */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Данные клиента</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Имя клиента *
            </label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => setClient({...client, name: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => setClient({...client, email: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Адрес
            </label>
            <textarea
              value={client.address}
              onChange={(e) => setClient({...client, address: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Телефон
            </label>
            <input
              type="tel"
              value={client.phone}
              onChange={(e) => setClient({...client, phone: e.target.value})}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Товары и услуги */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Товары и услуги</h3>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить позицию
          </button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-end p-4 bg-gray-700 rounded-lg">
              <div className="col-span-5">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Описание *
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Описание товара/услуги"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Кол-во
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Цена (₽)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Сумма (₽)
                </label>
                <div className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-gray-100">
                  {item.amount.toFixed(2)}
                </div>
              </div>
              
              <div className="col-span-1">
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                  className="p-2 text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Итоги */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Примечания
          </label>
          <textarea
            value={invoiceDetails.notes}
            onChange={(e) => setInvoiceDetails({...invoiceDetails, notes: e.target.value})}
            rows={4}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Дополнительная информация..."
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Налог (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={taxRate}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="p-4 bg-gray-700 rounded-lg space-y-2">
            <div className="flex justify-between text-gray-300">
              <span>Подытог:</span>
              <span>₽{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Налог ({taxRate}%):</span>
              <span>₽{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-100 border-t border-gray-600 pt-2">
              <span>Итого:</span>
              <span>₽{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Действия */}
      <div className="flex gap-4 justify-end">
        <button
          onClick={generateInvoicePDF}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Скачать PDF
        </button>
        
        <button
          onClick={saveAndSendInvoice}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'Отправка...' : 'Создать и отправить'}
        </button>
      </div>
    </div>
  );
}