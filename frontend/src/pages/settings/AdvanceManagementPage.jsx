import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdvanceRulesSettings from '../../components/Advances/AdvanceRulesSettings';

const AdvanceManagementPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [activeTab, setActiveTab] = useState('rules');

  const handleBack = () => {
    navigate(`/${tenantSlug}/ayarlar`);
  };

  const tabs = [
    { id: 'rules', label: 'Avans Kuralları' },
    { id: 'categories', label: 'Avans Kategorileri' },
    { id: 'approval', label: 'Onay Ayarları' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={handleBack}
          className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avans Yönetimi</h1>
          <p className="text-gray-600 mt-1">Avans kuralları ve ayarları</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'rules' && <AdvanceRulesSettings />}
        
        {activeTab === 'categories' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📂</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Avans Kategorileri</h2>
              <p className="text-gray-600">
                Avans kategorileri ayarları yakında eklenecek.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'approval' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Onay Ayarları</h2>
              <p className="text-gray-600">
                Avans onay süreci ayarları yakında eklenecek.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvanceManagementPage;
