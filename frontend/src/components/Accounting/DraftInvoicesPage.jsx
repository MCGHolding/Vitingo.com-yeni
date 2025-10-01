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
  Plus,
  X,
  ArrowLeft,
  Clock,
  MoreVertical,
  XCircle,
  Mail,
  MessageSquare,
  CreditCard,
  Trash2
} from 'lucide-react';
import InvoicePreviewModal from './InvoicePreviewModal';

const DraftInvoicesPage = ({ onBackToDashboard, onNewInvoice, onEditInvoice }) => {
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

  // Load draft invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Apply filters when invoices or filters change
  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

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

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/invoices/status/draft`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        console.error('Failed to load draft invoices');
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading draft invoices:', error);
      setInvoices([]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        invoice.customer_name?.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Currency filter
    if (filters.currency !== 'all') {
      filtered = filtered.filter(invoice => invoice.currency === filters.currency);
    }

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(invoice => 
        new Date(invoice.date) <= new Date(filters.dateTo)
      );
    }

    setFilteredInvoices(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
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

  const handleDropdownAction = (action, invoice) => {
    setOpenDropdownId(null); // Close dropdown
    
    switch (action) {
      case 'mail':
        console.log('Mail action:', invoice);
        alert(`${invoice.invoice_number} numaralı taslak fatura mail ile gönderilecek`);
        break;
      case 'message':
        console.log('Mesaj action:', invoice);
        alert(`${invoice.invoice_number} numaralı taslak fatura için mesaj gönderilecek`);
        break;
      case 'payment-request':
        console.log('Ödeme talebi action:', invoice);
        alert(`${invoice.invoice_number} numaralı taslak fatura için ödeme talebi gönderilecek`);
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
        a.download = `Taslak_Fatura_${invoice.invoice_number}.pdf`;
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
      console.log('Taslak fatura silme başlatılıyor:', selectedInvoice.id);
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
        console.error('Taslak fatura silme hatası:', response.status, errorText);
        alert(`Taslak fatura silinemedi: ${response.status} - ${errorText}`);
        setShowDeleteModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('Silme hatası:', error);
      alert(`Taslak fatura silinemedi: ${error.message}`);
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteSuccess(false);
    setSelectedInvoice(null);
  };

  // Helper functions
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const getCurrencySymbol = (currencyCode) => {
    const currencies = {
      'USD': '$',
      'EUR': '€', 
      'GBP': '£',
      'TL': '₺',
      'AED': 'د.إ'
    };
    return currencies[currencyCode] || '';
  };

  const currencyOptions = [
    { value: 'all', label: 'Tümü' },
    { value: 'USD', label: 'USD' },
    { value: 'EUR', label: 'EUR' },
    { value: 'GBP', label: 'GBP' },
    { value: 'TL', label: 'TL' },
    { value: 'AED', label: 'AED' }
  ];

  // Calculate totals
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Taslak Faturalar</h1>
            <p className="text-gray-600">Henüz tamamlanmamış fatura taslaklarını yönetin</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={onNewInvoice}
            className="bg-blue-600 hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Yeni Fatura</span>
          </Button>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard'a Dön</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Taslak</p>
              <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Tutar</p>
              <p className="text-2xl font-bold text-gray-900">
                {getCurrencySymbol('USD')}{formatNumber(totalAmount.toFixed(2))}
              </p>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bu Ay Oluşturulan</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredInvoices.filter(inv => 
                  new Date(inv.date).getMonth() === new Date().getMonth() &&
                  new Date(inv.date).getFullYear() === new Date().getFullYear()
                ).length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Arama
            </label>
            <Input
              type="text"
              placeholder="Fatura no veya müşteri adı..."
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
              {currencyOptions.map(currency => (
                <option key={currency.value} value={currency.value}>
                  {currency.label}
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Taslak Faturalar ({filteredInvoices.length})
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
                    <div className="text-gray-500">Taslak faturalar yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Taslak fatura bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {invoices.length === 0 ? 'Henüz taslak fatura oluşturulmamış' : 'Filtre kriterlerinize uygun taslak fatura bulunamadı'}
                      </p>
                      <div className="mt-4">
                        <Button onClick={onNewInvoice} className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-2" />
                          İlk Taslak Faturanızı Oluşturun
                        </Button>
                      </div>
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
                        <Clock className="h-4 w-4 text-blue-500 mr-2" />
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
                        {getCurrencySymbol(invoice.currency)}{formatNumber(invoice.total.toFixed(2))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        Taslak
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
                                <button
                                  onClick={() => handleDropdownAction('payment-request', invoice)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <CreditCard className="h-4 w-4 mr-3 text-purple-500" />
                                  Ödeme Talebi
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
              // Silme Onayı İçeriği
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Taslak Fatura Silme Onayı</h3>
                  <button
                    onClick={handleCloseDeleteModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-2">
                    Aşağıdaki taslak faturayı silmek istediğinizden emin misiniz?
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
              // Başarı Mesajı İçeriği
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-green-600">Taslak Fatura Silindi!</h3>
                  <button
                    onClick={handleCloseDeleteModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center mb-6">
                  {/* Başarı İkonu */}
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Taslak Fatura Başarıyla Silindi
                  </p>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-green-800">
                      {selectedInvoice.invoice_number}
                    </div>
                    <div className="text-sm text-green-700">
                      numaralı taslak fatura sistemden kaldırıldı.
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Taslak fatura listesi otomatik olarak güncellendi.
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

export default DraftInvoicesPage;