'use client';

import { useState } from 'react';
import { Plus, List } from 'lucide-react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Управление счетами</h1>
          <p className="text-gray-400">
            Создавайте, отправляйте и отслеживайте ваши счета
          </p>
        </div>

        {/* Табы */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <List size={16} />
            Список счетов
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Plus size={16} />
            Создать счет
          </button>
        </div>

        {/* Контент */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'list' ? <InvoiceList /> : <InvoiceForm />}
        </div>
      </div>
    </div>
  );
}