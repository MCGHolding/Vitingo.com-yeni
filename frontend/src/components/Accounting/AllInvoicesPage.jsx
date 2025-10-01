import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  FileText,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import InvoicePreviewModal from './InvoicePreviewModal';

const AllInvoicesPage = ({ onBackToDashboard, onNewInvoice, onEditInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    currency: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Load invoices from backend
  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/invoices`);
      
      if (response.ok) {
        const invoiceData = await response.json();
        console.log('Loaded invoices:', invoiceData);
        setInvoices(invoiceData);
      } else {
        console.error('Failed to load invoices:', response.statusText);
        // Fallback to empty array
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Fallback to empty array
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Auto-refresh invoices every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadInvoices, 30000);
    return () => clearInterval(interval);
  }, []);

  const currencies = [
    { code: 'all', symbol: '', name: 'Tüm Para Birimleri' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'TL', symbol: '₺', name: 'Turkish Lira' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tüm Durumlar', color: 'bg-gray-100 text-gray-800' },
    { value: 'draft', label: 'Taslak', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'pending', label: 'Beklemede', color: 'bg-blue-100 text-blue-800' },
    { value: 'paid', label: 'Ödendi', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Vadesi Geçti', color: 'bg-red-100 text-red-800' }
  ];

  const formatNumber = (value) => {
    if (!value && value !== 0) return '';
    
    const numStr = value.toString();
    const parts = numStr.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (parts[1]) {
      return `${integerPart},${parts[1]}`;
    }
    
    return integerPart;
  };

  const getCurrencySymbol = (currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : '';
  };

  const getStatusLabel = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...invoices];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number.toLowerCase().includes(filters.search.toLowerCase()) ||
        invoice.customer_name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Currency filter
    if (filters.currency !== 'all') {
      filtered = filtered.filter(invoice => invoice.currency === filters.currency);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filters.status);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => invoice.date >= filters.dateFrom);
    }

    if (filters.dateTo) {
      filtered = filtered.filter(invoice => invoice.date <= filters.dateTo);
    }

    setFilteredInvoices(filtered);
  }, [filters, invoices]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      currency: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  const handleAction = (action, invoice) => {
    switch (action) {
      case 'view':
        setSelectedInvoice(invoice);
        setShowPreviewModal(true);
        break;
      case 'edit':
        if (onEditInvoice) {
          onEditInvoice(invoice);
        }
        break;
      case 'download':
        downloadInvoicePDF(invoice);
        break;
      case 'delete':
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const downloadInvoicePDF = async (invoice) => {
    try {
      console.log('PDF indirme başlatılıyor:', invoice.id);
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      console.log('Backend URL:', backendUrl);
      
      const pdfUrl = `${backendUrl}/api/invoices/${invoice.id}/pdf`;
      console.log('PDF URL:', pdfUrl);
      
      const response = await fetch(pdfUrl);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        const blob = await response.blob();
        console.log('Blob size:', blob.size);
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fatura_${invoice.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        console.log('PDF indirme tamamlandı');
      } else {
        const errorText = await response.text();
        console.error('PDF indirme hatası:', response.status, errorText);
        alert(`PDF dosyası indirilemedi: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('PDF indirme hatası:', error);
      alert(`PDF dosyası indirilemedi: ${error.message}`);
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      console.log('Fatura silme başlatılıyor:', selectedInvoice.id);
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/invoices/${selectedInvoice.id}`, {
        method: 'DELETE',
      });
      
      console.log('Delete response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Delete result:', result);
        
        // Faturayı listeden kaldır
        setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
        alert('Fatura başarıyla silindi');
      } else {
        const errorText = await response.text();
        console.error('Fatura silme hatası:', response.status, errorText);
        alert(`Fatura silinemedi: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(`Fatura silinemedi: ${error.message}`);
    } finally {
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    }
  };

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === 'pending' || invoice.status === 'overdue')
    .reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tüm Faturalar</h1>
            <p className="text-gray-600">{filteredInvoices.length} fatura bulundu</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={onNewInvoice}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Yeni Fatura
          </Button>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
          >
            Dashboard'a Dön
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
              <p className="text-2xl font-bold text-gray-900">₺{formatNumber(totalAmount.toFixed(2))}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tahsil Edilen</p>
              <p className="text-2xl font-bold text-green-600">₺{formatNumber(paidAmount.toFixed(2))}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bekleyen Ödemeler</p>
              <p className="text-2xl font-bold text-orange-600">₺{formatNumber(pendingAmount.toFixed(2))}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-orange-600" />
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Arama
            </label>
            <Input
              type="text"
              placeholder="Fatura no. veya müşteri adı"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
            <select
              value={filters.currency}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
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

      {/* Invoices Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fatura No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
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
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Faturalar yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {invoices.length === 0 ? 'Henüz fatura oluşturulmamış' : 'Filtre kriterlerinize uygun fatura bulunamadı'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="text-sm font-medium text-gray-700">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono font-medium text-blue-600">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.items ? invoice.items.length : 0} kalem
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {getCurrencySymbol(invoice.currency)}{formatNumber(invoice.total.toFixed(2))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAction('view', invoice)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction('edit', invoice)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction('download', invoice)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="İndir"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleAction('delete', invoice)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Fatura bulunamadı</h3>
            <p className="mt-1 text-sm text-gray-500">
              Arama kriterlerinize uygun fatura bulunmuyor.
            </p>
          </div>
        )}
      </div>

      {/* Invoice Preview Modal */}
      {showPreviewModal && selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          onClose={() => {
            setShowPreviewModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Fatura Silme Onayı</h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvoice(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Aşağıdaki faturayı silmek istediğinizden emin misiniz?
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-900">
                  Fatura No: {selectedInvoice.invoice_number}
                </div>
                <div className="text-sm text-gray-600">
                  Müşteri: {selectedInvoice.customer_name}
                </div>
                <div className="text-sm text-gray-600">
                  Tutar: {getCurrencySymbol(selectedInvoice.currency)}{formatNumber(selectedInvoice.total.toFixed(2))}
                </div>
              </div>
              <p className="text-sm text-red-600 mt-2">
                Bu işlem geri alınamaz!
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedInvoice(null);
                }}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                onClick={handleDeleteInvoice}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllInvoicesPage;