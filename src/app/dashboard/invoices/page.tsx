'use client';

import { useState } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';
import { FileText, Plus, List } from 'lucide-react';

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Управление счетами</h1>
            <p className="text-gray-400">Создавайте и отправляйте профессиональные счета</p>
          </div>
        </div>
      </div>

      {/* Табы */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('create')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'create'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <Plus className="w-4 h-4" />
          Создать счет
        </button>
        
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'list'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <List className="w-4 h-4" />
          История счетов
        </button>
      </div>

      {/* Контент */}
      <div className="min-h-[600px]">
        {activeTab === 'create' ? <InvoiceForm /> : <InvoiceList />}
      </div>
    </div>
  );
}