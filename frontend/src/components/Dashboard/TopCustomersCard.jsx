import React from 'react';
import { Crown, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { topCustomers } from '../../mock/dashboardData';

const TopCustomersCard = () => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'vip':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'premium':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'vip':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">En İyi 5 Müşteri</h3>
          <p className="text-sm text-gray-600 mt-1">Bu ayki en yüksek satış hacmine sahip müşteriler</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Detayları Gör
        </button>
      </div>

      {/* Customers List */}
      <div className="space-y-4">
        {topCustomers.map((customer, index) => (
          <div 
            key={customer.id}
            className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
              index === 0 
                ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200' 
                : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
            }`}
          >
            {/* Rank Badge */}
            <div className={`absolute -top-2 -left-2 flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              index === 0 
                ? 'bg-yellow-500 text-white' 
                : index === 1 
                  ? 'bg-gray-400 text-white'
                  : index === 2
                    ? 'bg-orange-400 text-white'
                    : 'bg-gray-300 text-gray-700'
            }`}>
              {index + 1}
            </div>

            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-white ${
                index === 0 
                  ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              }`}>
                {customer.avatar}
              </div>

              {/* Customer Info */}
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                  {getStatusIcon(customer.status) && (
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusStyle(customer.status)}`}>
                      {getStatusIcon(customer.status)}
                      <span className="capitalize">{customer.status}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">
                    ₺{customer.sales.toLocaleString('tr-TR')}
                  </span>
                  <div className={`flex items-center space-x-1 ${
                    customer.growth > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {customer.growth > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span className="text-xs font-medium">
                      {customer.growth > 0 ? '+' : ''}{customer.growth}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-3">
              <div className="w-20">
                <div className="bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                    style={{ width: `${Math.min((customer.sales / topCustomers[0].sales) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <button className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                Görüntüle
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Top 5 Toplam:</span>
          <span className="font-bold text-gray-900">
            ₺{topCustomers.reduce((sum, customer) => sum + customer.sales, 0).toLocaleString('tr-TR')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopCustomersCard;