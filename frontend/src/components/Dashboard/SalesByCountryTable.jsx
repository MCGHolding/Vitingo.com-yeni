import React from 'react';
import { MoreHorizontal, TrendingUp } from 'lucide-react';
import { salesByCountry } from '../../mock/dashboardData';

const SalesByCountryTable = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Ülkelere Göre Satışlar</h3>
          <p className="text-sm text-gray-600 mt-1">En yüksek performans gösteren pazarlar</p>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <MoreHorizontal className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden">
        <div className="space-y-3">
          {salesByCountry.map((country, index) => (
            <div 
              key={country.country}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4">
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8 bg-white rounded-full shadow-sm border border-gray-200">
                  <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                </div>

                {/* Flag and Country */}
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{country.country}</h4>
                    <p className="text-sm text-gray-600">{country.percentage}% toplam satış</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Sales Amount */}
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    ₺{country.sales.toLocaleString('tr-TR')}
                  </p>
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">+{(Math.random() * 20 + 5).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-24">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${country.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">{country.percentage}%</p>
                </div>

                {/* Actions */}
                <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white rounded-lg transition-all duration-200">
                  <MoreHorizontal className="h-4 w-4 text-gray-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Toplam Satış:</span>
          <span className="font-bold text-gray-900">
            ₺{salesByCountry.reduce((sum, country) => sum + country.sales, 0).toLocaleString('tr-TR')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesByCountryTable;