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
  X,
  MoreVertical,
  XCircle,
  Mail,
  MessageSquare,
  CreditCard,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import InvoicePreviewModal from './InvoicePreviewModal';

const PaidInvoicesPage = ({ onBackToDashboard, onNewInvoice, onEditInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    currency: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Load paid invoices from backend
  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/invoices`);
      
      if (response.ok) {
        const invoiceData = await response.json();
        // Filter for paid invoices only
        const paidInvoices = invoiceData.filter(invoice => 
          invoice.status === 'paid'
        );
        console.log('Loaded paid invoices:', paidInvoices);
        setInvoices(paidInvoices);
      } else {
        console.error('Failed to load invoices:', response.statusText);
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
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
      
      const pdfUrl = `${backendUrl}/api/invoices/${invoice.id}/pdf`;
      const response = await fetch(pdfUrl);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Fatura_${invoice.invoice_number}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorText = await response.text();
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
        
        // Modal içeriğini başarı mesajına çevir
        setDeleteSuccess(true);
      } else {
        const errorText = await response.text();
        console.error('Fatura silme hatası:', response.status, errorText);
        alert(`Fatura silinemedi: ${response.status} - ${errorText}`);
        setShowDeleteModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(`Fatura silinemedi: ${error.message}`);
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteSuccess(false);
    setSelectedInvoice(null);
  };

  const handleDropdownAction = (action, invoice) => {
    setOpenDropdownId(null); // Close dropdown
    
    switch (action) {
      case 'mail':
        console.log('Mail action:', invoice);
        alert(`${invoice.invoice_number} numaralı fatura mail ile gönderilecek`);
        break;
      case 'message':
        console.log('Mesaj action:', invoice);
        alert(`${invoice.invoice_number} numaralı fatura için mesaj gönderilecek`);
        break;
      case 'payment-request':
        console.log('Ödeme talebi action:', invoice);
        alert(`${invoice.invoice_number} numaralı fatura için ödeme talebi gönderilecek`);
        break;
      case 'delete':
        setSelectedInvoice(invoice);
        setShowDeleteModal(true);
        break;
      default:
        console.log('Unknown dropdown action:', action);
    }
  };

  const toggleDropdown = (invoiceId) => {
    setOpenDropdownId(openDropdownId === invoiceId ? null : invoiceId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };
    
    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId]);

  // Calculate statistics
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total || invoice.amount || 0), 0);
  const totalCount = filteredInvoices.length;
  
  // All are paid, so collected amount is total and pending is 0
  const collectedAmount = totalAmount;
  const pendingAmount = 0;
  
  // For paid invoices, overdue would be 0 as they're already paid
  const overdueAmount = 0;
  const overdueCount = 0;

  // Calculate this month's payments
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthAmount = filteredInvoices
    .filter(invoice => {
      const invoiceDate = new Date(invoice.date);
      return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
    })
    .reduce((sum, invoice) => sum + (invoice.total || invoice.amount || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ödenmiş Faturalar</h1>
            <p className="text-gray-600">{filteredInvoices.length} ödenmiş fatura bulundu</p>
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
              <p className="text-2xl font-bold text-green-600">₺{formatNumber(collectedAmount.toFixed(2))}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bu Ay Tahsil</p>
              <p className="text-2xl font-bold text-purple-600">₺{formatNumber(thisMonthAmount.toFixed(2))}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Fatura Adedi</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-blue-600">{totalCount}</p>
                <span className="text-sm text-gray-500">adet</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
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
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Ödenmiş Faturalar ({filteredInvoices.length})
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
                    <div className="text-center">
                      <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Ödenmiş fatura bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {invoices.length === 0 ? 'Henüz ödenmiş fatura bulunmuyor' : 'Filtre kriterlerinize uygun fatura bulunamadı'}
                      </p>
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
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <div className="text-sm font-mono font-medium text-blue-600">
                          {invoice.invoice_number}
                        </div>
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
                        {getCurrencySymbol(invoice.currency)}{formatNumber((invoice.total || invoice.amount).toFixed(2))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Ödenmiş
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
                        
                        {/* More Options Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(invoice.id);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Daha Fazla Seçenek"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {openDropdownId === invoice.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => handleDropdownAction('mail', invoice)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Mail className="h-4 w-4 mr-3 text-blue-500" />
                                  Mail
                                </button>
                                <button
                                  onClick={() => handleDropdownAction('message', invoice)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <MessageSquare className="h-4 w-4 mr-3 text-green-500" />
                                  Mesaj
                                </button>
                                
                                {/* Separator */}
                                <div className="border-t border-gray-100 my-1"></div>
                                
                                <button
                                  onClick={() => handleDropdownAction('delete', invoice)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4 mr-3" />
                                  Sil
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
            {!deleteSuccess ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fatura Silme Onayı</h3>
                  <button
                    onClick={handleCloseDeleteModal}
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
                      Tutar: {getCurrencySymbol(selectedInvoice.currency)}{formatNumber((selectedInvoice.total || selectedInvoice.amount).toFixed(2))}
                    </div>
                  </div>
                  <p className="text-sm text-red-600 mt-2">
                    Bu işlem geri alınamaz!
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleCloseDeleteModal}
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
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-600">Fatura Silindi!</h3>
                  <button
                    onClick={handleCloseDeleteModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Fatura Başarıyla Silindi
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-green-800">
                      {selectedInvoice.invoice_number}
                    </div>
                    <div className="text-sm text-green-700">
                      numaralı fatura sistemden kaldırıldı.
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Fatura listesi otomatik olarak güncellendi.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleCloseDeleteModal}
                    className="bg-green-600 hover:bg-green-700 px-8"
                  >
                    Tamam
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaidInvoicesPage;