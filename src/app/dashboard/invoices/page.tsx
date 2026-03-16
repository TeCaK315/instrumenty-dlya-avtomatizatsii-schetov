'use client';

import { useState } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import { FileText, Plus } from 'lucide-react';

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [refreshTrigger, setRefreshTrigger] = useState<string>('');

  const handleInvoiceCreated = (invoiceId: string) => {
    setRefreshTrigger(invoiceId);
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Montserrat' }}>
          Управление счетами
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Список счетов
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            Создать счет
          </button>
        </div>
      </div>

      {activeTab === 'list' ? (
        <InvoiceList refreshTrigger={refreshTrigger} />
      ) : (
        <InvoiceForm onInvoiceCreated={handleInvoiceCreated} />
      )}
    </div>
  );
}