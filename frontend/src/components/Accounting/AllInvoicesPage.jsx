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
  CreditCard
} from 'lucide-react';
import InvoicePreviewModal from './InvoicePreviewModal';

const AllInvoicesPage = ({ onBackToDashboard, onNewInvoice, onEditInvoice }) => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    currency: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });
  
  // Import & Export States
  const [importExportModal, setImportExportModal] = useState(false);
  const [activeImportExportTab, setActiveImportExportTab] = useState('import');
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('idle');
  const [importResults, setImportResults] = useState(null);
  const [exportFormat, setExportFormat] = useState('xlsx');
  const [exportProgress, setExportProgress] = useState(0);

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

  const calculateTRYAmount = (amount, currency) => {
    const rates = { TRY: 1, USD: 34.50, EUR: 37.20, GBP: 43.80 };
    return amount * (rates[currency] || 1);
  };

  const calculateOverdueDays = (invoice) => {
    if (invoice.status === 'paid') return 0;
    
    // Vade tarihi = Fatura tarihi + Ödeme vadesi (varsayılan 30 gün)
    const invoiceDate = new Date(invoice.date);
    const paymentTerm = invoice.payment_term || invoice.paymentTerm || 30; // gün cinsinden
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + paymentTerm);
    
    // Bugünün tarihi
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Vade geçmiş gün sayısı
    const diffTime = today - dueDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
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

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
  };

  const handleEdit = (invoice) => {
    if (onEditInvoice) {
      onEditInvoice(invoice);
    }
  };

  const handleDownload = (invoice) => {
    setOpenMenu(null);
    downloadInvoicePDF(invoice);
  };

  const handleDuplicate = (invoice) => {
    setOpenMenu(null);
    console.log('Kopyalama işlemi:', invoice);
    alert(`${invoice.invoice_number} numaralı fatura kopyalanacak`);
  };

  const handleDelete = (invoice) => {
    setOpenMenu(null);
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  // Import & Export Fonksiyonları
  const downloadSampleFile = () => {
    const sampleData = `Fatura No,Müşteri,Tarih,Açıklama,Miktar,Birim,Birim Fiyat,Para Birimi,KDV Oranı,Durum
FT-2024-001,ABC Şirketi,01.12.2024,Stand montaj hizmeti,1,Adet,5000,TRY,20,Ödenmedi
FT-2024-002,XYZ Ltd.,02.12.2024,Fuar malzemeleri,10,Kutu,250,USD,20,Ödenmiş
FT-2024-003,Demo Firması,03.12.2024,Tasarım hizmeti,5,Saat,150,EUR,20,Ödenmedi`;

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + sampleData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'fatura_import_ornegi.csv';
    link.click();
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Dosya boyutu 10MB\'dan büyük olamaz!');
        return;
      }
      setImportFile(file);
      setImportStatus('idle');
      setImportResults(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setImportStatus('uploading');
    setImportProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);
      
      setImportStatus('processing');
      
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/invoices/import`, {
        method: 'POST',
        body: formData
      });
      
      clearInterval(progressInterval);
      setImportProgress(100);
      
      if (response.ok) {
        const result = await response.json();
        setImportStatus('success');
        setImportResults({
          success: true,
          total: result.total || 0,
          success: result.imported || 0,
          failed: result.failed || 0
        });
        
        setTimeout(() => {
          loadInvoices();
        }, 1500);
      } else {
        throw new Error('Import başarısız');
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      setImportProgress(100);
      setImportResults({
        success: false,
        total: 0,
        success: 0,
        failed: 1,
        error: error.message
      });
    }
  };

  const exportAsCSV = () => {
    const headers = ['No', 'Fatura No', 'Müşteri', 'Tarih', 'Tutar', 'Para Birimi', 'Tutar (TL)', 'Durum'];
    
    const rows = filteredInvoices.map((inv, index) => [
      index + 1,
      inv.invoice_number || '',
      inv.customer_name || '',
      new Date(inv.date).toLocaleDateString('tr-TR'),
      inv.total || 0,
      inv.currency || 'TRY',
      calculateTRYAmount(inv.total || 0, inv.currency),
      inv.status === 'paid' ? 'Ödenmiş' : 'Ödenmemiş'
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `satis_faturalari_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportAsExcel = async () => {
    exportAsCSV();
  };

  const exportAsPDF = async () => {
    try {
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/invoices/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds: filteredInvoices.map(i => i.id) })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `satis_faturalari_${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
      } else {
        alert('PDF export şu anda kullanılamıyor. CSV olarak indiriliyor...');
        exportAsCSV();
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF export şu anda kullanılamıyor. CSV olarak indiriliyor...');
      exportAsCSV();
    }
  };

  const handleExport = async () => {
    setExportProgress(10);
    
    try {
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 20;
        });
      }, 200);
      
      if (exportFormat === 'csv') {
        await exportAsCSV();
      } else if (exportFormat === 'xlsx') {
        await exportAsExcel();
      } else if (exportFormat === 'pdf') {
        await exportAsPDF();
      }
      
      clearInterval(progressInterval);
      setExportProgress(100);
      
      setTimeout(() => {
        setExportProgress(0);
      }, 1500);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Export sırasında hata oluştu!');
      setExportProgress(0);
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

  const handleCancelInvoice = async () => {
    try {
      console.log('Fatura iptal başlatılıyor:', selectedInvoice.id);
      const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/invoices/${selectedInvoice.id}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Cancel response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Cancel result:', result);
        
        // Faturayı listeden kaldır (çünkü iptal edilmiş)
        setInvoices(prev => prev.filter(inv => inv.id !== selectedInvoice.id));
        
        // Modal içeriğini başarı mesajına çevir
        setCancelSuccess(true);
      } else {
        const errorText = await response.text();
        console.error('Fatura iptal hatası:', response.status, errorText);
        alert(`Fatura iptal edilemedi: ${response.status} - ${errorText}`);
        setShowCancelModal(false);
        setSelectedInvoice(null);
      }
    } catch (error) {
      console.error('İptal hatası:', error);
      alert(`Fatura iptal edilemedi: ${error.message}`);
      setShowCancelModal(false);
      setSelectedInvoice(null);
    }
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setCancelSuccess(false);
    setSelectedInvoice(null);
  };

  const handleDropdownAction = (action, invoice) => {
    setOpenDropdownId(null); // Close dropdown
    
    switch (action) {
      case 'cancel':
        setSelectedInvoice(invoice);
        setShowCancelModal(true);
        break;
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

  const toggleMenu = (id) => {
    setOpenMenu(openMenu === id ? null : id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
      setOpenMenu(null);
    };
    
    if (openDropdownId || openMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdownId, openMenu]);

  // Calculate totals and statistics
  const totalAmount = filteredInvoices.reduce((sum, invoice) => sum + (invoice.total || invoice.amount || 0), 0);
  
  const paidAmount = filteredInvoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + (invoice.total || invoice.amount || 0), 0);
  
  const pendingAmount = filteredInvoices
    .filter(invoice => invoice.status === 'pending' || invoice.status === 'active')
    .reduce((sum, invoice) => sum + (invoice.total || invoice.amount || 0), 0);

  // Calculate overdue invoices (vadesi geçenler)
  const currentDate = new Date();
  const overdueAmount = filteredInvoices
    .filter(invoice => {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
      
      // Invoice date + payment term = due date
      const invoiceDate = new Date(invoice.date);
      const paymentTermDays = parseInt(invoice.payment_term || '30');
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + paymentTermDays);
      
      return currentDate > dueDate;
    })
    .reduce((sum, invoice) => sum + (invoice.total || invoice.amount || 0), 0);

  const overdueCount = filteredInvoices
    .filter(invoice => {
      if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
      
      const invoiceDate = new Date(invoice.date);
      const paymentTermDays = parseInt(invoice.payment_term || '30');
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + paymentTermDays);
      
      return currentDate > dueDate;
    }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Satış Faturaları</h1>
            <p className="text-gray-600">{filteredInvoices.length} fatura bulundu</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Import & Export Butonu */}
          <button
            onClick={() => setImportExportModal(true)}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Import & Export
          </button>
          
          {/* Yeni Fatura Butonu */}
          <button
            onClick={onNewInvoice}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Yeni Fatura
          </button>
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vadesi Geçenler</p>
              <div className="flex items-baseline space-x-2">
                <p className="text-2xl font-bold text-red-600">₺{formatNumber(overdueAmount.toFixed(2))}</p>
                <span className="text-sm text-gray-500">({overdueCount} fatura)</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <Calendar className="h-6 w-6 text-red-600" />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fatura No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tutar (TL)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Faturalar yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {invoices.length === 0 ? 'Henüz fatura oluşturulmamış' : 'Filtre kriterlerinize uygun fatura bulunamadı'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice, index) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    {/* No */}
                    <td className="px-6 py-4 whitespace-nowrap text-left">
                      <div className="text-sm font-medium text-gray-700">
                        {index + 1}
                      </div>
                    </td>
                    
                    {/* Tarih */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.date).toLocaleDateString('tr-TR')}
                    </td>
                    
                    {/* Fatura No - Son 4 Hane + Tooltip */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="group relative">
                        <span 
                          className="text-blue-600 font-medium cursor-pointer hover:text-blue-800"
                          title={invoice.invoice_number}
                        >
                          ...{(invoice.invoice_number || '').slice(-4)}
                        </span>
                        {/* Tooltip - hover'da tam numara */}
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10">
                          <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {invoice.invoice_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Müşteri */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {invoice.customer_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invoice.items ? invoice.items.length : 0} kalem
                      </div>
                    </td>
                    
                    {/* Tutar (Orijinal Para Birimi) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-medium text-gray-900">
                        {(invoice.total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-gray-500 ml-1">{invoice.currency || 'TRY'}</span>
                    </td>
                    
                    {/* Tutar (TL Karşılığı) */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-bold text-green-600">
                        {calculateTRYAmount(invoice.total || 0, invoice.currency).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-green-500 ml-1">TL</span>
                    </td>
                    
                    {/* Durum - Ödenmiş/Ödenmemiş */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="relative inline-block">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {invoice.status === 'paid' ? '✓ Ödenmiş' : '✗ Ödenmemiş'}
                        </span>
                        {/* Vade Geçmiş Gün Sayısı Badge */}
                        {invoice.status !== 'paid' && calculateOverdueDays(invoice) > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full border-2 border-white shadow-md">
                            {calculateOverdueDays(invoice) > 99 ? '99+' : calculateOverdueDays(invoice)}
                          </span>
                        )}
                      </div>
                    </td>
                    
                    {/* İşlemler */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {/* Görüntüle */}
                        <button
                          onClick={() => handleView(invoice)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Görüntüle"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        
                        {/* Düzenle */}
                        <button
                          onClick={() => handleEdit(invoice)}
                          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        
                        {/* 3 Nokta Menü */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleMenu(invoice.id);
                            }}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Daha fazla"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>
                          
                          {/* Dropdown Menü */}
                          {openMenu === invoice.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
                              <button
                                onClick={() => handleDownload(invoice)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                PDF İndir
                              </button>
                              <button
                                onClick={() => handleDuplicate(invoice)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Kopyala
                              </button>
                              <button
                                onClick={() => handleDelete(invoice)}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Sil
                              </button>
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
            {!deleteSuccess ? (
              // Silme Onayı İçeriği
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
                  <h3 className="text-lg font-semibold text-green-600">Fatura Silindi!</h3>
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

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            {!cancelSuccess ? (
              // İptal Onayı İçeriği
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Fatura İptal Onayı</h3>
                  <button
                    onClick={handleCloseCancelModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700 mb-2">
                    Aşağıdaki faturayı iptal etmek istediğinizden emin misiniz?
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
                  <p className="text-sm text-orange-600 mt-2">
                    İptal edilen fatura "İptal Faturalar" bölümüne taşınacaktır!
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    onClick={handleCloseCancelModal}
                    variant="outline"
                    className="flex-1"
                  >
                    Vazgeç
                  </Button>
                  <Button
                    onClick={handleCancelInvoice}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    İptal Et
                  </Button>
                </div>
              </>
            ) : (
              // Başarı Mesajı İçeriği
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-orange-600">Fatura İptal Edildi!</h3>
                  <button
                    onClick={handleCloseCancelModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="text-center mb-6">
                  {/* İptal İkonu */}
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-8 h-8 text-orange-600" />
                  </div>
                  
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Fatura Başarıyla İptal Edildi
                  </p>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                    <div className="text-sm font-medium text-orange-800">
                      {selectedInvoice.invoice_number}
                    </div>
                    <div className="text-sm text-orange-700">
                      numaralı fatura iptal edildi ve "İptal Faturalar" bölümüne taşındı.
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    İptal edilen faturayı "Muhasebe > İptal Faturalar" menüsünden görüntüleyebilirsiniz.
                  </p>
                </div>
                
                <div className="flex justify-center">
                  <Button
                    onClick={handleCloseCancelModal}
                    className="bg-orange-600 hover:bg-orange-700 px-8"
                  >
                    Tamam
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Import & Export Modal */}
      {importExportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Overlay */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              onClick={() => setImportExportModal(false)}
            ></div>
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center text-white">
                  <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <div>
                    <h2 className="text-xl font-bold">Import & Export</h2>
                    <p className="text-blue-100 text-sm">Fatura verilerini içe/dışa aktarın</p>
                  </div>
                </div>
                <button
                  onClick={() => setImportExportModal(false)}
                  className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex border-b">
                <button
                  onClick={() => setActiveImportExportTab('import')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeImportExportTab === 'import'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    İçe Aktar (Import)
                  </div>
                </button>
                <button
                  onClick={() => setActiveImportExportTab('export')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeImportExportTab === 'export'
                      ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Dışa Aktar (Export)
                  </div>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                
                {/* IMPORT TAB */}
                {activeImportExportTab === 'import' && (
                  <div className="space-y-6">
                    {/* Kurallar */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Import Kuralları
                      </h3>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Desteklenen formatlar: <strong>CSV, XLSX, XLS</strong>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          İlk satır <strong>başlık satırı</strong> olmalıdır
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Zorunlu alanlar: <strong>Fatura No, Müşteri, Tarih, Tutar</strong>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Tarih formatı: <strong>GG.AA.YYYY</strong> veya <strong>YYYY-AA-GG</strong>
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Para birimi belirtilmezse <strong>TRY</strong> kabul edilir
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          Maksimum dosya boyutu: <strong>10 MB</strong>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Örnek Dosya */}
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Örnek Dosya
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Doğru formatta veri yüklemek için örnek dosyayı indirin ve inceleyin.
                      </p>
                      <button
                        onClick={downloadSampleFile}
                        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                      >
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Örnek CSV İndir
                      </button>
                    </div>
                    
                    {/* Dosya Yükleme Alanı */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
                      {!importFile ? (
                        <>
                          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-gray-600 mb-2">Dosyayı buraya sürükleyin veya</p>
                          <label className="cursor-pointer">
                            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-block">
                              Dosya Seç
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept=".csv,.xlsx,.xls"
                              onChange={handleFileSelect}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-2">CSV, XLSX, XLS (max 10MB)</p>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center text-green-600">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="font-medium text-gray-900">{importFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(importFile.size / 1024).toFixed(2)} KB
                          </p>
                          <button
                            onClick={() => setImportFile(null)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Dosyayı Kaldır
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {importStatus !== 'idle' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {importStatus === 'uploading' && 'Yükleniyor...'}
                            {importStatus === 'processing' && 'İşleniyor...'}
                            {importStatus === 'success' && 'Tamamlandı!'}
                            {importStatus === 'error' && 'Hata!'}
                          </span>
                          <span className="font-medium">{importProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              importStatus === 'error' ? 'bg-red-600' : 'bg-blue-600'
                            }`}
                            style={{ width: `${importProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Import Sonuçları */}
                    {importResults && (
                      <div className={`rounded-xl p-4 ${
                        importResults.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                      }`}>
                        <h4 className={`font-semibold mb-2 ${
                          importResults.success ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {importResults.success ? '✓ Import Başarılı!' : '✗ Import Hatası'}
                        </h4>
                        <ul className="text-sm space-y-1">
                          <li>Toplam satır: <strong>{importResults.total}</strong></li>
                          <li className="text-green-700">Başarılı: <strong>{importResults.success}</strong></li>
                          {importResults.failed > 0 && (
                            <li className="text-red-700">Başarısız: <strong>{importResults.failed}</strong></li>
                          )}
                        </ul>
                      </div>
                    )}
                    
                    {/* Import Butonu */}
                    <button
                      onClick={handleImport}
                      disabled={!importFile || importStatus === 'uploading' || importStatus === 'processing'}
                      className={`w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center ${
                        importFile && importStatus === 'idle'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      İçe Aktar
                    </button>
                  </div>
                )}
                
                {/* EXPORT TAB */}
                {activeImportExportTab === 'export' && (
                  <div className="space-y-6">
                    {/* Export Bilgisi */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Export Bilgileri
                      </h3>
                      <ul className="text-sm text-green-800 space-y-2">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Toplam <strong>{filteredInvoices.length}</strong> fatura dışa aktarılacak
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Filtreler uygulanmışsa sadece <strong>filtrelenmiş veriler</strong> aktarılır
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">•</span>
                          Türkçe karakterler <strong>UTF-8</strong> encoding ile korunur
                        </li>
                      </ul>
                    </div>
                    
                    {/* Format Seçimi */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">Dosya Formatı Seçin</h3>
                      <div className="grid grid-cols-3 gap-4">
                        {/* Excel */}
                        <button
                          onClick={() => setExportFormat('xlsx')}
                          className={`p-4 border-2 rounded-xl text-center transition-all ${
                            exportFormat === 'xlsx'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-12 h-12 mx-auto mb-2 bg-green-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">XLSX</span>
                          </div>
                          <p className="font-medium text-gray-900">Excel</p>
                          <p className="text-xs text-gray-500">.xlsx</p>
                        </button>
                        
                        {/* CSV */}
                        <button
                          onClick={() => setExportFormat('csv')}
                          className={`p-4 border-2 rounded-xl text-center transition-all ${
                            exportFormat === 'csv'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-12 h-12 mx-auto mb-2 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">CSV</span>
                          </div>
                          <p className="font-medium text-gray-900">CSV</p>
                          <p className="text-xs text-gray-500">.csv</p>
                        </button>
                        
                        {/* PDF */}
                        <button
                          onClick={() => setExportFormat('pdf')}
                          className={`p-4 border-2 rounded-xl text-center transition-all ${
                            exportFormat === 'pdf'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-12 h-12 mx-auto mb-2 bg-red-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">PDF</span>
                          </div>
                          <p className="font-medium text-gray-900">PDF</p>
                          <p className="text-xs text-gray-500">.pdf</p>
                        </button>
                      </div>
                    </div>
                    
                    {/* Export Seçenekleri */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Export Seçenekleri</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                          <span className="ml-2 text-sm text-gray-700">Başlık satırını dahil et</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                          <span className="ml-2 text-sm text-gray-700">TL karşılıklarını dahil et</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                          <span className="ml-2 text-sm text-gray-700">Sadece ödenmemiş faturaları aktar</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    {exportProgress > 0 && exportProgress < 100 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Dışa aktarılıyor...</span>
                          <span className="font-medium">{exportProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-green-600 transition-all duration-300"
                            style={{ width: `${exportProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Export Butonu */}
                    <button
                      onClick={handleExport}
                      className="w-full py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {exportFormat.toUpperCase()} Olarak İndir
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllInvoicesPage;