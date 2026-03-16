'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FileText, Plus, Trash2, Send } from 'lucide-react';
import { Spinner } from '@/components/LoadingStates';

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

interface InvoiceFormProps {
  onInvoiceCreated?: (invoiceId: string) => void;
}

export default function InvoiceForm({ onInvoiceCreated }: InvoiceFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [client, setClient] = useState<ClientData>({
    name: '',
    email: '',
    address: '',
    phone: ''
  });
  
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: `INV-${Date.now()}`,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    taxRate: 0
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
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = createClient();
      
      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceData.invoiceNumber,
          client_name: client.name,
          client_email: client.email,
          client_address: client.address,
          client_phone: client.phone,
          due_date: invoiceData.dueDate,
          subtotal,
          tax_rate: invoiceData.taxRate,
          tax_amount: taxAmount,
          total,
          notes: invoiceData.notes,
          status: 'draft'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      // Create invoice items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          items.map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount
          }))
        );

      if (itemsError) throw itemsError;

      onInvoiceCreated?.(invoice.id);
      
      // Reset form
      setClient({ name: '', email: '', address: '', phone: '' });
      setInvoiceData({
        invoiceNumber: `INV-${Date.now()}`,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: '',
        taxRate: 0
      });
      setItems([{
        id: crypto.randomUUID(),
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]);

    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-semibold text-gray-100">Создать новый счет</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Номер счета
            </label>
            <input
              type="text"
              value={invoiceData.invoiceNumber}
              onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Срок оплаты
            </label>
            <input
              type="date"
              value={invoiceData.dueDate}
              onChange={(e) => setInvoiceData({ ...invoiceData, dueDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Client Information */}
        <div className="border-t border-gray-700 pt-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Информация о клиенте</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Название компании / ФИО
              </label>
              <input
                type="text"
                value={client.name}
                onChange={(e) => setClient({ ...client, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={client.email}
                onChange={(e) => setClient({ ...client, email: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Адрес
              </label>
              <textarea
                value={client.address}
                onChange={(e) => setClient({ ...client, address: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Телефон (опционально)
              </label>
              <input
                type="tel"
                value={client.phone}
                onChange={(e) => setClient({ ...client, phone: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-100">Позиции счета</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Добавить позицию
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Описание
                  </label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Количество
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Цена
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.rate}
                    onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Сумма
                  </label>
                  <div className="px-3 py-2 bg-gray-600 border border-gray-600 rounded-md text-gray-100">
                    {item.amount.toFixed(2)} ₽
                  </div>
                </div>
                <div className="col-span-1">
                  <button
                    type="button"
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

        {/* Totals and Tax */}
        <div className="border-t border-gray-700 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Налог (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={invoiceData.taxRate}
                onChange={(e) => setInvoiceData({ ...invoiceData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Подытог:</span>
                <span>{subtotal.toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Налог:</span>
                <span>{taxAmount.toFixed(2)} ₽</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-gray-100 border-t border-gray-600 pt-2">
                <span>Итого:</span>
                <span>{total.toFixed(2)} ₽</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Примечания
          </label>
          <textarea
            value={invoiceData.notes}
            onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Дополнительная информация для клиента..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Spinner size="sm" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isLoading ? 'Создание...' : 'Создать счет'}
          </button>
        </div>
      </form>
    </div>
  );
}