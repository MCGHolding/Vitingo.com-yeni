import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { formatAdvanceNumber } from '../../utils/formatters';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../ui/tooltip';

import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge.jsx';
import { Input } from '../ui/input';

import { 
  CalendarIcon,
  Banknote as BanknoteIcon,
  FileTextIcon,
  FolderIcon,
  UserIcon,
  MessageSquareIcon,
  ClockIcon,
  CheckCircleIcon,
  AlertCircleIcon as ExclamationCircleIcon,
  SearchIcon as MagnifyingGlassIcon,
  FilterIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  RefreshCwIcon,
  LockIcon
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const ClosedAdvances = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [closedRequests, setClosedRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]); // Users list for dropdown
  const [projects, setProjects] = useState([]); // Projects list for dropdown
  const [categories, setCategories] = useState([]); // Categories list for dropdown
  const [closedStats, setClosedStats] = useState({
    total_closed: 0,
    total_amount: 0,
    total_closed_amount: 0,
    this_month: 0,
    average_amount: 0
  });
  
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

  // Fetch users list
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend returns array of {user, role, manager}
      const usersList = response.data.map(item => item.user);
      setUsers(usersList || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch projects list from closed requests
  const fetchProjects = () => {
    const uniqueProjects = [...new Set(closedRequests.map(req => req.project).filter(Boolean))];
    setProjects(uniqueProjects);
  };

  // Fetch categories list from closed requests
  const fetchCategories = () => {
    const uniqueCategories = [...new Set(closedRequests.map(req => req.category).filter(Boolean))];
    setCategories(uniqueCategories);
  };

  useEffect(() => {
    fetchClosedAdvances();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (closedRequests.length > 0) {
      fetchProjects();
      fetchCategories();
    }
  }, [closedRequests]);

  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm, closedRequests]);

  const fetchClosedAdvances = async () => {
    try {
      setLoading(true);
      const [requestsResponse, statsResponse] = await Promise.all([
        axios.get(`${API}/api/advance-requests/closed`),
        axios.get(`${API}/api/advance-requests/closed/stats`)
      ]);
      
      console.log('Closed advances response:', requestsResponse.data);
      setClosedRequests(requestsResponse.data);
      setFilteredRequests(requestsResponse.data);
      console.log('Closed stats response:', statsResponse.data);
      setClosedStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching closed advances:', error);
      toast.error('Kapalı avanslar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    if (!closedRequests.length) return;

    let filtered = [...closedRequests];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.advance_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(req => {
        const closedDate = new Date(req.closed_at || req.request_date);
        const fromDate = new Date(filters.dateFrom);
        return closedDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(req => {
        const closedDate = new Date(req.closed_at || req.request_date);
        const toDate = new Date(filters.dateTo);
        return closedDate <= toDate;
      });
    }

    // Amount range filter
    if (filters.minAmount) {
      filtered = filtered.filter(req => req.amount >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(req => req.amount <= parseFloat(filters.maxAmount));
    }

    // Requester filter (exact match from dropdown)
    if (filters.requester) {
      filtered = filtered.filter(req => 
        req.requester_name === filters.requester
      );
    }

    // Project filter (exact match from dropdown)
    if (filters.project) {
      filtered = filtered.filter(req => 
        req.project === filters.project
      );
    }

    // Category filter (exact match from dropdown)
    if (filters.category) {
      filtered = filtered.filter(req => 
        req.category === filters.category
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
    setFilteredRequests(closedRequests);
  };

  const formatCurrency = (amount, currency = '₺') => {
    const numAmount = Number(amount) || 0;
    const formatter = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${formatter.format(numAmount)} ${currency}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tarih belirtilmemiş';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      'Ulaşım': '🚗',
      'Yemek': '🍽️',
      'Konaklama': '🏨',
      'Malzeme': '📦',
      'Hububat': '🌾',
      'Et Ürünleri': '🥩',
      'Süt Ürünleri': '🥛',
      'Temizlik': '🧽',
      'Kırtasiye': '📝',
      'Teknoloji': '💻',
      'Diğer': '📋'
    };
    return iconMap[category] || '📋';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'closed': { 
        text: 'Kapatıldı', 
        className: 'bg-green-100 text-green-800', 
        icon: CheckCircleIcon 
      }
    };

    const config = statusConfig[status] || { 
      text: status, 
      className: 'bg-gray-100 text-gray-800', 
      icon: ExclamationCircleIcon 
    };

    const IconComponent = config.icon;

    return (
      <Badge className={`${config.className} flex items-center space-x-1`}>
        <IconComponent className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    );
  };

  // Note: filteredRequests is now handled by applyFilters function

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Kapalı avanslar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="closed-advances-title">
              Kapanmış Avanslar
            </h1>
            <p className="text-gray-600">
              Tamamlanmış ve kapatılmış avans taleplerinin listesi
            </p>
          </div>
        </div>

        <Button onClick={fetchClosedAdvances} variant="outline" className="gap-2">
          <RefreshCwIcon className="w-4 h-4" />
          Yenile
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              🔒
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Toplam Kapatılan</p>
              <p className="text-lg font-bold text-gray-900">{closedStats.total_closed} Avans</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              💰
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Toplam Tutar</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(closedStats.total_amount)}</p>
              {closedStats.total_closed_amount !== undefined && closedStats.total_closed_amount !== null && (
                <p className="text-xs text-gray-900 mt-1">Kapanan: {formatCurrency(closedStats.total_closed_amount)}</p>
              )}
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              📅
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Bu Ay</p>
              <p className="text-lg font-bold text-gray-900">{closedStats.this_month} Avans</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              📊
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Ortalama Tutar</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(closedStats.average_amount)}</p>
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
              ({filteredRequests.length} / {closedRequests.length} avans)
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
                  placeholder="Avans numarası, kategori, proje ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlangıç Tarihi</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({...prev, dateFrom: e.target.value}))}
                  className="modern-date-picker"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
                  className="modern-date-picker"
                />
              </div>

              {/* Requester Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Talep Eden</label>
                <select
                  value={filters.requester}
                  onChange={(e) => setFilters(prev => ({...prev, requester: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Tüm Kullanıcılar</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.full_name}>
                      {u.full_name}
                    </option>
                  ))}
                </select>
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

              {/* Project Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proje</label>
                <select
                  value={filters.project}
                  onChange={(e) => setFilters(prev => ({...prev, project: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Tüm Projeler</option>
                  {projects.map((project, index) => (
                    <option key={index} value={project}>
                      {project}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Results */}

      {/* Results */}
      {filteredRequests.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Sonuç bulunamadı' : 'Henüz kapalı avans yok'}
          </h3>
          <p className="text-gray-600">
            {searchTerm ? 'Arama kriterlerinizle eşleşen kapalı avans bulunamadı.' : 'Kapatılmış avanslar burada görünecektir.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                      {getCategoryIcon(request.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">
                        <Tooltip content={request.advance_number || `AVS-${request.id.slice(0, 8)}`}>
                          <span className="font-mono cursor-help text-gray-900 hover:text-blue-600 transition-colors">
                            {formatAdvanceNumber(request.advance_number || `AVS-${request.id.slice(0, 8)}`)}
                          </span>
                        </Tooltip>
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {getStatusBadge(request.status)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(request.approved_amount || request.amount, request.currency)}
                    </div>
                    {/* Show original amount if different from approved */}
                    {request.approved_amount && request.approved_amount !== request.amount && (
                      <div className="text-xs text-gray-500 mt-1">
                        Talep: {formatCurrency(request.amount, request.currency)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <UserIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="font-medium">{request.requester_name || 'Bilinmiyor'}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <FolderIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{request.category}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <CalendarIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>{formatDate(request.request_date)}</span>
                  </div>

                  {request.project && (
                    <div className="flex items-center text-sm text-gray-600">
                      <BanknoteIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>{request.project}</span>
                    </div>
                  )}

                  {request.description && (
                    <div className="flex items-start text-sm text-gray-600">
                      <MessageSquareIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{request.description}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Kapanma: {formatDate(request.closure_date)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-3 space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={async () => {
                      console.log('Navigating to expense report for:', request.id);
                      
                      try {
                        // Fetch expense data for this closed advance
                        const response = await axios.get(`${API}/api/advance-expenses/${request.id}`);
                        const expenseLines = response.data;
                        
                        navigate(`/dashboard/expense-report/${request.id}`, {
                          state: {
                            fromClosedAdvances: true,
                            advanceRequest: request,
                            expenseLines: expenseLines
                          }
                        });
                      } catch (error) {
                        console.error('Error fetching expense data:', error);
                        toast.error('Harcama detayları yüklenirken hata oluştu');
                      }
                    }}
                  >
                    <FileTextIcon className="w-4 h-4 mr-2" />
                    Harcama detayları
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClosedAdvances;