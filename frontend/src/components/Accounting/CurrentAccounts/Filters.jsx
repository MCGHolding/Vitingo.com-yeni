import React, { useState } from 'react';

const Filters = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  accountTypeFilter,
  setAccountTypeFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  overdueFilter,
  setOverdueFilter,
  resetFilters,
  totalFiltered,
  totalAccounts
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTypeToggle = (type) => {
    if (accountTypeFilter.includes(type)) {
      setAccountTypeFilter(accountTypeFilter.filter(t => t !== type));
    } else {
      setAccountTypeFilter([...accountTypeFilter, type]);
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tümü', icon: '📋', color: 'gray' },
    { value: 'debtor', label: 'Borçlu', icon: '🟢', color: 'green' },
    { value: 'creditor', label: 'Alacaklı', icon: '🔴', color: 'red' },
    { value: 'zero', label: 'Sıfır', icon: '⚪', color: 'gray' }
  ];

  const typeOptions = [
    { value: 'customer', label: 'Müşteri', icon: '👤' },
    { value: 'supplier', label: 'Tedarikçi', icon: '🏭' },
    { value: 'personnel', label: 'Personel', icon: '👨‍💼' },
    { value: 'other', label: 'Diğer', icon: '📁' }
  ];

  const sortOptions = [
    { value: 'balance', label: 'Bakiye' },
    { value: 'name', label: 'Firma Adı' },
    { value: 'receivables', label: 'Alacak' },
    { value: 'payables', label: 'Borç' },
    { value: 'lastTransaction', label: 'Son İşlem' }
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
      
      {/* Üst Kısım - Her Zaman Görünür */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          
          {/* Arama */}
          <div className="flex-1 max-w-md relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Firma adı veya hesap no ile ara..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Durum Filtreleri - Butonlar */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition flex items-center space-x-1 ${
                  statusFilter === option.value
                    ? option.value === 'debtor' ? 'bg-green-500 text-white shadow-sm' :
                      option.value === 'creditor' ? 'bg-red-500 text-white shadow-sm' :
                      'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {/* Sıralama */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              title={sortOrder === 'asc' ? 'Artan' : 'Azalan'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Genişlet/Daralt */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition flex items-center"
          >
            <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span className="ml-1 text-sm">Filtreler</span>
          </button>

          {/* Reset */}
          <button
            onClick={resetFilters}
            className="px-4 py-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition text-sm"
          >
            Sıfırla
          </button>
        </div>
      </div>

      {/* Genişletilmiş Filtreler */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 bg-gray-50">
          <div className="grid grid-cols-4 gap-6">
            
            {/* Hesap Tipi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hesap Tipi</label>
              <div className="space-y-2">
                {typeOptions.map(option => (
                  <label key={option.value} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={accountTypeFilter.includes(option.value)}
                      onChange={() => handleTypeToggle(option.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                      {option.icon} {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Vade Durumu */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vade Durumu</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tümü' },
                  { value: '7', label: '7 gün geçmiş' },
                  { value: '15', label: '15 gün geçmiş' },
                  { value: '30', label: '30 gün geçmiş' },
                  { value: '60', label: '60+ gün geçmiş' }
                ].map(option => (
                  <label key={option.value} className="flex items-center cursor-pointer group">
                    <input
                      type="radio"
                      name="overdueFilter"
                      value={option.value}
                      checked={overdueFilter === option.value}
                      onChange={(e) => setOverdueFilter(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bakiye Aralığı */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bakiye Aralığı</label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min tutar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <input
                  type="number"
                  placeholder="Max tutar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Para Birimi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
              <div className="space-y-2">
                {['TRY', 'USD', 'EUR', 'GBP'].map(currency => (
                  <label key={currency} className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked={currency === 'TRY'}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                      {currency === 'TRY' ? '₺' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '£'} {currency}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sonuç Sayısı */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-900">{totalFiltered}</span> hesap bulundu
          {totalFiltered !== totalAccounts && (
            <span className="text-gray-400"> / toplam {totalAccounts}</span>
          )}
        </div>
        {searchTerm || statusFilter !== 'all' || accountTypeFilter.length < 4 ? (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">Aktif filtreler:</span>
            {searchTerm && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                "{searchTerm}"
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                {statusFilter === 'debtor' ? 'Borçlu' : statusFilter === 'creditor' ? 'Alacaklı' : 'Sıfır'}
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Filters;