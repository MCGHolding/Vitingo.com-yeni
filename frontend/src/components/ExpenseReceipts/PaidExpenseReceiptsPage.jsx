import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Eye, Edit2, MoreHorizontal, CheckCircle2, Calendar, Building } from 'lucide-react';

const PaidExpenseReceiptsPage = ({ onBackToDashboard, onNewExpenseReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load paid expense receipts from backend
  useEffect(() => {
    const loadPaidReceipts = async () => {
      setLoading(true);
      try {
        const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/expense-receipts?status=paid`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch paid expense receipts');
        }
        
        const data = await response.json();
        setReceipts(data);
        setFilteredReceipts(data);
      } catch (error) {
        console.error('Error loading paid expense receipts:', error);
        setError('Ödenmiş makbuzlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadPaidReceipts();
  }, []);

  // Filter receipts based on search and date
  useEffect(() => {
    let filtered = receipts;
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(receipt => 
            new Date(receipt.paid_at) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(receipt => 
            new Date(receipt.paid_at) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(receipt => 
            new Date(receipt.paid_at) >= filterDate
          );
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(receipt => 
            new Date(receipt.paid_at) >= filterDate
          );
          break;
      }
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, dateFilter]);

  // Format currency
  const formatCurrency = (amount, currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'TRY': '₺',
      'AED': 'د.إ'
    };
    
    return `${symbols[currency] || currency} ${amount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Calculate total amount paid
  const totalPaid = filteredReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  // Group by currency for better display
  const groupByCurrency = (receipts) => {
    const grouped = receipts.reduce((acc, receipt) => {
      if (!acc[receipt.currency]) {
        acc[receipt.currency] = 0;
      }
      acc[receipt.currency] += receipt.amount;
      return acc;
    }, {});
    return grouped;
  };

  const currencyTotals = groupByCurrency(filteredReceipts);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <DollarSign className="w-8 h-8 mr-3 text-blue-600" />
              Ödenmiş Makbuzlar
            </h1>
            <p className="text-gray-600 mt-2">Tamamlanmış ve ödenmiş gider makbuzları</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onNewExpenseReceipt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <DollarSign className="w-5 h-5 mr-2" />
              Yeni Makbuz
            </button>
            <button
              onClick={onBackToDashboard}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{filteredReceipts.length}</h2>
              <p className="text-blue-100">Ödenmiş Makbuz</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {Object.keys(currencyTotals).length > 0 ? 
                  Object.entries(currencyTotals).map(([currency, amount]) => (
                    <div key={currency} className="text-sm">
                      {formatCurrency(amount, currency)}
                    </div>
                  ))
                  : '0 ₺'
                }
              </h2>
              <p className="text-green-100">Toplam Ödenen</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {filteredReceipts.length > 0 ? 
                  Math.round(totalPaid / filteredReceipts.length).toLocaleString('tr-TR') 
                  : '0'
                } ₺
              </h2>
              <p className="text-purple-100">Ort. Makbuz</p>
            </div>
            <Building className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {new Set(filteredReceipts.map(r => r.supplier_id)).size}
              </h2>
              <p className="text-orange-100">Tedarikçi</p>
            </div>
            <Building className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Makbuz no, tedarikçi, açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-80"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Zamanlar</option>
              <option value="today">Bugün</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Son Ay</option>
              <option value="year">Son Yıl</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredReceipts.length} ödenmiş makbuz bulundu
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Makbuzlar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Ödenmiş makbuz bulunmuyor</p>
            <p className="text-sm text-gray-500">Henüz hiçbir makbuz ödenmiş durumda değil</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Makbuz No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ödeme Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tedarikçi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Açıklama
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                        <div className="text-sm font-medium text-blue-600">
                          #{receipt.receipt_number}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {receipt.paid_at ? formatDate(receipt.paid_at) : 'Bilinmiyor'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {receipt.supplier_name}
                      </div>
                      {receipt.supplier_country && (
                        <div className="text-sm text-gray-500">
                          {receipt.supplier_country}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(receipt.amount, receipt.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {receipt.sender_bank_name || 'Bilinmiyor'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {receipt.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-600 hover:text-gray-900 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaidExpenseReceiptsPage;