import React, { useState, useEffect } from 'react';
import { Search, Clock, Eye, Edit2, MoreHorizontal, AlertCircle, Send, Trash2, Mail, CheckCircle } from 'lucide-react';

const PendingApprovalExpenseReceiptsPage = ({ onBackToDashboard, onNewExpenseReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  });

  // Load pending expense receipts from backend
  useEffect(() => {
    const loadPendingReceipts = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://supplier-hub-14.preview.emergentagent.com';
        const response = await fetch(`${backendUrl}/api/expense-receipts?status=pending`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch pending expense receipts');
        }
        
        const data = await response.json();
        setReceipts(data);
        setFilteredReceipts(data);
      } catch (error) {
        console.error('Error loading pending expense receipts:', error);
        setError('Onay bekleyen makbuzlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadPendingReceipts();
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

  // Calculate days waiting
  const getDaysWaiting = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Send reminder (placeholder function)
  const sendReminder = (receipt) => {
    // TODO: Implement send reminder functionality
    alert(`${receipt.supplier_name} için hatırlatma gönderildi`);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Clock className="w-8 h-8 mr-3 text-yellow-600" />
              Onay Bekleyen Makbuzlar
            </h1>
            <p className="text-gray-600 mt-2">Tedarikçi onayı bekleyen gider makbuzları</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onNewExpenseReceipt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Clock className="w-5 h-5 mr-2" />
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
      <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl p-6 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{receipts.length} Makbuz Onay Bekliyor</h2>
            <p className="text-yellow-100 mt-1">Tedarikçiler tarafından onay beklenen makbuzlar</p>
          </div>
          <AlertCircle className="w-12 h-12 text-yellow-200" />
        </div>
        {receipts.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-yellow-100">Toplam Tutar</p>
              <p className="font-semibold">
                {receipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString('tr-TR')} ₺
              </p>
            </div>
            <div>
              <p className="text-yellow-100">Ortalama Bekleme</p>
              <p className="font-semibold">
                {Math.round(receipts.reduce((sum, r) => sum + getDaysWaiting(r.created_at), 0) / receipts.length)} gün
              </p>
            </div>
          </div>
        )}
      </div>

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
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full sm:w-80"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredReceipts.length} onay bekleyen makbuz bulundu
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Makbuzlar yükleniyor...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-8 text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Onay bekleyen makbuz bulunmuyor</p>
            <p className="text-sm text-gray-500">Tüm makbuzlar onaylanmış veya ödeme aşamasında</p>
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
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tedarikçi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bekleme Süresi
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
                {filteredReceipts.map((receipt) => {
                  const daysWaiting = getDaysWaiting(receipt.created_at);
                  const isUrgent = daysWaiting > 7;
                  
                  return (
                    <tr key={receipt.id} className={`hover:bg-gray-50 ${isUrgent ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-blue-600">
                          #{receipt.receipt_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(receipt.date)}
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isUrgent 
                            ? 'bg-red-100 text-red-800' 
                            : daysWaiting > 3 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                        }`}>
                          {daysWaiting} gün
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {receipt.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => sendReminder(receipt)}
                            className="text-yellow-600 hover:text-yellow-900 transition-colors"
                            title="Hatırlatma Gönder"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button className="text-blue-600 hover:text-blue-900 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-900 transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovalExpenseReceiptsPage;