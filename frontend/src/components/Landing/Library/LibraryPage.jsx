import React, { useState } from 'react';
import { Globe, MapPin, DollarSign, Building, Phone } from 'lucide-react';
import CountryCityPageNew from './CountryCityPageNew';
import CurrenciesPage from './CurrenciesPage';
import FairCentersPage from './FairCentersPage';
import PhoneCodesPage from './PhoneCodesPage';

const LibraryPage = () => {
  const [activeTab, setActiveTab] = useState('country-city');

  const tabs = [
    {
      id: 'country-city',
      label: 'Ülke & Şehir',
      icon: Globe,
      component: CountryCityPageNew
    },
    {
      id: 'currencies',
      label: 'Para Birimleri',
      icon: DollarSign,
      component: CurrenciesPage
    },
    {
      id: 'phone-codes',
      label: 'Telefon Kodları',
      icon: Phone,
      component: PhoneCodesPage
    },
    {
      id: 'fair-centers',
      label: 'Fuar Merkezleri',
      icon: Building,
      component: FairCentersPage
    }
  ];

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Kütüphane</h1>
        <p className="text-gray-600 mt-2">Master verilerinizi yönetin</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
};

export default LibraryPage;
