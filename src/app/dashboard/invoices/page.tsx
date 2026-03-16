'use client';

import { useState } from 'react';
import InvoiceForm from '@/components/InvoiceForm';
import InvoiceList from '@/components/InvoiceList';

export default function InvoicesPage() {
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingInvoice, setEditingInvoice] = useState(null);

  const handleCreateNew = () => {
    setEditingInvoice(null);
    setCurrentView('create');
  };

  const handleInvoiceCreated = () => {
    setCurrentView('list');
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setCurrentView('edit');
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingInvoice(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {currentView === 'list' && (
          <InvoiceList 
            onCreateNew={handleCreateNew}
            onEditInvoice={handleEditInvoice}
          />
        )}

        {(currentView === 'create' || currentView === 'edit') && (
          <div>
            <div className="mb-6">
              <button
                onClick={handleBackToList}
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Назад к списку счетов
              </button>
            </div>
            
            <InvoiceForm 
              onInvoiceCreated={handleInvoiceCreated}
            />
          </div>
        )}
      </div>
    </div>
  );
}