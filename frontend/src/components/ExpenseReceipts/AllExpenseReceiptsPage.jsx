import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Edit2, MoreHorizontal, FileText, CheckCircle, XCircle, Clock, DollarSign, Trash2, Mail } from 'lucide-react';

const AllExpenseReceiptsPage = ({ onBackToDashboard, onNewExpenseReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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

  // Load expense receipts from backend
  useEffect(() => {
    const loadReceipts = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://finance-insights-34.preview.emergentagent.com';
        const response = await fetch(`${backendUrl}/api/expense-receipts`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch expense receipts');
        }
        
        const data = await response.json();
        setReceipts(data);
        setFilteredReceipts(data);
      } catch (error) {
        console.error('Error loading expense receipts:', error);
        setError('Gider makbuzları yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadReceipts();
  }, []);

  // Filter receipts based on search, status, and currency
  useEffect(() => {
    let filtered = receipts;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.status === statusFilter);
    }
    
    // Currency filter
    if (currencyFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.currency === currencyFilter);
    }
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt => 
        receipt.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, statusFilter, currencyFilter]);

  // Get status badge component
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Onay Bekliyor
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Onaylandı
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <DollarSign className="w-3 h-3 mr-1" />
            Ödendi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-3 h-3 mr-1" />
            Bilinmeyen
          </span>
        );
    }
  };

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

  // Get unique currencies for filter
  const availableCurrencies = [...new Set(receipts.map(r => r.currency))];

  // Handle view receipt
  const handleViewReceipt = (receipt) => {
    // TODO: Implement view modal or navigate to view page
    alert(`Makbuz görüntüleme: ${receipt.receipt_number}`);
  };

  // Handle edit receipt
  const handleEditReceipt = (receipt) => {
    // TODO: Implement edit modal or navigate to edit page
    alert(`Makbuz düzenleme: ${receipt.receipt_number}`);
  };

  // Handle delete receipt
  const handleDeleteReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://finance-insights-34.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/expense-receipts/${selectedReceipt.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Remove from local state
        setReceipts(receipts.filter(r => r.id !== selectedReceipt.id));
        setShowDeleteModal(false);
        setSelectedReceipt(null);
        setSuccessMessage('Gider makbuzu başarıyla silindi');
        setShowSuccessModal(true);
      } else {
        throw new Error('Silme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('Makbuz silinirken hata oluştu');
    }
  };

  // Handle send email
  const handleSendEmail = (receipt) => {
    setSelectedReceipt(receipt);
    setEmailForm({
      to: '',
      subject: `Gider Makbuzu: ${receipt.receipt_number}`,
      message: `${receipt.receipt_number} numaralı gider makbuzu hakkında...`
    });
    setShowEmailModal(true);
  };

  // Send email
  const sendEmail = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://finance-insights-34.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/send-expense-receipt-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailForm,
          receipt_id: selectedReceipt.id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowEmailModal(false);
        setEmailForm({ to: '', subject: '', message: '' });
        setSelectedReceipt(null);
        setSuccessMessage('E-posta başarıyla gönderildi');
        setShowSuccessModal(true);
      } else {
        throw new Error(result.message || 'E-posta gönderilemedi');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('E-posta gönderilirken hata oluştu');
    }
  };

  // Summary statistics
  const totalReceipts = receipts.length;
  const pendingReceipts = receipts.filter(r => r.status === 'pending').length;
  const approvedReceipts = receipts.filter(r => r.status === 'approved').length;
  const paidReceipts = receipts.filter(r => r.status === 'paid').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-600" />
              Tüm Gider Makbuzları
            </h1>
            <p className="text-gray-600 mt-2">Tüm gider makbuzlarını görüntüleyin ve yönetin</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onNewExpenseReceipt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Makbuz</p>
              <p className="text-2xl font-bold text-gray-900">{totalReceipts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Onay Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingReceipts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Onaylandı</p>
              <p className="text-2xl font-bold text-green-600">{approvedReceipts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ödendi</p>
              <p className="text-2xl font-bold text-blue-600">{paidReceipts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Onay Bekleyen</option>
              <option value="approved">Onaylandı</option>
              <option value="paid">Ödendi</option>
            </select>

            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Para Birimleri</option>
              {availableCurrencies.map(currency => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredReceipts.length} makbuz bulundu
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
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Henüz gider makbuzu bulunmuyor</p>
            <button
              onClick={onNewExpenseReceipt}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              İlk Makbuzu Oluştur
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıra No
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
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt, index) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {index + 1}
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
                      {getStatusBadge(receipt.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => handleViewReceipt(receipt)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditReceipt(receipt)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <div className="relative group">
                          <button className="text-gray-600 hover:text-gray-900 transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-6 w-32 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                            <button
                              onClick={() => handleDeleteReceipt(receipt)}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Sil</span>
                            </button>
                            <button
                              onClick={() => handleSendEmail(receipt)}
                              className="w-full px-4 py-2 text-left text-blue-600 hover:bg-blue-50 flex items-center space-x-2"
                            >
                              <Mail className="w-4 h-4" />
                              <span>Mail</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Makbuzu Sil</h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedReceipt?.receipt_number}</strong> numaralı gider makbuzunu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedReceipt(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">E-posta Gönder</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alıcı E-posta</label>
                <input
                  type="email"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailForm({ to: '', subject: '', message: '' });
                  setSelectedReceipt(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={sendEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Başarılı!</h3>
              <p className="text-gray-600 mb-6">{successMessage}</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllExpenseReceiptsPage;