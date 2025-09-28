import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Eye, Edit2, MoreHorizontal, CreditCard, User, Building, Trash2, Mail } from 'lucide-react';

const ApprovedExpenseReceiptsPage = ({ onBackToDashboard, onNewExpenseReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('admin'); // TODO: Get from auth context

  // Load approved expense receipts from backend
  useEffect(() => {
    const loadApprovedReceipts = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://supplier-hub-14.preview.emergentagent.com';
        const response = await fetch(`${backendUrl}/api/expense-receipts?status=approved`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch approved expense receipts');
        }
        
        const data = await response.json();
        setReceipts(data);
        setFilteredReceipts(data);
      } catch (error) {
        console.error('Error loading approved expense receipts:', error);
        setError('Onaylanmış makbuzlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadApprovedReceipts();
  }, []);

  // Filter receipts based on search
  useEffect(() => {
    let filtered = receipts;
    
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, searchTerm]);

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

  // Handle payment action
  const handlePayment = (receipt) => {
    // TODO: Implement payment functionality
    if (window.confirm(`${receipt.supplier_name} için ${formatCurrency(receipt.amount, receipt.currency)} tutarındaki makbuzu ödenmiş olarak işaretle?`)) {
      // Update status to paid
      // This would typically call an API to update the receipt status
      alert('Ödeme işlemi tamamlandı');
    }
  };

  // Check if user can make payments
  const canMakePayments = () => {
    return ['admin', 'super_admin', 'accounting'].includes(userRole);
  };

  // Calculate total amount
  const totalAmount = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
              Onaylanmış Makbuzlar
            </h1>
            <p className="text-gray-600 mt-2">Tedarikçi tarafından onaylanmış, ödeme bekleyen makbuzlar</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onNewExpenseReceipt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
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

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{receipts.length} Onaylanmış Makbuz</h2>
            <p className="text-green-100 mt-1">Ödeme için hazır makbuzlar</p>
          </div>
          <CreditCard className="w-12 h-12 text-green-200" />
        </div>
        {receipts.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-100">Toplam Ödeme Tutarı</p>
              <p className="text-2xl font-bold">
                {totalAmount.toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div>
              <p className="text-green-100">Ortalama Makbuz</p>
              <p className="font-semibold">
                {(totalAmount / receipts.length).toLocaleString('tr-TR')} ₺
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Permission Notice */}
      {!canMakePayments() && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <User className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm">
              <strong>Bilgi:</strong> Ödeme işlemlerini sadece Muhasebe, Admin ve Süper Admin rolündeki kullanıcılar yapabilir.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Makbuz no, tedarikçi, açıklama ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredReceipts.length} onaylanmış makbuz bulundu
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Makbuzlar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Onaylanmış makbuz bulunmuyor</p>
            <p className="text-sm text-gray-500">Makbuzlar henüz onaylanmamış veya zaten ödenmiş durumda</p>
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
                    Onay Tarihi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tedarikçi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banka Bilgileri
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
                      <div className="text-sm font-medium text-blue-600">
                        #{receipt.receipt_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {receipt.signed_at ? formatDate(receipt.signed_at) : 'Bilinmiyor'}
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
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(receipt.amount, receipt.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {receipt.supplier_iban && (
                          <div>IBAN: {receipt.supplier_iban.slice(-4)}</div>
                        )}
                        {receipt.supplier_bank_name && (
                          <div className="text-gray-500">{receipt.supplier_bank_name}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {receipt.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {canMakePayments() && (
                          <button 
                            onClick={() => handlePayment(receipt)}
                            className="text-green-600 hover:text-green-900 transition-colors flex items-center px-3 py-1 bg-green-50 rounded-md border border-green-200"
                            title="Ödeme Yap"
                          >
                            <CreditCard className="w-4 h-4 mr-1" />
                            Öde
                          </button>
                        )}
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

export default ApprovedExpenseReceiptsPage;