import React, { useState } from 'react';
import { DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

const CurrencyTooltip = ({ tryAmount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { convertFromTRY, formatCurrency, loading, error, refreshRates } = useCurrency();
  
  const conversions = convertFromTRY(tryAmount);

  return (
    <div className="relative inline-block">
      {/* Currency Icon */}
      <button
        className="ml-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 group"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={refreshRates}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <DollarSign className="h-4 w-4 text-white group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50 transform transition-all duration-200 animate-in slide-in-from-top-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Para Birimi Dönüşümü</h4>
            <button
              onClick={refreshRates}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">Kurlar güncel olmayabilir</p>
            </div>
          )}

          {/* Currency List */}
          {conversions ? (
            <div className="space-y-3">
              {/* Turkish Lira */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🇹🇷</span>
                  <div>
                    <p className="font-medium text-gray-900">Türk Lirası</p>
                    <p className="text-xs text-gray-600">TRY</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-700">
                    {formatCurrency(conversions.TRY, 'TRY')}
                  </p>
                  <p className="text-xs text-blue-600">Ana Para Birimi</p>
                </div>
              </div>

              {/* US Dollar */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🇺🇸</span>
                  <div>
                    <p className="font-medium text-gray-900">ABD Doları</p>
                    <p className="text-xs text-gray-600">USD</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(conversions.USD, 'USD')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {conversions.USD > 0 ? `1 USD ≈ ₺${(tryAmount / conversions.USD).toFixed(2)}` : ''}
                  </p>
                </div>
              </div>

              {/* Euro */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🇪🇺</span>
                  <div>
                    <p className="font-medium text-gray-900">Euro</p>
                    <p className="text-xs text-gray-600">EUR</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(conversions.EUR, 'EUR')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {conversions.EUR > 0 ? `1 EUR ≈ ₺${(tryAmount / conversions.EUR).toFixed(2)}` : ''}
                  </p>
                </div>
              </div>

              {/* British Pound */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🇬🇧</span>
                  <div>
                    <p className="font-medium text-gray-900">İngiliz Sterlini</p>
                    <p className="text-xs text-gray-600">GBP</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {formatCurrency(conversions.GBP, 'GBP')}
                  </p>
                  <p className="text-xs text-gray-600">
                    {conversions.GBP > 0 ? `1 GBP ≈ ₺${(tryAmount / conversions.GBP).toFixed(2)}` : ''}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Kurlar TCMB'den alınmaktadır • Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyTooltip;