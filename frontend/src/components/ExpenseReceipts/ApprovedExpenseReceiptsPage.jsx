import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, Eye, Edit2, MoreHorizontal, CreditCard, User, Building, Trash2, Mail, DollarSign, Calendar, FileCheck, Copy } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCurrency } from '../../hooks/useCurrency';

const ApprovedExpenseReceiptsPage = ({ onBackToDashboard, onNewExpenseReceipt }) => {
  const { user } = useAuth();
  const { rates: exchangeRates, formatCurrency: formatCurrencyHook } = useCurrency();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState({});
  const [showBankInfoModal, setShowBankInfoModal] = useState(false);
  const [selectedBankInfo, setSelectedBankInfo] = useState(null);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStandardSuccess, setShowStandardSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: ''
  });

  // Load approved expense receipts and suppliers from backend
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://prospect-manager-6.preview.emergentagent.com';
        
        // Load receipts
        const receiptsResponse = await fetch(`${backendUrl}/api/expense-receipts?status=approved`);
        if (!receiptsResponse.ok) {
          throw new Error('Failed to fetch approved expense receipts');
        }
        const receiptsData = await receiptsResponse.json();
        setReceipts(receiptsData);
        setFilteredReceipts(receiptsData);
        
        // Load suppliers
        const suppliersResponse = await fetch(`${backendUrl}/api/suppliers`);
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          // Create suppliers map for easy lookup
          const suppliersMap = {};
          suppliersData.forEach(supplier => {
            suppliersMap[supplier.id] = supplier;
          });
          setSuppliers(suppliersMap);
        }
        
        setError('');
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Onaylanmış makbuzlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter receipts based on search, status and currency
  useEffect(() => {
    let filtered = receipts;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(receipt => 
            new Date(receipt.signed_at || receipt.date) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(receipt => 
            new Date(receipt.signed_at || receipt.date) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(receipt => 
            new Date(receipt.signed_at || receipt.date) >= filterDate
          );
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          filtered = filtered.filter(receipt => 
            new Date(receipt.signed_at || receipt.date) >= filterDate
          );
          break;
      }
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
    
    // Date range filter
    if (startDate && endDate) {
      filtered = filtered.filter(receipt => {
        const receiptDate = new Date(receipt.signed_at || receipt.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include end date
        return receiptDate >= start && receiptDate <= end;
      });
    }
    
    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, statusFilter, dateFilter, currencyFilter, startDate, endDate]);

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

  // Convert amount to TRY using exchange rates
  const convertToTRY = (amount, currency) => {
    if (currency === 'TRY') return amount;
    if (!exchangeRates || !exchangeRates[currency]) {
      console.log(`No exchange rate found for ${currency}`, exchangeRates);
      return amount; // Fallback - return original amount
    }
    // Use selling rate to convert foreign currency to TRY
    const rate = exchangeRates[currency].selling;
    console.log(`Converting ${amount} ${currency} to TRY using rate ${rate}`);
    return amount * rate;
  };

  // Calculate totals - ALWAYS show in TRY for summary cards
  const calculateTotals = () => {
    let receiptsToCalculate = filteredReceipts;
    
    // If specific currency is selected, filter by that currency
    if (currencyFilter !== 'all') {
      receiptsToCalculate = filteredReceipts.filter(r => r.currency === currencyFilter);
    }
    
    // Always calculate totals in TRY using current exchange rates
    const totalInTRY = receiptsToCalculate.reduce((sum, receipt) => {
      return sum + convertToTRY(receipt.amount, receipt.currency);
    }, 0);
    
    return {
      total: totalInTRY,
      average: receiptsToCalculate.length > 0 ? totalInTRY / receiptsToCalculate.length : 0,
      currency: 'TRY',
      displayCurrency: '₺'
    };
  };

  const totals = calculateTotals();

  // Handle payment action - show modal first
  // Check if user can make payments (Admin, Super Admin, or Muhasebe department)
  const canMakePayments = () => {
    if (!user) return false;
    return user.role === 'super-admin' || 
           user.role === 'admin' || 
           user.department === 'Muhasebe';
  };

  const handlePayment = (receipt) => {
    setSelectedReceipt(receipt);
    setShowPaymentModal(true);
  };

  // Confirm payment
  const confirmPayment = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://prospect-manager-6.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/expense-receipts/${selectedReceipt.id}/payment`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Remove from approved receipts list (it's now paid)
        setReceipts(receipts.filter(r => r.id !== selectedReceipt.id));
        setShowPaymentModal(false);
        
        // Show standard success format
        setSuccessData({
          title: 'Tebrikler, Ödeme İşlemi Başarıyla Tamamlandı!',
          subtitle: `${selectedReceipt.receipt_number} numaralı gider makbuzu ödendi olarak işaretlendi ve "Ödenmiş Makbuzlar" bölümüne taşındı.`,
          receiptNumber: selectedReceipt.receipt_number,
          supplier: selectedReceipt.supplier_name,
          amount: formatCurrency(selectedReceipt.amount, selectedReceipt.currency),
          status: 'Ödendi'
        });
        setShowStandardSuccess(true);
        setSelectedReceipt(null);
      } else {
        throw new Error(result.message || 'Ödeme işlemi başarısız');
      }
    } catch (error) {
      console.error('Error marking as paid:', error);
      alert('Ödeme işlemi sırasında hata oluştu: ' + error.message);
    }
  };

  // Removed duplicate canMakePayments function

  // Handle view receipt
  const handleViewReceipt = (receipt) => {
    alert(`Makbuz görüntüleme: ${receipt.receipt_number}`);
  };

  // Handle edit receipt
  const handleEditReceipt = (receipt) => {
    alert(`Makbuz düzenleme: ${receipt.receipt_number}`);
  };

  // Handle bank info click
  const handleBankInfoClick = (receipt) => {
    const supplier = suppliers[receipt.supplier_id];
    if (supplier) {
      setSelectedBankInfo({
        supplier_name: supplier.name,
        bank_name: supplier.bank_name,
        iban: supplier.iban,
        swift_code: supplier.swift_code,
        bank_address: supplier.bank_address,
        is_usa_bank: supplier.is_usa_bank,
        usa_routing_number: supplier.usa_routing_number,
        usa_account_number: supplier.usa_account_number,
        usa_bank_address: supplier.usa_bank_address
      });
      setShowBankInfoModal(true);
    }
  };

  // Copy bank info to clipboard
  const copyBankInfo = (info) => {
    let textToCopy = '';
    
    if (info.is_usa_bank) {
      textToCopy = `Banka: ${info.bank_name}
Routing Number: ${info.usa_routing_number}
Account Number: ${info.usa_account_number}
Adres: ${info.usa_bank_address}`;
    } else {
      textToCopy = `Banka: ${info.bank_name}
IBAN: ${info.iban}
Swift: ${info.swift_code}`;
    }
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Banka bilgileri kopyalandı!');
    }).catch(() => {
      alert('Kopyalama başarısız!');
    });
  };

  // Handle delete receipt
  const handleDeleteReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowDeleteModal(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://prospect-manager-6.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/expense-receipts/${selectedReceipt.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://prospect-manager-6.preview.emergentagent.com';
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

  // Total calculation handled in calculateTotals function

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileCheck className="w-8 h-8 mr-3 text-green-600" />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{filteredReceipts.length}</h2>
              <p className="text-green-100">Onaylanmış Makbuz</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {totals.displayCurrency} {totals.total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
              </h2>
              <p className="text-yellow-100">Ödeme Bekleyen Tutar</p>
            </div>
            <CreditCard className="w-8 h-8 text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {totals.displayCurrency} {totals.average.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
              </h2>
              <p className="text-purple-100">Ort. Makbuz</p>
            </div>
            <Building className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {new Set(filteredReceipts.map(r => r.supplier_id)).size}
              </h2>
              <p className="text-blue-100">Tedarikçi</p>
            </div>
            <Building className="w-8 h-8 text-blue-200" />
          </div>
        </div>
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
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Makbuz no, tedarikçi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="pending">Onay Bekleyen</option>
            <option value="approved">Onaylandı</option>
            <option value="paid">Ödendi</option>
          </select>

          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-28"
          >
            <option value="all">Para Birimi</option>
            {availableCurrencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">Tüm Zamanlar</option>
            <option value="today">Bugün</option>
            <option value="week">Son 7 Gün</option>
            <option value="month">Son Ay</option>
            <option value="year">Son Yıl</option>
          </select>

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Başlangıç"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              placeholder="Bitiş"
            />
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
                    Sıra No
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
                        {suppliers[receipt.supplier_id] ? (
                          <button
                            onClick={() => handleBankInfoClick(receipt)}
                            className="text-left hover:bg-gray-100 p-2 rounded transition-colors cursor-pointer w-full"
                          >
                            <div className="font-medium text-blue-600">
                              {suppliers[receipt.supplier_id].bank_name || 'Banka Bilgisi Yok'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Detaylar için tıklayın
                            </div>
                          </button>
                        ) : (
                          <div className="text-gray-500">Yükleniyor...</div>
                        )}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="ornek@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Konu</label>
                <input
                  type="text"
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                <textarea
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {showPaymentModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ödeme Onayı</h3>
            
            {/* Receipt Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Makbuz No:</span>
                  <span className="font-medium">{selectedReceipt.receipt_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tedarikçi:</span>
                  <span className="font-medium">{selectedReceipt.supplier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tutar:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              <strong>Ödemeyi tamamla</strong> butonuna basarak bu gider makbuzunu 
              ödenmiş olarak işaretleyeceksin, onaylıyor musun?
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedReceipt(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={confirmPayment}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
              >
                ÖDEMEYİ TAMAMLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Standard Success Format */}
      {showStandardSuccess && successData && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-8">
              {/* Success Icon */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                
                {/* Success Title */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{successData.title}</h1>
                <p className="text-gray-600">{successData.subtitle}</p>
              </div>

              {/* Data Summary Section */}
              <div className="bg-green-50 rounded-lg p-6 mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Makbuz No:</span>
                    <span className="font-medium text-right">{successData.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tedarikçi:</span>
                    <span className="font-medium text-right">{successData.supplier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Tutar:</span>
                    <span className="font-medium text-right">{successData.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Durum:</span>
                    <span className="font-medium text-green-600 text-right">{successData.status}</span>
                  </div>
                </div>
              </div>

              {/* Informational Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-blue-800 text-sm">
                    Makbuz başarıyla ödenmiş olarak işaretlendi. Artık "Ödenmiş Makbuzlar" bölümünde görüntüleyebilirsiniz.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => onNewExpenseReceipt()}
                  className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <DollarSign className="w-5 h-5 mr-2" />
                  Yeni Makbuz Oluştur
                </button>
                
                <button
                  onClick={() => {
                    setShowStandardSuccess(false);
                    // TODO: Navigate to Paid Receipts page
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Ödenmiş Makbuzları Görüntüle
                </button>
                
                <button
                  onClick={() => {
                    setShowStandardSuccess(false);
                    onBackToDashboard();
                  }}
                  className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Dashboard'a Dön
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Info Modal */}
      {showBankInfoModal && selectedBankInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Banka Bilgileri</h3>
              <button
                onClick={() => setShowBankInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {selectedBankInfo.supplier_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adı</label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                  {selectedBankInfo.bank_name}
                </div>
              </div>

              {selectedBankInfo.is_usa_bank ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number</label>
                    <div className="flex items-center">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {selectedBankInfo.usa_routing_number}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedBankInfo.usa_routing_number)}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <div className="flex items-center">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {selectedBankInfo.usa_account_number}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedBankInfo.usa_account_number)}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Banka Adresi</label>
                    <div className="flex items-center">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {selectedBankInfo.usa_bank_address}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedBankInfo.usa_bank_address)}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
                    <div className="flex items-center">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm break-all">
                        {selectedBankInfo.iban}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedBankInfo.iban)}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Swift Kodu</label>
                    <div className="flex items-center">
                      <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                        {selectedBankInfo.swift_code}
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedBankInfo.swift_code)}
                        className="ml-2 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => copyBankInfo(selectedBankInfo)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Tümünü Kopyala
              </button>
              <button
                onClick={() => setShowBankInfoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedExpenseReceiptsPage;