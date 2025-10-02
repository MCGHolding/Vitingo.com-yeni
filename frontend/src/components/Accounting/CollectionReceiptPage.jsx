import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Receipt,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Users,
  TrendingUp,
  Edit3,
  MoreHorizontal,
  Mail,
  MessageCircle
} from 'lucide-react';

const CollectionReceiptPage = ({ onBackToDashboard, onNewReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  // Modal states
  const [editingReceipt, setEditingReceipt] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [selectedReceiptForMail, setSelectedReceiptForMail] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Removed manual receipt creation - receipts are auto-generated when payments are received

  // Load receipts and statistics on component mount
  useEffect(() => {
    loadReceipts();
    loadStatistics();
  }, []);

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

  const loadStatistics = async () => {
    setIsLoadingStats(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-statistics`);
      
      if (response.ok) {
        const statsData = await response.json();
        console.log('Loaded collection statistics:', statsData);
        setStatistics(statsData);
      } else {
        console.error('Failed to load collection statistics:', response.statusText);
        setStatistics({
          total_amount_tl: 0.0,
          top_customer: 'Veri Yok',
          total_count: 0,
          average_days: 0.0
        });
      }
    } catch (error) {
      console.error('Error loading collection statistics:', error);
      setStatistics({
        total_amount_tl: 0.0,
        top_customer: 'Veri Yok',
        total_count: 0,
        average_days: 0.0
      });
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Format number for display
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0,00';
    return value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Get payment method display
  const getPaymentMethod = (paymentDetails) => {
    if (!paymentDetails) return 'Bilinmiyor';
    
    const methods = [];
    if (paymentDetails.cash_amount > 0) methods.push('Nakit');
    if (paymentDetails.credit_card_amount > 0) methods.push('Kredi Kartı');
    if (paymentDetails.check_amount > 0) methods.push('Çek');
    if (paymentDetails.promissory_note_amount > 0) methods.push('Senet');
    
    return methods.length > 0 ? methods.join(', ') : 'Bilinmiyor';
  };

  // Get payment location display
  const getPaymentLocation = (paymentDetails) => {
    if (!paymentDetails) return 'Bilinmiyor';
    
    // Check for bank details in check_details
    if (paymentDetails.check_details && paymentDetails.check_details.length > 0) {
      const bank = paymentDetails.check_details[0].bank;
      return bank || 'Banka Bilgisi Yok';
    }
    
    // If cash payment, show "Kasa"
    if (paymentDetails.cash_amount > 0) {
      return 'Kasa';
    }
    
    // For credit card, check, or promissory note without specific bank info
    if (paymentDetails.credit_card_amount > 0) return 'Banka (Kredi Kartı)';
    if (paymentDetails.check_amount > 0) return 'Banka (Çek)';
    if (paymentDetails.promissory_note_amount > 0) return 'Banka (Senet)';
    
    return 'Bilinmiyor';
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
        getPaymentMethod(receipt.payment_details).toLowerCase().includes(filters.search.toLowerCase()) ||
        getPaymentLocation(receipt.payment_details).toLowerCase().includes(filters.search.toLowerCase())
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

  // Manual receipt creation removed - receipts are auto-generated when payments are received

  const downloadReceiptPDF = async (receipt) => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts/${receipt.id}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Fix Turkish characters in filename
        const safeReceiptNumber = receipt.receipt_number.replace(/[ğüşöçıĞÜŞÖÇI]/g, (char) => {
          const map = {'ğ':'g', 'ü':'u', 'ş':'s', 'ö':'o', 'ç':'c', 'ı':'i',
                       'Ğ':'G', 'Ü':'U', 'Ş':'S', 'Ö':'O', 'Ç':'C', 'İ':'I'};
          return map[char] || char;
        });
        a.download = `Tahsilat_Makbuzu_${safeReceiptNumber}.pdf`;
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

  const handleEditReceipt = (receipt) => {
    setEditingReceipt(receipt);
    setShowEditModal(true);
  };

  const handleSendMail = (receipt) => {
    setSelectedReceiptForMail(receipt);
    setShowMailModal(true);
    setOpenDropdownId(null); // Close dropdown after action
  };

  const toggleDropdown = (receiptId) => {
    setOpenDropdownId(openDropdownId === receiptId ? null : receiptId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Calculate local statistics (for fallback)
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
            <p className="text-sm text-blue-600 mt-1">Tahsilat makbuzları ödeme alındığında otomatik oluşturulur</p>
          </div>
        </div>
        <div className="flex space-x-3">
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
        {/* A) TL Cinsinden Toplam Tahsilat Tutarı */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">TL Toplam Tahsilat</p>
              <p className="text-2xl font-bold text-blue-600">
                {isLoadingStats ? '...' : `₺${formatNumber(statistics?.total_amount_tl || totalAmount)}`}
              </p>
              <p className="text-xs text-blue-500 mt-1">TCMB Kurlarıyla Çevrildi</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* B) En Çok Tahsilat Yapan Müşteri */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Çok Tahsilat</p>
              <p className="text-2xl font-bold text-green-600">
                {isLoadingStats ? '...' : (statistics?.top_customer || 'Veri Yok')}
              </p>
              <p className="text-xs text-green-500 mt-1">Müşteri Kısa Adı</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* C) Toplam Tahsilat Adedi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Tahsilat</p>
              <p className="text-2xl font-bold text-purple-600">
                {isLoadingStats ? '...' : (statistics?.total_count || totalReceipts)}
              </p>
              <p className="text-xs text-purple-500 mt-1">Tahsilat Adedi</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Receipt className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* D) Ortalama Tahsilat Vadesi */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ortalama Vade</p>
              <p className="text-2xl font-bold text-orange-600">
                {isLoadingStats ? '...' : `${statistics?.average_days || 0} gün`}
              </p>
              <p className="text-xs text-orange-500 mt-1">Tahsilat Vadesi</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
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
              placeholder="Makbuz no., ödeyen, ödeme şekli..."
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
                  Ödeme Şekli
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme Yeri
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
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Tahsilat makbuzları yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
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
                        <div className="text-sm text-gray-900">
                          {getPaymentMethod(receipt.payment_details)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getPaymentLocation(receipt.payment_details)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₺{formatNumber(receipt.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Tahsil Edildi
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(receipt.issue_date).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center items-center space-x-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditReceipt(receipt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={() => downloadReceiptPDF(receipt)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="PDF İndir"
                          >
                            <Download className="h-4 w-4" />
                          </button>

                          {/* More Actions Menu */}
                          <div className="relative dropdown-container">
                            <button 
                              onClick={() => toggleDropdown(receipt.id)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Daha Fazla İşlem"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openDropdownId === receipt.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                                <button
                                  onClick={() => handleSendMail(receipt)}
                                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                                >
                                  <Mail className="h-4 w-4" />
                                  <span>Mail</span>
                                </button>
                                <button
                                  disabled
                                  className="w-full px-4 py-2 text-left text-sm text-gray-400 cursor-not-allowed flex items-center space-x-2"
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  <span>Mesaj</span>
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* Mail Modal */}
      {showMailModal && selectedReceiptForMail && (
        <MailModal 
          receipt={selectedReceiptForMail}
          onClose={() => {
            setShowMailModal(false);
            setSelectedReceiptForMail(null);
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingReceipt && (
        <EditReceiptModal 
          receipt={editingReceipt}
          onClose={() => {
            setShowEditModal(false);
            setEditingReceipt(null);
          }}
          onSave={(updatedReceipt) => {
            // Update receipt in the list
            setReceipts(prev => prev.map(r => r.id === updatedReceipt.id ? updatedReceipt : r));
            setShowEditModal(false);
            setEditingReceipt(null);
          }}
        />
      )}
    </div>
  );
};

// Mail Modal Component
const MailModal = ({ receipt, onClose }) => {
  const [emailData, setEmailData] = useState({
    to: '',
    subject: `Tahsilat Makbuzu - ${receipt.receipt_number}`,
    message: `Sayın ${receipt.payer_name},\n\n${receipt.receipt_number} numaralı tahsilat makbuzunuz ektedir.\n\nSaygılarımızla,\nVitingo CRM`
  });
  const [isSending, setIsSending] = useState(false);

  const handleSendMail = async () => {
    setIsSending(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts/${receipt.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      });

      if (response.ok) {
        alert('Mail başarıyla gönderildi!');
        onClose();
      } else {
        alert('Mail gönderme hatası!');
      }
    } catch (error) {
      console.error('Error sending mail:', error);
      alert('Mail gönderme hatası: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Tahsilat Makbuzu Gönder</h3>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-posta Adresi
            </label>
            <input
              type="email"
              value={emailData.to}
              onChange={(e) => setEmailData({...emailData, to: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={receipt.payer_email || 'E-posta adresini girin'}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Konu
            </label>
            <input
              type="text"
              value={emailData.subject}
              onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mesaj
            </label>
            <textarea
              value={emailData.message}
              onChange={(e) => setEmailData({...emailData, message: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSending}
          >
            İptal
          </Button>
          <Button
            onClick={handleSendMail}
            disabled={isSending || !emailData.to}
          >
            {isSending ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Edit Receipt Modal Component  
const EditReceiptModal = ({ receipt, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    issuer_name: receipt.issuer_name || '',
    issuer_title: receipt.issuer_title || '',
    company_name: receipt.company_name || '',
    company_address: receipt.company_address || '',
    company_phone: receipt.company_phone || '',
    company_email: receipt.company_email || '',
    payer_name: receipt.payer_name || '',
    payer_email: receipt.payer_email || '',
    payment_reason: receipt.payment_reason || '',
    total_amount: receipt.total_amount || 0,
    payment_details: {
      cash_amount: receipt.payment_details?.cash_amount || 0,
      credit_card_amount: receipt.payment_details?.credit_card_amount || 0,
      check_amount: receipt.payment_details?.check_amount || 0,
      promissory_note_amount: receipt.payment_details?.promissory_note_amount || 0,
      check_details: receipt.payment_details?.check_details || []
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/collection-receipts/${receipt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedReceipt = await response.json();
        onSave(updatedReceipt);
        alert('Tahsilat makbuzu başarıyla güncellendi!');
      } else {
        alert('Güncelleme hatası!');
      }
    } catch (error) {
      console.error('Error updating receipt:', error);
      alert('Güncelleme hatası: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Tahsilat Makbuzunu Düzenle - {receipt.receipt_number}
          </h3>
        </div>
        
        <div className="px-6 py-4 space-y-6">
          {/* Issuer Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Makbuz Düzenleyen Bilgileri</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  value={formData.issuer_name}
                  onChange={(e) => setFormData({...formData, issuer_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                <input
                  type="text"
                  value={formData.issuer_title}
                  onChange={(e) => setFormData({...formData, issuer_title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Şirket Bilgileri</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Ünvanı</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Şirket Adresi</label>
                <textarea
                  value={formData.company_address}
                  onChange={(e) => setFormData({...formData, company_address: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={formData.company_phone}
                    onChange={(e) => setFormData({...formData, company_phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <input
                    type="email"
                    value={formData.company_email}
                    onChange={(e) => setFormData({...formData, company_email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payer Information */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Ödeme Yapan Bilgileri</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeyen Adı</label>
                <input
                  type="text"
                  value={formData.payer_name}
                  onChange={(e) => setFormData({...formData, payer_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                <input
                  type="email"
                  value={formData.payer_email}
                  onChange={(e) => setFormData({...formData, payer_email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Ödeme Detayları</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Sebebi</label>
                <input
                  type="text"
                  value={formData.payment_reason}
                  onChange={(e) => setFormData({...formData, payment_reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nakit Tutar</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_details.cash_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      payment_details: {...formData.payment_details, cash_amount: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kredi Kartı</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_details.credit_card_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      payment_details: {...formData.payment_details, credit_card_amount: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çek Tutarı</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_details.check_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      payment_details: {...formData.payment_details, check_amount: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senet Tutarı</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.payment_details.promissory_note_amount}
                    onChange={(e) => setFormData({
                      ...formData, 
                      payment_details: {...formData.payment_details, promissory_note_amount: parseFloat(e.target.value) || 0}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Toplam Tutar</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.total_amount}
                  onChange={(e) => setFormData({...formData, total_amount: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CollectionReceiptPage;