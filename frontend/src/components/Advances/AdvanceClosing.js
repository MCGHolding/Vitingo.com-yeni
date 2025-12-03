import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { formatAdvanceNumber } from '../utils/formatters';
import { formatCurrency } from '../utils/formatCurrency';
import Tooltip from './ui/tooltip';
import { 
  CheckCircleIcon,
  CalendarIcon,
  Banknote as BanknoteIcon,
  FolderIcon,
  UserIcon,
  MessageSquareIcon,
  RefreshCwIcon,
  XIcon,
  XCircleIcon,
  ClockIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon as MagnifyingGlassIcon,
  Trash2Icon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdvanceClosing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paidRequests, setPaidRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingClose, setProcessingClose] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [userBaseCurrency, setUserBaseCurrency] = useState('TRY');
  
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

  // Check if user is Admin or Super Admin
  const isAdmin = () => {
    if (!user || !user.role) return false;
    const userRole = user.role.name;
    return ['Admin', 'Super Admin', 'Süper Admin'].includes(userRole);
  };

  // Fetch paid advance requests
  const fetchPaidRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/advance-requests/paid`);
      setPaidRequests(response.data);
      setFilteredRequests(response.data);
    } catch (error) {
      console.error('Error fetching paid requests:', error);
      toast.error('Ödenen talepler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaidRequests();
    fetchUserBaseCurrency();
  }, []);

  // Fetch user's base currency
  const fetchUserBaseCurrency = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/${user?.id}/settings/currencies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserBaseCurrency(response.data?.baseCurrency || 'TRY');
    } catch (error) {
      console.error('Error fetching base currency:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm, paidRequests]);

  // Apply filters
  const applyFilters = () => {
    if (!paidRequests.length) return;

    let filtered = [...paidRequests];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.advance_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter (payment date)
    if (filters.dateFrom) {
      filtered = filtered.filter(req => {
        const paymentDate = new Date(req.payment_date);
        const fromDate = new Date(filters.dateFrom);
        return paymentDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(req => {
        const paymentDate = new Date(req.payment_date);
        const toDate = new Date(filters.dateTo);
        return paymentDate <= toDate;
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
    setFilteredRequests(paidRequests);
  };

  // Navigate to closing detail page
  const handleClose = (requestId) => {
    navigate(`/dashboard/closing/${requestId}`);
  };

  // Open delete confirmation modal
  const openDeleteModal = (request, e) => {
    e.stopPropagation();
    setSelectedRequest(request);
    setShowDeleteModal(true);
  };

  // Handle permanent delete (Admin only)
  const handleDelete = async () => {
    if (!selectedRequest) return;
    
    try {
      setDeleting(true);
      
      await axios.delete(`${API}/advance-requests/${selectedRequest.id}/force`);
      
      toast.success('Avans kaydı kalıcı olarak silindi');
      setShowDeleteModal(false);
      setSelectedRequest(null);
      
      // Refresh the list
      fetchPaidRequests();
      
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error(error.response?.data?.detail || 'Silme sırasında hata oluştu');
    } finally {
      setDeleting(false);
    }
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
        <span className="ml-2 text-gray-600">Ödenen avanslar yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="advance-closing-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avans Kapama</h1>
          <p className="text-gray-600 mt-1">
            Kapatılmayı bekleyen {filteredRequests.length} adet ödenen avans bulunmaktadır
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={fetchPaidRequests}
            variant="outline"
            className="gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            Yenile
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {paidRequests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center">
              <CheckCircleIcon className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700">Toplam Ödenen</p>
                <p className="text-lg font-bold text-blue-900">
                  {filteredRequests.length} Avans
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center">
              <BanknoteIcon className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-700">Toplam Ödenen Tutar</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(
                    filteredRequests.reduce((sum, req) => sum + (req.converted_amount || req.approved_amount), 0),
                    userBaseCurrency
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
              ({filteredRequests.length} / {paidRequests.length} avans)
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

              {/* Date From - Payment Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi (Başlangıç)</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ödeme Tarihi (Bitiş)</label>
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
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Sonuç bulunamadı' : 'Kapatılacak avans yok'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Arama kriterlerinizle eşleşen avans bulunamadı.' : 'Şu anda kapatılmayı bekleyen herhangi bir ödenen avans bulunmamaktadır.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
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

                      {/* Payment Date */}
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Ödenme Tarihi</p>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            {formatDate(request.paid_at)}
                          </p>
                        </div>
                      </div>

                      {/* Payer Info */}
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Ödeyen</p>
                          <p className="text-sm font-medium text-gray-700 mt-1">
                            {request.paid_by}
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

                  {/* Right Section - Amount, Status and Close Button */}
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
                      
                      {/* Base currency equivalent (if different) */}
                      {request.converted_amount && request.currency !== userBaseCurrency && (
                        <div className="text-xs text-gray-500 mt-1">
                          ≈ {formatCurrency(request.converted_amount, userBaseCurrency)}
                        </div>
                      )}
                    </div>
                    
                    {/* Status Badge - Dynamic based on closing_status */}
                    <div>
                      {request.closing_status === 'rejected' ? (
                        <Badge className="bg-red-100 text-red-800 px-3 py-1.5">
                          <XCircleIcon className="w-4 h-4 mr-1" />
                          Reddedildi - Rev.{request.closing_revision || 1}
                        </Badge>
                      ) : request.closing_status === 'submitted' ? (
                        <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1.5">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          Finans Onayında
                        </Badge>
                      ) : request.closing_status === 'partial_approved' ? (
                        <Badge className="bg-gray-200 text-gray-700 px-3 py-1.5">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Kısmi Onaylandı
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 text-blue-800 px-3 py-1.5">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Ödendi
                        </Badge>
                      )}
                    </div>

                    {/* Close Button */}
                    <div className="space-y-2">
                      <Button
                        onClick={() => handleClose(request.id)}
                        disabled={processingClose === request.id}
                        className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        size="sm"
                      >
                        {processingClose === request.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1"></div>
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <XIcon className="w-3 h-3 mr-1" />
                            KAPAMA YAPIN
                          </>
                        )}
                      </Button>
                      
                      {/* Delete Button - Only for Admin/Super Admin */}
                      {isAdmin() && (
                        <Button
                          onClick={(e) => openDeleteModal(request, e)}
                          disabled={deleting}
                          variant="outline"
                          className="w-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                          size="sm"
                        >
                          <Trash2Icon className="w-3 h-3 mr-1" />
                          SİL
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Avans Kaydını Kalıcı Olarak Sil</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="py-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 mb-3">
                  ⚠️ UYARI: Bu işlem geri alınamaz!
                </h4>
                <div className="space-y-2 text-sm text-red-700">
                  <p><strong>Avans No:</strong> {selectedRequest.advance_number || selectedRequest.id}</p>
                  <p><strong>Talep Eden:</strong> {selectedRequest.requester_name}</p>
                  <p><strong>Tutar:</strong> {formatCurrency(selectedRequest.approved_amount, selectedRequest.currency)}</p>
                  <p><strong>Kategori:</strong> {selectedRequest.category}</p>
                  {selectedRequest.project && (
                    <p><strong>Proje:</strong> {selectedRequest.project}</p>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-gray-700 font-medium">
                Bu avans kaydını ve tüm ilişkili harcama kayıtlarını kalıcı olarak silmek istediğinizden emin misiniz?
              </p>
              
              <p className="text-xs text-gray-500">
                Not: Bu işlem sadece Admin ve Super Admin kullanıcıları tarafından yapılabilir.
              </p>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedRequest(null);
              }}
              disabled={deleting}
            >
              İptal
            </Button>
            <Button 
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                  Siliniyor...
                </>
              ) : (
                <>
                  <Trash2Icon className="w-4 h-4 mr-2" />
                  Kalıcı Olarak Sil
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdvanceClosing;