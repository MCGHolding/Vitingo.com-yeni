import React, { useState } from 'react';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import TemplateListPage from './TemplateListPage';
import MyContractsPage from './MyContractsPage';

const DocumentsPage = () => {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sözleşme Yönetimi</h1>
              <p className="text-gray-600">Şablon ve sözleşme yönetim sistemi</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline w-5 h-5 mr-2" />
            Şablon Yönetimi
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'contracts'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline w-5 h-5 mr-2" />
            Tüm Sözleşmeler
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'templates' && <TemplateListPage />}
      {activeTab === 'contracts' && <MyContractsPage />}
    </div>
  );
};

export default DocumentsPage;
