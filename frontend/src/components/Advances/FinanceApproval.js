import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { formatAdvanceNumber } from '../../utils/formatters';
import Tooltip from '../ui/tooltip';
import { 
  CreditCardIcon,
  ClockIcon,
  RefreshCwIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  HelpCircleIcon,
  UserIcon,
  CalendarIcon,
  Banknote as BanknoteIcon,
  FileTextIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon as MagnifyingGlassIcon,
  XIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FinanceApproval = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [financeAdvances, setFinanceAdvances] = useState([]);
  const [filteredAdvances, setFilteredAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [question, setQuestion] = useState('');
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [approvedCount, setApprovedCount] = useState(0);
  const [approvedTotal, setApprovedTotal] = useState(0);
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

  // Check if user has finance approval permissions (for approve/reject actions)
  const hasFinancePermission = () => {
    const userRole = user?.role?.name;
    return ['Super Admin', 'Süper Admin', 'Admin', 'Finans', 'Muhasebe'].includes(userRole);
  };

  // Fetch finance pending advances and approved stats
  const fetchFinanceAdvances = async () => {
    try {
      setLoading(true);
      const [pendingResponse, statsResponse] = await Promise.all([
        axios.get(`${API}/finance-approval/pending`),
        axios.get(`${API}/finance-approval/stats`)
      ]);
      
      setFinanceAdvances(pendingResponse.data.advances || []);
      setFilteredAdvances(pendingResponse.data.advances || []);
      
      // Set approved statistics
      const stats = statsResponse.data;
      setApprovedCount(stats.approved_count || 0);
      setApprovedTotal(stats.approved_total || 0);
      
    } catch (error) {
      console.error('Error fetching finance advances:', error);
      if (error.response?.status === 403) {
        toast.error('Bu sayfaya erişim yetkiniz yok');
      } else {
        toast.error('Finans onayı listesi yüklenirken hata oluştu');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch expenses for an advance
  const fetchExpenses = async (advanceId) => {
    try {
      const response = await axios.get(`${API}/finance-approval/${advanceId}/expenses`);
      setExpenses(response.data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Harcama detayları yüklenirken hata oluştu');
    }
  };

  useEffect(() => {
    // Optimistic update: if returning from reject, remove the rejected item
    if (location.state?.refreshList && location.state?.rejectedId) {
      const rejectedId = location.state.rejectedId;
      
      // Remove from state immediately (optimistic)
      setFinanceAdvances(prev => prev.filter(adv => adv.id !== rejectedId));
      setFilteredAdvances(prev => prev.filter(adv => adv.id !== rejectedId));
      
      // Show message
      if (location.state.message) {
        toast.success(location.state.message);
      }
      
      // Clear navigation state
      navigate(location.pathname, { replace: true, state: {} });
    }
    
    fetchFinanceAdvances();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm, financeAdvances]);

  // Apply filters
  const applyFilters = () => {
    if (!financeAdvances.length) return;

    let filtered = [...financeAdvances];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(adv => 
        adv.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.advance_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter (request date)
    if (filters.dateFrom) {
      filtered = filtered.filter(adv => {
        const requestDate = new Date(adv.request_date);
        const fromDate = new Date(filters.dateFrom);
        return requestDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(adv => {
        const requestDate = new Date(adv.request_date);
        const toDate = new Date(filters.dateTo);
        return requestDate <= toDate;
      });
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(adv => adv.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(adv => adv.amount <= parseFloat(filters.maxAmount));
    }

    // Requester filter
    if (filters.requester) {
      filtered = filtered.filter(adv => 
        adv.requester_name?.toLowerCase().includes(filters.requester.toLowerCase())
      );
    }

    // Project filter
    if (filters.project) {
      filtered = filtered.filter(adv => 
        adv.project?.toLowerCase().includes(filters.project.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(adv => 
        adv.category?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    setFilteredAdvances(filtered);
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
    setFilteredAdvances(financeAdvances);
  };

  // Format currency
  const formatCurrency = (amount, currency = 'TRY') => {
    // Handle null, undefined, or invalid amounts
    const numAmount = Number(amount) || 0;
    
    if (currency === 'USD') {
      return `$${numAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    } else if (currency === 'EUR') {
      return `${numAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €`;
    }
    return `${numAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Open expense review modal
  const openExpenseModal = async (advance) => {
    setSelectedAdvance(advance);
    await fetchExpenses(advance.id);
    setShowExpenseModal(true);
  };

  // Handle expense approval
  const handleExpenseApproval = async (expenseId, action, notes = '') => {
    try {
      setProcessing(true);
      
      const endpoint = action === 'approve' ? 'approve' : 'reject';
      await axios.post(`${API}/finance-approval/${selectedAdvance.id}/expenses/${expenseId}/${endpoint}`, {
        notes: notes
      });
      
      toast.success(`Harcama ${action === 'approve' ? 'onaylandı' : 'reddedildi'}`);
      
      // Refresh expenses
      await fetchExpenses(selectedAdvance.id);
      
    } catch (error) {
      console.error(`Error ${action}ing expense:`, error);
      toast.error(`Harcama ${action === 'approve' ? 'onaylama' : 'reddetme'} sırasında hata oluştu`);
    } finally {
      setProcessing(false);
    }
  };

  // Open question modal
  const openQuestionModal = (expenseId = null) => {
    setSelectedExpenseId(expenseId);
    setQuestion('');
    setShowQuestionModal(true);
  };

  // Submit question
  const submitQuestion = async () => {
    if (!question.trim()) {
      toast.error('Lütfen bir soru yazın');
      return;
    }

    try {
      setProcessing(true);
      
      await axios.post(`${API}/finance-approval/${selectedAdvance.id}/questions`, {
        question: question.trim(),
        expense_id: selectedExpenseId
      });
      
      toast.success('Soru başarıyla gönderildi');
      setShowQuestionModal(false);
      setQuestion('');
      setSelectedExpenseId(null);
      
    } catch (error) {
      console.error('Error submitting question:', error);
      toast.error('Soru gönderme sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle final approval (move to closed status)
  const handleFinalApproval = async () => {
    if (!selectedAdvance) return;
    
    try {
      setProcessing(true);
      
      await axios.post(`${API}/finance-approval/${selectedAdvance.id}/finalize`, {
        notes: 'Finans departmanı onayı'
      });
      
      toast.success('Avans finans onayı tamamlandı');
      setShowExpenseModal(false);
      
      // Refresh the list
      await fetchFinanceAdvances();
      
    } catch (error) {
      console.error('Error finalizing approval:', error);
      toast.error(error.response?.data?.detail || 'Finans onayı sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Handle final rejection (move back to paid status)
  const handleFinalRejection = async () => {
    if (!selectedAdvance) return;
    
    const rejectionReason = prompt('Ret nedeni girin:');
    if (!rejectionReason?.trim()) {
      toast.error('Ret nedeni gereklidir');
      return;
    }
    
    try {
      setProcessing(true);
      
      await axios.post(`${API}/finance-approval/${selectedAdvance.id}/reject`, {
        reason: rejectionReason.trim(),
        notes: 'Finans departmanı reddi'
      });
      
      toast.success('Avans finans tarafından reddedildi');
      setShowExpenseModal(false);
      
      // Refresh the list
      await fetchFinanceAdvances();
      
    } catch (error) {
      console.error('Error rejecting approval:', error);
      toast.error(error.response?.data?.detail || 'Finans reddi sırasında hata oluştu');
    } finally {
      setProcessing(false);
    }
  };

  // Check permission
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCwIcon className="w-6 h-6 animate-spin mr-2" />
        <span>Finans onayları yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finans Onayı</h1>
          <p className="text-gray-600 mt-1">Finans departmanı onayı bekleyen avanslar</p>
        </div>
        <Button onClick={fetchFinanceAdvances} variant="outline" className="gap-2">
          <RefreshCwIcon className="w-4 h-4" />
          Yenile
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-700">Finans Onayı Bekleyen</p>
              <p className="text-lg font-bold text-orange-900">
                {filteredAdvances.length} Avans
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center">
            <CheckCircleIcon className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-700">Toplam Onaylanan</p>
              <p className="text-lg font-bold text-green-900">
                {approvedCount} Avans
              </p>
            </div>
          </div>
        </Card>
      </div>

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
              ({filteredAdvances.length} / {financeAdvances.length} avans)
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

              {/* Date From - Request Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Talep Tarihi (Başlangıç)</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Talep Tarihi (Bitiş)</label>
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

      {/* Finance Advances List */}
      {filteredAdvances.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Sonuç bulunamadı' : 'Finans onayı bekleyen avans yok'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Arama kriterlerinizle eşleşen avans bulunamadı.' : 'Şu anda finans departmanı onayını bekleyen herhangi bir avans bulunmamaktadır.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAdvances.map((advance) => (
            <Card key={advance.id} className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500">
              <div className="flex items-start justify-between">
                {/* Left Section - User and Basic Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {advance.requester_name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {advance.requester_email}
                      </p>
                      {advance.advance_number && (
                        <Tooltip content={advance.advance_number}>
                          <p className="text-xs text-gray-400 font-mono cursor-help hover:text-blue-500 transition-colors">
                            {formatAdvanceNumber(advance.advance_number)}
                          </p>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <FileTextIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Kategori</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {advance.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Kapatma Tarihi</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {advance.closed_at ? formatDate(advance.closed_at) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <BanknoteIcon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Onaylanan Tutar</p>
                        <p className="text-sm font-medium text-gray-700 mt-1">
                          {formatCurrency(advance.approved_amount || advance.amount, advance.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Amount and Actions */}
                <div className="text-right space-y-2 ml-6">
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Talep Edilen</div>
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(advance.amount, advance.currency)}
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500">Ödenen</div>
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(advance.approved_amount, advance.currency)}
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <Badge className="bg-orange-100 text-orange-800 px-3 py-1.5">
                      <ClockIcon className="w-4 h-4 mr-1" />
                      Finans Onayı Bekliyor
                    </Badge>
                  </div>

                  <div>
                    <Button 
                      onClick={() => navigate(`/dashboard/finance-approval/${advance.id}`)}
                      className="flex items-center gap-2"
                    >
                      <EyeIcon className="w-4 h-4" />
                      İncele
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Expense Review Modal */}
      <Dialog open={showExpenseModal} onOpenChange={setShowExpenseModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Harcama Detayları</DialogTitle>
            {selectedAdvance && (
              <p className="text-sm text-gray-600">
                {selectedAdvance.requester_name} - 
                <Tooltip content={selectedAdvance.advance_number}>
                  <span className="font-mono cursor-help ml-1 hover:text-blue-500 transition-colors">
                    {formatAdvanceNumber(selectedAdvance.advance_number)}
                  </span>
                </Tooltip>
              </p>
            )}
          </DialogHeader>
          
          {selectedAdvance && expenses.length > 0 && (
            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Onaylanan Tutar</p>
                    <p className="text-lg font-bold text-blue-600">
                      {formatCurrency(selectedAdvance.approved_amount || selectedAdvance.amount, selectedAdvance.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Toplam Harcama</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0), selectedAdvance.currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Kalan Bakiye</p>
                    <p className="text-lg font-bold text-gray-700">
                      {formatCurrency(
                        (selectedAdvance.approved_amount || selectedAdvance.amount) - expenses.reduce((sum, exp) => sum + exp.amount, 0),
                        selectedAdvance.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Expenses Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border p-2 text-left text-xs font-medium text-gray-500">Tarih</th>
                      <th className="border p-2 text-left text-xs font-medium text-gray-500">Tedarikçi</th>
                      <th className="border p-2 text-left text-xs font-medium text-gray-500">Kategori</th>
                      <th className="border p-2 text-left text-xs font-medium text-gray-500">Açıklama</th>
                      <th className="border p-2 text-center text-xs font-medium text-gray-500">Tutar</th>
                      <th className="border p-2 text-center text-xs font-medium text-gray-500">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="border p-2 text-sm">
                          {formatDate(expense.expense_date)}
                        </td>
                        <td className="border p-2 text-sm">
                          {expense.supplier}
                        </td>
                        <td className="border p-2 text-sm">
                          {expense.category}
                          {expense.subcategory && ` - ${expense.subcategory}`}
                        </td>
                        <td className="border p-2 text-sm">
                          {expense.description}
                        </td>
                        <td className="border p-2 text-sm text-center font-medium">
                          {formatCurrency(expense.amount, expense.currency)}
                        </td>
                        <td className="border p-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {/* Preview logic */}}
                              className="p-1"
                            >
                              <EyeIcon className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExpenseApproval(expense.id, 'approve')}
                              className="p-1"
                              disabled={processing}
                            >
                              <CheckCircleIcon className="w-4 h-4 text-green-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExpenseApproval(expense.id, 'reject')}
                              className="p-1"
                              disabled={processing}
                            >
                              <XCircleIcon className="w-4 h-4 text-red-600" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openQuestionModal(expense.id)}
                              className="p-1"
                            >
                              <HelpCircleIcon className="w-4 h-4 text-orange-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* General Question Button and Final Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => openQuestionModal()}
                  className="flex items-center gap-2"
                >
                  <HelpCircleIcon className="w-4 h-4" />
                  Genel Soru Sor
                </Button>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleFinalRejection()}
                    className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    disabled={processing}
                  >
                    <XCircleIcon className="w-4 h-4" />
                    Finans Reddi
                  </Button>
                  <Button
                    onClick={() => handleFinalApproval()}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                    disabled={processing}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Finans Onayı
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowExpenseModal(false)}
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Modal */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Soru Sor</DialogTitle>
            <p className="text-sm text-gray-600">
              {selectedExpenseId ? 'Harcama kalemi ile ilgili' : 'Genel'} bir soru sorun
            </p>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Sorunuzu yazın..."
              rows={4}
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowQuestionModal(false)}
              disabled={processing}
            >
              İptal
            </Button>
            <Button 
              onClick={submitQuestion}
              disabled={processing || !question.trim()}
            >
              {processing ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinanceApproval;