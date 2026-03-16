'use client';

import { useState } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import { FileText, Plus } from 'lucide-react';

export default function InvoicesPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState('');

  const handleInvoiceCreated = (invoiceId: string) => {
    setShowForm(false);
    setRefreshTrigger(Date.now().toString());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-orange-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Управление счетами</h1>
            <p className="text-gray-400">Создавайте и управляйте счетами для ваших клиентов</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Скрыть форму' : 'Создать счет'}
        </button>
      </div>

      {showForm && (
        <InvoiceForm onInvoiceCreated={handleInvoiceCreated} />
      )}

      <InvoiceList refreshTrigger={refreshTrigger} />
    </div>
  );
}