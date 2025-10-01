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
  XCircle,
  ArrowLeft
} from 'lucide-react';
import InvoicePreviewModal from './InvoicePreviewModal';

const CancelledInvoicesPage = ({ onBackToDashboard, onNewInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    currency: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Load cancelled invoices on component mount
  useEffect(() => {
    loadInvoices();
  }, []);

  // Apply filters when invoices or filters change
  useEffect(() => {
    applyFilters();
  }, [invoices, filters]);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/invoices/status/cancelled`);
      
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      } else {
        console.error('Failed to load cancelled invoices');
        setInvoices([]);
      }
    } catch (error) {
      console.error('Error loading cancelled invoices:', error);
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
      case 'download':
        downloadInvoicePDF(invoice);
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
          <div className="p-3 bg-orange-100 rounded-lg">
            <XCircle className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">İptal Faturalar</h1>
            <p className="text-gray-600">İptal edilmiş faturaları görüntüleyin</p>
          </div>
        </div>
        
        <div className="flex space-x-3">
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
              <p className="text-sm font-medium text-gray-600">Toplam İptal Fatura</p>
              <p className="text-2xl font-bold text-gray-900">{filteredInvoices.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <XCircle className="h-6 w-6 text-orange-600" />
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
              <p className="text-sm font-medium text-gray-600">Bu Ay İptal</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredInvoices.filter(inv => 
                  new Date(inv.date).getMonth() === new Date().getMonth() &&
                  new Date(inv.date).getFullYear() === new Date().getFullYear()
                ).length}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
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
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
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
            İptal Faturalar ({filteredInvoices.length})
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
                  İptal Tarihi
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
                    <div className="text-gray-500">İptal faturalar yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <XCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">İptal fatura bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {invoices.length === 0 ? 'Henüz iptal edilmiş fatura bulunmuyor' : 'Filtre kriterlerinize uygun iptal fatura bulunamadı'}
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
                        <XCircle className="h-4 w-4 text-orange-500 mr-2" />
                        <div className="text-sm font-mono font-medium text-gray-600 line-through">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.cancelled_at ? new Date(invoice.cancelled_at).toLocaleDateString('tr-TR') : '-'}
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
                          onClick={() => handleAction('download', invoice)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="İndir"
                        >
                          <Download className="h-4 w-4" />
                        </button>
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
    </div>
  );
};

export default CancelledInvoicesPage;