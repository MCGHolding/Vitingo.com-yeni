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
  FileCheck,
  User,
  Building
} from 'lucide-react';

const CollectionReceiptPage = ({ onBackToDashboard, onNewReceipt }) => {
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Removed manual receipt creation - receipts are auto-generated when payments are received

  // Load receipts on component mount
  useEffect(() => {
    loadReceipts();
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
            onClick={() => {
              setShowCreateModal(true);
              loadMockPaymentData(); // Refresh payment data when opening modal
            }}
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
              <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Makbuz Düzenleyen Bilgileri
                </h4>
                <p className="text-sm text-blue-600 mb-4">Bu bilgiler giriş yapan kullanıcıya göre otomatik doldurulmuştur</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ad Soyad</label>
                    <Input
                      type="text"
                      value={formData.issuer_name}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ünvan</label>
                    <Input
                      type="text"
                      value={formData.issuer_title}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şirket Bilgileri</label>
                  <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                    <div><strong>Şirket:</strong> {formData.company_name}</div>
                    <div><strong>Adres:</strong> {formData.company_address}</div>
                    <div><strong>Tel:</strong> {formData.company_phone} | <strong>E-posta:</strong> {formData.company_email}</div>
                  </div>
                </div>
              </div>

              {/* Ödeyen Bilgileri */}
              <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-green-500">
                <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-green-600" />
                  Ödeme Yapan Bilgileri
                </h4>
                <p className="text-sm text-green-600 mb-4">Bu bilgiler ödemeyi yapan müşteri/tedarikçiye göre otomatik doldurulmuştur</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ödeyen Ad/Şirket</label>
                    <Input
                      type="text"
                      value={formData.payer_name}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">E-posta</label>
                    <Input
                      type="email"
                      value={formData.payer_email}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Sebebi</label>
                  <Input
                    type="text"
                    value={formData.payment_reason}
                    disabled={true}
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Ödeme Detayları */}
              <div className="bg-green-50 p-4 rounded-lg border-l-4 border-purple-500">
                <h4 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
                  Ödeme Detayları
                </h4>
                <p className="text-sm text-purple-600 mb-4">Bu bilgiler alınan ödemeye göre otomatik doldurulmuştur</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Banknote className="inline h-4 w-4 mr-1" />
                      Nakit (₺)
                    </label>
                    <Input
                      type="number"
                      value={formData.payment_details.cash_amount}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CreditCard className="inline h-4 w-4 mr-1" />
                      Kredi Kartı (₺)
                    </label>
                    <Input
                      type="number"
                      value={formData.payment_details.credit_card_amount}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileCheck className="inline h-4 w-4 mr-1" />
                      Çek (₺)
                    </label>
                    <Input
                      type="number"
                      value={formData.payment_details.check_amount}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="inline h-4 w-4 mr-1" />
                      Senet (₺)
                    </label>
                    <Input
                      type="number"
                      value={formData.payment_details.promissory_note_amount}
                      disabled={true}
                      className="bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Çek Detayları */}
                {formData.payment_details.check_details && formData.payment_details.check_details.length > 0 && (
                  <div className="mt-6">
                    <h5 className="text-md font-medium text-gray-900 mb-3">Çek Detayları</h5>
                    <div className="bg-white p-4 rounded border">
                      {formData.payment_details.check_details.map((check, index) => (
                        <div key={index} className="mb-3 p-3 bg-gray-50 rounded">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div><strong>Banka:</strong> {check.bank}</div>
                            <div><strong>Şube:</strong> {check.branch}</div>
                            <div><strong>Çek No:</strong> {check.check_number}</div>
                            <div><strong>Hesap/IBAN:</strong> {check.account_iban}</div>
                            <div><strong>Tarih:</strong> {check.check_date}</div>
                            <div><strong>Tutar:</strong> ₺{formatNumber(check.amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 p-4 bg-white rounded border">
                  <div className="text-lg font-semibold text-gray-900">
                    Toplam Tutar: <span className="text-blue-600">₺{formatNumber(formData.total_amount)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Nakit: ₺{formatNumber(formData.payment_details.cash_amount)} + 
                    Kredi Kartı: ₺{formatNumber(formData.payment_details.credit_card_amount)} + 
                    Çek: ₺{formatNumber(formData.payment_details.check_amount)} + 
                    Senet: ₺{formatNumber(formData.payment_details.promissory_note_amount)}
                  </p>
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
                  disabled={formData.total_amount <= 0}
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Tahsilat Makbuzunu Oluştur ve Gönder
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