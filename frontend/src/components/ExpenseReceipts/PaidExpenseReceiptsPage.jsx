import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Eye, CheckCircle2, Calendar, Building, Mail, FileCheck } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../contexts/AuthContext';

const PaidExpenseReceiptsPage = ({ onBackToDashboard, onNewExpenseReceipt }) => {
  const { exchangeRates, formatCurrency: formatCurrencyHook } = useCurrency();
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suppliers, setSuppliers] = useState({});

  // Modal states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    message: '',
    recipient_name: '',
    recipient_company: ''
  });

  // Load paid expense receipts and suppliers from backend
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://statement-tool.preview.emergentagent.com';
        
        // Load receipts
        const receiptsResponse = await fetch(`${backendUrl}/api/expense-receipts?status=paid`);
        if (!receiptsResponse.ok) {
          throw new Error('Failed to fetch paid expense receipts');
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
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Makbuzlar yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter receipts based on search, status, date and currency
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
        const receiptDate = new Date(receipt.paid_at || receipt.date);
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
    if (!exchangeRates || !exchangeRates[currency]) return amount;
    return amount * exchangeRates[currency];
  };

  // Handle view receipt
  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    setShowViewModal(true);
  };

  // Removed edit and delete functionality for paid receipts

  // Handle send email
  const handleSendEmail = (receipt) => {
    setSelectedReceipt(receipt);
    
    // Get supplier info from database
    const supplier = suppliers[receipt.supplier_id];
    let recipientEmail = '';
    let recipientName = '';
    let recipientCompany = '';
    
    // Debug info (remove in production)
    // console.log('Receipt supplier_id:', receipt.supplier_id);
    
    if (supplier) {
      // First, try to get contact info if available
      if (supplier.contacts && supplier.contacts.length > 0) {
        const primaryContact = supplier.contacts[0]; // Get first contact
        recipientEmail = primaryContact.email || '';
        recipientName = primaryContact.name || '';
        recipientCompany = supplier.name || '';
        // console.log('Using primary contact:', primaryContact);
      } else {
        // Fallback to supplier info
        recipientEmail = supplier.email || '';
        recipientName = supplier.authorized_person_name || supplier.company_short_name || supplier.name || '';
        recipientCompany = supplier.company_title || supplier.name || '';
        // console.log('Using supplier fallback info');
      }
    } else {
      // console.log('No supplier found for ID:', receipt.supplier_id);
    }
    
    setEmailForm({
      to: recipientEmail,
      subject: `Gider Makbuzu: ${receipt.receipt_number}`,
      message: '', // Mesaj artık template'de otomatik oluşturuluyor
      recipient_name: recipientName,
      recipient_company: recipientCompany
    });
    setShowEmailModal(true);
  };

  // Send email
  const sendEmail = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://statement-tool.preview.emergentagent.com';
      const response = await fetch(`${backendUrl}/api/send-expense-receipt-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emailForm,
          receipt_id: selectedReceipt.id,
          sender_name: user?.fullName || 'Kullanıcı'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setShowEmailModal(false);
        setEmailForm({ to: '', subject: '', message: '', recipient_name: '', recipient_company: '' });
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

  // Calculate totals based on currency filter
  const calculateTotals = () => {
    let receiptsToCalculate = filteredReceipts;
    
    // If specific currency is selected, filter by that currency
    if (currencyFilter !== 'all') {
      receiptsToCalculate = filteredReceipts.filter(r => r.currency === currencyFilter);
    }
    
    if (currencyFilter === 'all') {
      // For "all currencies", show total in TRY
      const totalInTRY = receiptsToCalculate.reduce((sum, receipt) => {
        return sum + convertToTRY(receipt.amount, receipt.currency);
      }, 0);
      return {
        total: totalInTRY,
        average: receiptsToCalculate.length > 0 ? totalInTRY / receiptsToCalculate.length : 0,
        currency: 'TRY',
        displayCurrency: '₺'
      };
    } else {
      // For specific currency, show in that currency
      const total = receiptsToCalculate.reduce((sum, receipt) => sum + receipt.amount, 0);
      const symbols = { 'USD': '$', 'EUR': '€', 'GBP': '£', 'TRY': '₺', 'AED': 'د.إ' };
      return {
        total: total,
        average: receiptsToCalculate.length > 0 ? total / receiptsToCalculate.length : 0,
        currency: currencyFilter,
        displayCurrency: symbols[currencyFilter] || currencyFilter
      };
    }
  };

  const totals = calculateTotals();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileCheck className="w-8 h-8 mr-3 text-green-600" />
              Ödenmiş Makbuzlar
            </h1>
            <p className="text-gray-600 mt-2">Ödenmiş gider makbuzları</p>
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
              <h2 className="text-2xl font-bold">
                {totals.displayCurrency} {totals.total.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
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
                {totals.displayCurrency} {totals.average.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
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
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Makbuz no, tedarikçi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
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
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-28"
          >
            <option value="all">Para Birimi</option>
            {availableCurrencies.map(currency => (
              <option key={currency} value={currency}>{currency}</option>
            ))}
          </select>

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

          <div className="flex items-center space-x-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Başlangıç"
            />
            <span className="text-gray-500">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Bitiş"
            />
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
                    Sıra No
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
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReceipts.map((receipt, index) => (
                  <tr key={receipt.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}
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
                          onClick={() => handleSendEmail(receipt)}
                          className="text-green-600 hover:text-green-900 transition-colors"
                          title="Mail Gönder"
                        >
                          <Mail className="w-4 h-4" />
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

      {/* Removed delete modal for paid receipts */}

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">E-posta Gönder</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alıcı Adı</label>
                  <input
                    type="text"
                    value={emailForm.recipient_name}
                    onChange={(e) => setEmailForm({ ...emailForm, recipient_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Alıcının tam adı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Şirket</label>
                  <input
                    type="text"
                    value={emailForm.recipient_company}
                    onChange={(e) => setEmailForm({ ...emailForm, recipient_company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Şirket adı"
                  />
                </div>
              </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="text-gray-500">Mesaj (Otomatik Template Kullanılacak)</span>
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-600 text-sm">
                  Sayın [Alıcı Adı]<br/>
                  [Şirket Adı]<br/><br/>
                  İmzalamış olduğunuz gider makbuzunun imzalı kopyası ekte sunulmuştur.<br/><br/>
                  İyi çalışmalar dileriz<br/><br/>
                  Vitingo CRM Sistemi
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setEmailForm({ to: '', subject: '', message: '', recipient_name: '', recipient_company: '' });
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

      {/* View Receipt Modal */}
      {showViewModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileCheck className="w-6 h-6 mr-2 text-green-600" />
                  Makbuz Detayları
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Makbuz Numarası</label>
                  <p className="text-lg font-semibold text-blue-600">#{selectedReceipt.receipt_number}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi</label>
                  <p className="text-lg text-gray-900">{selectedReceipt.paid_at ? formatDate(selectedReceipt.paid_at) : 'Bilinmiyor'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tedarikçi</label>
                  <p className="text-lg text-gray-900">{selectedReceipt.supplier_name}</p>
                  {selectedReceipt.supplier_country && (
                    <p className="text-sm text-gray-500">{selectedReceipt.supplier_country}</p>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tutar</label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(selectedReceipt.amount, selectedReceipt.currency)}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                  <p className="text-gray-900">{selectedReceipt.description}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gönderen Banka</label>
                  <p className="text-gray-900">{selectedReceipt.sender_bank_name || 'Bilinmiyor'}</p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Ödendi
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Removed edit modal for paid receipts */}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
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

export default PaidExpenseReceiptsPage;