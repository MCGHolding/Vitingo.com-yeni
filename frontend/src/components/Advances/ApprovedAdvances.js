import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { formatAdvanceNumber } from '../utils/formatters';
import Tooltip from './ui/tooltip';
import { 
  CheckCircleIcon,
  CalendarIcon,
  Banknote as BanknoteIcon,
  FolderIcon,
  UserIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon as MagnifyingGlassIcon,
  XIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ApprovedAdvances = () => {
  const { user } = useAuth();
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    requester: '',
    project: '',
    category: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Check if user has payment permissions (Muhasebe, Admin, Süper Admin, Super Admin)
  const hasPaymentPermissions = () => {
    if (!user?.role) return false;
    const roleName = user.role.name;
    return roleName === 'Süper Admin' || roleName === 'Super Admin' || roleName === 'Admin' || roleName === 'Muhasebe';
  };

  // Fetch approved advance requests
  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/advance-requests/approved`);
      setApprovedRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error('Error fetching approved requests:', error);
      toast.error('Onaylı talepler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment processing
  const handlePayment = async (requestId) => {
    try {
      setProcessingPayment(requestId);
      
      await axios.post(`${API}/advance-requests/${requestId}/pay`);
      
      toast.success('Ödeme işlemi tamamlandı. Avans, kapama menüsüne taşındı.');
      
      // Refresh the list to remove the paid request
      fetchApprovedRequests();
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.detail || 'Ödeme işlemi sırasında hata oluştu');
    } finally {
      setProcessingPayment(null);
    }
  };

  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm, approvedRequests]);

  // Apply filters
  const applyFilters = () => {
    if (!approvedRequests.length) return;

    let filtered = [...approvedRequests];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.advance_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter (approval date)
    if (filters.dateFrom) {
      filtered = filtered.filter(req => {
        const approvalDate = new Date(req.approval_date);
        const fromDate = new Date(filters.dateFrom);
        return approvalDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(req => {
        const approvalDate = new Date(req.approval_date);
        const toDate = new Date(filters.dateTo);
        return approvalDate <= toDate;
      });
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(req => req.approved_amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(req => req.approved_amount <= parseFloat(filters.maxAmount));
    }

    // Requester filter
    if (filters.requester) {
      filtered = filtered.filter(req => 
        req.requester_name?.toLowerCase().includes(filters.requester.toLowerCase())
      );
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter(req => 
        req.project?.toLowerCase().includes(filters.project.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(req => 
        req.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      requester: '',
      project: '',
      category: ''
    });
    setSearchTerm('');
    setFilteredRequests(approvedRequests);
  };

  // Format currency
  // Helper function for currency symbols
  const getCurrencySymbol = (currencyCode) => {
    const symbols = {
      'TRY': '₺', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CHF': 'Fr',
      'AED': 'د.إ', 'SAR': '﷼', 'KWD': 'د.ك', 'QAR': '﷼', 'BHD': '.د.ب',
      'OMR': '﷼', 'JOD': 'د.ا', 'CNY': '¥', 'INR': '₹', 'RUB': '₽',
      'BRL': 'R$', 'MXN': '$', 'CAD': 'C$', 'AUD': 'A$', 'NZD': 'NZ$',
      'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'SEK': 'kr', 'NOK': 'kr',
      'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei',
      'BGN': 'лв', 'HRK': 'kn', 'ILS': '₪', 'ZAR': 'R', 'THB': '฿',
      'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'PKR': '₨',
      'BDT': '৳', 'LKR': '₨', 'NPR': '₨', 'AFN': '؋', 'IRR': '﷼',
      'IQD': 'ع.د', 'SYP': '£', 'LBP': 'ل.ل', 'EGP': '£', 'MAD': 'د.م.',
      'TND': 'د.ت', 'DZD': 'د.ج', 'LYD': 'ل.د', 'ALL': 'L', 'ANG': 'ƒ', 'AWG': 'ƒ'
    };
    return symbols[currencyCode] || currencyCode;
  };

  const formatCurrency = (amount, currency) => {
    const formatted = amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
    return `${formatted} ${getCurrencySymbol(currency)}`;
  };

  // Format date (without time)
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600">Onaylı talepler yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="approved-advances-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Onaylı Avanslar</h1>
          <p className="text-gray-600 mt-1">
            Onaylı {filteredRequests.length} adet avans talebi bulunmaktadır
          </p>
        </div>
      </div>

      {/* Summary Cards - moved to top */}
      {approvedRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700">Toplam Onaylı</p>
                <p className="text-lg font-bold text-green-900">
                  {filteredRequests.length} Talep
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <BanknoteIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">Toplam Onaylı Tutar</p>
                <p className="text-lg font-bold text-blue-900">
                  {formatCurrency(
                    filteredRequests.reduce((sum, req) => sum + req.approved_amount, 0),
                    filteredRequests[0]?.currency || 'TRY'
                  )}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Collapsible Filter Bar */}
      <Card>
        {/* Filter Header */}
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtreler</h3>
            <span className="text-sm text-gray-500">
              ({filteredRequests.length} / {approvedRequests.length} avans)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {(Object.values(filters).some(value => value !== '') || searchTerm) && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFilters();
                }}
                variant="outline"
                size="sm"
                className="gap-1"
              >
                <XIcon className="w-4 h-4" />
                Temizle
              </Button>
            )}
            {showFilters ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-600" />
            )}
          </div>
        </div>

        {/* Collapsible Filter Content */}
        {showFilters && (
          <div className="border-t border-gray-200 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
                <Input
                  type="text"
                  placeholder="Avans no, talep eden, proje ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Date From - Approval Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onay Tarihi (Başlangıç)</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Onay Tarihi (Bitiş)</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
                />
              </div>

              {/* Requester */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Talep Eden</label>
                <Input
                  type="text"
                  placeholder="İsim ara..."
                  value={filters.requester}
                  onChange={(e) => setFilters(prev => ({...prev, requester: e.target.value}))}
                />
              </div>

              {/* Min Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min. Tutar</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minAmount}
                  onChange={(e) => setFilters(prev => ({...prev, minAmount: e.target.value}))}
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max. Tutar</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters(prev => ({...prev, maxAmount: e.target.value}))}
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proje</label>
                <Input
                  type="text"
                  placeholder="Proje ara..."
                  value={filters.project}
                  onChange={(e) => setFilters(prev => ({...prev, project: e.target.value}))}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <Input
                  type="text"
                  placeholder="Kategori ara..."
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                />
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modern Card Layout */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Sonuç bulunamadı' : 'Onaylı avans yok'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Arama kriterlerinizle eşleşen avans bulunamadı.' : 'Henüz onaylı herhangi bir avans talebi bulunmamaktadır.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
              <div className="max-w-4xl">
                <div className="flex items-start justify-between">
                  {/* Left Section - User and Basic Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.requester_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {request.requester_email}
                        </p>
                        {request.advance_number && (
                          <Tooltip content={request.advance_number}>
                            <p className="text-xs text-gray-400 font-mono cursor-help hover:text-blue-500 transition-colors">
                              {formatAdvanceNumber(request.advance_number)}
                            </p>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    {/* Content Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      
                      {/* Category */}
                      <div className="flex items-center space-x-2">
                        <FolderIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Kategori</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {request.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Request Date */}
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Talep Tarihi</p>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            {formatDate(request.request_date)}
                          </p>
                        </div>
                      </div>

                      {/* Approval Info */}
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Onaylayan</p>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            {request.approved_by}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(request.approved_at)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {request.description && (
                      <div className="mt-3">
                        <div className="flex items-start space-x-2">
                          <MessageSquareIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Açıklama</p>
                            <p className="text-sm text-gray-700">
                              {request.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Section - Amount, Status and Payment Button */}
                  <div className="text-right space-y-3 ml-6">
                    {/* Amount Display with Visual Feedback */}
                    <div>
                      {/* Show comparison if amounts are different */}
                      {request.approved_amount !== request.amount && (
                        <div className={`text-sm font-medium mb-1 ${
                          request.approved_amount < request.amount 
                            ? 'text-red-600' 
                            : 'text-green-600'
                        }`}>
                          İlk Talep: {formatCurrency(request.amount, request.currency)} {
                            request.approved_amount < request.amount ? '😢' : '😊'
                          }
                        </div>
                      )}
                      
                      {/* Main approved amount */}
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(request.approved_amount, request.currency)}
                      </div>
                    </div>
                    
                    {/* Status Badge */}
                    <div>
                      <Badge className="bg-green-100 text-green-800 px-3 py-1.5">
                        <CheckCircleIcon className="w-4 h-4 mr-1" />
                        Onaylandı
                      </Badge>
                    </div>

                    {/* Payment Button */}
                    {hasPaymentPermissions() && (
                      <div>
                        <Button
                          onClick={() => handlePayment(request.id)}
                          disabled={processingPayment === request.id}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                          size="sm"
                        >
                          {processingPayment === request.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                              İşleniyor...
                            </>
                          ) : (
                            <>
                              <span className="mr-1">💳</span>
                              ÖDENDİ
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};

export default ApprovedAdvances;