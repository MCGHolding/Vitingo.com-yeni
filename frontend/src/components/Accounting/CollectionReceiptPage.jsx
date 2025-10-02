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
  TrendingUp
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

      {/* Modal removed - Collection receipts are auto-generated when payments are received */}
    </div>
  );
};

export default CollectionReceiptPage;