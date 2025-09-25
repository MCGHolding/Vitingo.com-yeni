import React from 'react';
import { MoreHorizontal, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { recentTransactions } from '../../mock/dashboardData';

const RecentTransactionsTable = () => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Tamamlandı';
      case 'pending':
        return 'Bekliyor';
      case 'overdue':
        return 'Gecikmiş';
      default:
        return 'Bilinmiyor';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    return type === 'payment' ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-blue-600" />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Son İşlemler</h3>
          <p className="text-sm text-gray-600 mt-1">En son gerçekleşen finansal işlemler</p>
        </div>
        <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
          Tümünü Görüntüle
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-4">
        {recentTransactions.map((transaction) => (
          <div 
            key={transaction.id}
            className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
          >
            {/* Left Side */}
            <div className="flex items-center space-x-4">
              {/* Type Icon */}
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                {getTypeIcon(transaction.type)}
              </div>

              {/* Transaction Details */}
              <div>
                <h4 className="font-semibold text-gray-900">{transaction.customer}</h4>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString('tr-TR')}
                  </span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-sm text-gray-600 capitalize">
                    {transaction.source.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Amount */}
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {transaction.type === 'payment' ? '+' : ''}₺{transaction.amount.toLocaleString('tr-TR')}
                </p>
                <p className="text-sm text-gray-500 capitalize">{transaction.type === 'payment' ? 'Ödeme' : 'Fatura'}</p>
              </div>

              {/* Status */}
              <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(transaction.status)}`}>
                {getStatusIcon(transaction.status)}
                <span>{getStatusText(transaction.status)}</span>
              </div>

              {/* Actions */}
              <button className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <MoreHorizontal className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Bu Hafta</p>
            <p className="font-bold text-green-600">+₺147,200</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Bekleyen</p>
            <p className="font-bold text-yellow-600">₺32,500</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Gecikmiş</p>
            <p className="font-bold text-red-600">₺67,200</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactionsTable;