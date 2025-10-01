import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Receipt,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Eye,
  Download,
  Plus,
  X,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  CreditCard,
  Banknote,
  FileCheck
} from 'lucide-react';

const CollectionReceiptPage = ({ onBackToDashboard, onNewReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Current user data (should come from auth context in real app)
  const [currentUser, setCurrentUser] = useState({
    name: 'Murat Başaran',
    title: 'Mali Müşavir',
    company_name: 'Vitingo CRM Ltd. Şti.',
    company_address: 'Maslak Mahallesi, Büyükdere Cad. No:123, 34485 Sarıyer/İstanbul',
    company_phone: '+90 212 555 0000',
    company_email: 'info@vitingo.com'
  });

  // Selected payment/customer data (will be passed as props in real usage)
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form state for new receipt
  const [formData, setFormData] = useState({
    issuer_name: currentUser.name,
    issuer_title: currentUser.title,
    company_name: currentUser.company_name,
    company_address: currentUser.company_address,
    company_phone: currentUser.company_phone,
    company_email: currentUser.company_email,
    payer_name: '',
    payer_email: '',
    payment_reason: '',
    total_amount: 0,
    payment_details: {
      cash_amount: 0,
      credit_card_amount: 0,
      check_amount: 0,
      promissory_note_amount: 0,
      check_details: []
    }
  });

  // Load receipts and user data on component mount
  useEffect(() => {
    loadReceipts();
    loadCurrentUser();
    loadMockPaymentData();
  }, []);

  const loadCurrentUser = async () => {
    // In real app, this would come from auth context or API
    try {
      // Mock current user data
      const user = {
        name: 'Murat Başaran',
        title: 'Mali Müşavir',
        company_name: 'Vitingo CRM Ltd. Şti.',
        company_address: 'Maslak Mahallesi, Büyükdere Cad. No:123, 34485 Sarıyer/İstanbul',
        company_phone: '+90 212 555 0000',
        company_email: 'info@vitingo.com'
      };
      setCurrentUser(user);
      
      // Update form data with user info
      setFormData(prev => ({
        ...prev,
        issuer_name: user.name,
        issuer_title: user.title,
        company_name: user.company_name,
        company_address: user.company_address,
        company_phone: user.company_phone,
        company_email: user.company_email
      }));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadMockPaymentData = async () => {
    // In real app, this would come from the payment that triggered receipt creation
    try {
      const mockCustomer = {
        id: 'cust_001',
        name: 'ABC İnşaat A.Ş.',
        email: 'muhasebe@abcinsaat.com.tr',
        phone: '+90 212 555 1234',
        address: 'Levent Mahallesi, İstanbul'
      };
      
      const mockPayment = {
        id: 'pay_001',
        customer_id: 'cust_001',
        invoice_number: 'VIT-2024-001',
        payment_reason: 'Fatura No: VIT-2024-001 - Yazılım Geliştirme Hizmeti Ödemesi',
        total_amount: 15750.00,
        payment_details: {
          cash_amount: 5000.00,
          credit_card_amount: 7500.00,
          check_amount: 3250.00,
          promissory_note_amount: 0.00,
          check_details: [
            {
              bank: 'Garanti Bankası',
              branch: 'Maslak Şubesi', 
              account_iban: 'TR12 0006 2000 2600 0006 2972 75',
              check_number: '4567890',
              check_date: '2024-11-15',
              amount: 3250.00
            }
          ]
        }
      };
      
      setSelectedCustomer(mockCustomer);
      setSelectedPayment(mockPayment);
      
      // Update form data with payment and customer info
      setFormData(prev => ({
        ...prev,
        payer_name: mockCustomer.name,
        payer_email: mockCustomer.email,
        payment_reason: mockPayment.payment_reason,
        total_amount: mockPayment.total_amount,
        payment_details: mockPayment.payment_details
      }));
    } catch (error) {
      console.error('Error loading payment data:', error);
    }
  };

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts`);
      
      if (response.ok) {
        const receiptData = await response.json();
        console.log('Loaded collection receipts:', receiptData);
        setReceipts(receiptData);
      } else {
        console.error('Failed to load collection receipts:', response.statusText);
        setReceipts([]);
      }
    } catch (error) {
      console.error('Error loading collection receipts:', error);
      setReceipts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number for display
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0,00';
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get status display
  const getStatusDisplay = (status) => {
    const statusMap = {
      'pending': { text: 'İmza Bekliyor', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'signed': { text: 'İmzalandı', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'rejected': { text: 'Reddedildi', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return statusMap[status] || statusMap['pending'];
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...receipts];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(receipt => 
        receipt.receipt_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        receipt.payer_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        receipt.payment_reason.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(receipt => receipt.signature_status === filters.status);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(receipt => receipt.issue_date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(receipt => receipt.issue_date <= filters.dateTo);
    }

    setFilteredReceipts(filtered);
  }, [filters, receipts]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleFormChange = (field, value) => {
    if (field.includes('payment_details.')) {
      const detailField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        payment_details: {
          ...prev.payment_details,
          [detailField]: parseFloat(value) || 0
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // Calculate total amount automatically
  useEffect(() => {
    const total = 
      (formData.payment_details.cash_amount || 0) +
      (formData.payment_details.credit_card_amount || 0) +
      (formData.payment_details.check_amount || 0) +
      (formData.payment_details.promissory_note_amount || 0);
    
    setFormData(prev => ({
      ...prev,
      total_amount: total
    }));
  }, [formData.payment_details]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const newReceipt = await response.json();
        console.log('Collection receipt created:', newReceipt);
        
        // Refresh receipts list
        await loadReceipts();
        
        // Close modal and reset form
        setShowCreateModal(false);
        setFormData({
          issuer_name: '',
          issuer_title: '',
          company_name: 'Vitingo CRM Ltd. Şti.',
          company_address: 'İstanbul, Türkiye',
          company_phone: '+90 212 555 0000',
          company_email: 'info@vitingo.com',
          payer_name: '',
          payer_email: '',
          payment_reason: '',
          total_amount: 0,
          payment_details: {
            cash_amount: 0,
            credit_card_amount: 0,
            check_amount: 0,
            promissory_note_amount: 0,
            check_details: []
          }
        });
        
        alert('Tahsilat makbuzu oluşturuldu ve imzalama için gönderildi!');
      } else {
        const error = await response.text();
        console.error('Failed to create collection receipt:', error);
        alert('Tahsilat makbuzu oluşturulamadı: ' + error);
      }
    } catch (error) {
      console.error('Error creating collection receipt:', error);
      alert('Hata oluştu: ' + error.message);
    }
  };

  const downloadReceiptPDF = async (receipt) => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts/${receipt.id}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tahsilat_Makbuzu_${receipt.receipt_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('PDF dosyası indirilemedi');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('PDF indirme hatası: ' + error.message);
    }
  };

  // Calculate statistics
  const totalReceipts = receipts.length;
  const pendingReceipts = receipts.filter(r => r.signature_status === 'pending').length;
  const signedReceipts = receipts.filter(r => r.signature_status === 'signed').length;
  const totalAmount = receipts.reduce((sum, receipt) => sum + (receipt.total_amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Receipt className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tahsilat Makbuzları</h1>
            <p className="text-gray-600">{filteredReceipts.length} makbuz bulundu</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Tahsilat Makbuzu
          </Button>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard'a Dön
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Makbuz</p>
              <p className="text-2xl font-bold text-gray-900">{totalReceipts}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">İmza Bekleyen</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingReceipts}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">İmzalanan</p>
              <p className="text-2xl font-bold text-green-600">{signedReceipts}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
              <p className="text-2xl font-bold text-blue-600">₺{formatNumber(totalAmount)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Arama
            </label>
            <Input
              type="text"
              placeholder="Makbuz no., ödeyen adı..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">İmza Bekleyen</option>
              <option value="signed">İmzalanan</option>
              <option value="rejected">Reddedilen</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Başlangıç Tarihi
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Bitiş Tarihi
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={clearFilters}
            variant="outline"
            size="sm"
          >
            Filtreleri Temizle
          </Button>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Tahsilat Makbuzları ({filteredReceipts.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Makbuz No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeyen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme Sebebi
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Tahsilat makbuzları yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Tahsilat makbuzu bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {receipts.length === 0 ? 'Henüz tahsilat makbuzu oluşturulmamış' : 'Filtre kriterlerinize uygun makbuz bulunamadı'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt, index) => {
                  const statusInfo = getStatusDisplay(receipt.signature_status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={receipt.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-700">
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono font-medium text-blue-600">
                          {receipt.receipt_number}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {receipt.payer_name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {receipt.payment_reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₺{formatNumber(receipt.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(receipt.issue_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => downloadReceiptPDF(receipt)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="PDF İndir"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Receipt Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Yeni Tahsilat Makbuzu</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Düzenleyen Bilgileri */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Makbuz Düzenleyen Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad *</label>
                    <Input
                      type="text"
                      required
                      value={formData.issuer_name}
                      onChange={(e) => handleFormChange('issuer_name', e.target.value)}
                      placeholder="Makbuz düzenleyen kişinin adı soyadı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ünvan *</label>
                    <Input
                      type="text"
                      required
                      value={formData.issuer_title}
                      onChange={(e) => handleFormChange('issuer_title', e.target.value)}
                      placeholder="Muhasebe Uzmanı, Mali Müşavir, vb."
                    />
                  </div>
                </div>
              </div>

              {/* Ödeyen Bilgileri */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Ödeme Yapan Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ödeyen Ad/Şirket *</label>
                    <Input
                      type="text"
                      required
                      value={formData.payer_name}
                      onChange={(e) => handleFormChange('payer_name', e.target.value)}
                      placeholder="Ödeme yapan kişi veya şirket adı"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta *</label>
                    <Input
                      type="email"
                      required
                      value={formData.payer_email}
                      onChange={(e) => handleFormChange('payer_email', e.target.value)}
                      placeholder="Makbuz gönderilecek e-posta adresi"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Sebebi *</label>
                  <Input
                    type="text"
                    required
                    value={formData.payment_reason}
                    onChange={(e) => handleFormChange('payment_reason', e.target.value)}
                    placeholder="Fatura ödemesi, hizmet bedeli, vb."
                  />
                </div>
              </div>

              {/* Ödeme Detayları */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Ödeme Detayları</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Banknote className="inline h-4 w-4 mr-1" />
                      Nakit (₺)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.payment_details.cash_amount}
                      onChange={(e) => handleFormChange('payment_details.cash_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="inline h-4 w-4 mr-1" />
                      Kredi Kartı (₺)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.payment_details.credit_card_amount}
                      onChange={(e) => handleFormChange('payment_details.credit_card_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileCheck className="inline h-4 w-4 mr-1" />
                      Çek (₺)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.payment_details.check_amount}
                      onChange={(e) => handleFormChange('payment_details.check_amount', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline h-4 w-4 mr-1" />
                      Senet (₺)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.payment_details.promissory_note_amount}
                      onChange={(e) => handleFormChange('payment_details.promissory_note_amount', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white rounded border">
                  <div className="text-lg font-semibold text-gray-900">
                    Toplam Tutar: <span className="text-blue-600">₺{formatNumber(formData.total_amount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  variant="outline"
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!formData.payer_name || !formData.payer_email || !formData.payment_reason || formData.total_amount <= 0}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Makbuzu Oluştur ve Gönder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionReceiptPage;