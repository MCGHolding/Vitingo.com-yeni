import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import axios from 'axios';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { formatAdvanceNumber } from '../../utils/formatters';
import Tooltip from '../ui/tooltip';
import { 
  RefreshCwIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Banknote as BanknoteIcon,
  CalendarIcon,
  FileTextIcon,
  UserIcon,
  FilterIcon,
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SearchIcon as MagnifyingGlassIcon
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CurrentAccount = () => {
  const { user } = useAuth();
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filteredMovements, setFilteredMovements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]); // Users list for dropdown
  
  // View mode: "personal" or "company"
  const [viewMode, setViewMode] = useState('personal');
  
  // Check if user can see company view
  const canSeeCompanyView = () => {
    const roleName = user?.role?.name;
    return ['Super Admin', 'Süper Admin', 'Admin', 'Muhasebe'].includes(roleName);
  };
  
  // Filter states
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
    requester: '',
    advanceNumber: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch users list
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Backend returns array of {user, role, manager}
      // Extract just the user objects
      const usersList = response.data.map(item => item.user);
      setUsers(usersList || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch current account data with view_mode parameter
  const fetchAccountData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/current-account?view_mode=${viewMode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccountData(response.data);
      setFilteredMovements(response.data?.movements || []);
    } catch (error) {
      console.error('Error fetching current account:', error);
      toast.error('Cari hesap bilgileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = () => {
    if (!accountData?.movements) return;

    let filtered = [...accountData.movements];

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(movement => 
        movement.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        movement.advance_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(movement => {
        const closingDate = new Date(movement.closing_date);
        const fromDate = new Date(filters.dateFrom);
        return closingDate >= fromDate;
      });
    }
    if (filters.dateTo) {
      filtered = filtered.filter(movement => {
        const closingDate = new Date(movement.closing_date);
        const toDate = new Date(filters.dateTo);
        return closingDate <= toDate;
      });
    }

    // Amount range filter (based on taken_amount_try)
    if (filters.minAmount) {
      filtered = filtered.filter(movement => movement.taken_amount_try >= parseFloat(filters.minAmount));
    }
    if (filters.maxAmount) {
      filtered = filtered.filter(movement => movement.taken_amount_try <= parseFloat(filters.maxAmount));
    }

    // Requester filter
    if (filters.requester) {
      filtered = filtered.filter(movement => 
        movement.requester_name?.toLowerCase().includes(filters.requester.toLowerCase())
      );
    }

    // Advance number filter
    if (filters.advanceNumber) {
      filtered = filtered.filter(movement => 
        movement.advance_number?.toLowerCase().includes(filters.advanceNumber.toLowerCase())
      );
    }

    setFilteredMovements(filtered);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
      requester: '',
      advanceNumber: ''
    });
    setSearchTerm('');
    setFilteredMovements(accountData?.movements || []);
  };

  useEffect(() => {
    fetchAccountData();
    fetchUsers();
  }, [viewMode]); // Re-fetch when viewMode changes

  useEffect(() => {
    applyFilters();
  }, [filters, searchTerm, accountData]);

  // Format currency
  const formatCurrency = (amount, currency = 'TRY') => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    } else if (currency === 'EUR') {
      return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} €`;
    }
    return `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  // Get difference styling
  const getDifferenceStyle = (difference) => {
    if (difference < 0) {
      // Negatif fark = Kullanıcı az kapattı = Şirkete borçlu = Kırmızı
      return {
        color: 'text-red-600', 
        icon: <TrendingDownIcon className="w-4 h-4 inline ml-1" />,
        prefix: '-'
      };
    } else if (difference > 0) {
      // Pozitif fark = Kullanıcı fazla kapattı = Şirketten alacaklı = Yeşil
      return {
        color: 'text-green-600',
        icon: <TrendingUpIcon className="w-4 h-4 inline ml-1" />,
        prefix: '+'
      };
    }
    return {
      color: 'text-gray-600',
      icon: null,
      prefix: ''
    };
  };

  // Get balance styling
  const getBalanceStyle = (balance) => {
    if (balance < 0) {
      // Negatif bakiye = Kullanıcı borçlu = Kırmızı
      return 'text-red-600';
    } else if (balance > 0) {
      // Pozitif bakiye = Kullanıcı alacaklı = Yeşil
      return 'text-green-600';
    }
    // Sıfır bakiye = Gri
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCwIcon className="w-6 h-6 animate-spin mr-2" />
        <span>Cari hesap yükleniyor...</span>
      </div>
    );
  }

  if (!accountData || !accountData.movements || accountData.movements.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {viewMode === 'personal' ? 'Cari Hesap Ekstresi - Kişisel' : 'Cari Hesap Ekstresi - Şirket Geneli'}
            </h1>
            <p className="text-gray-600 mt-1">Tüm avans ve harcama geçmişinizin özeti</p>
          </div>
          
          {/* View Mode Toggle - Only for admin/muhasebe roles - Right aligned */}
          {canSeeCompanyView() && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('personal')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'personal'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kişisel
              </button>
              <button
                onClick={() => setViewMode('company')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'company'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Şirket Geneli
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        <Card className="p-12 text-center">
          <BanknoteIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz cari hesap hareketi yok</h3>
          <p className="text-gray-500">
            Avans talep ettikten sonra cari hesap hareketleriniz burada görünecektir.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <BanknoteIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {viewMode === 'personal' ? 'Cari Hesap Ekstresi - Kişisel' : 'Cari Hesap Ekstresi - Şirket Geneli'}
            </h1>
            <p className="text-gray-600">
              Tüm avans ve harcama geçmişinizin özeti
            </p>
          </div>
        </div>
        
        {/* View Mode Toggle - Only for admin/muhasebe roles - Right aligned */}
        {canSeeCompanyView() && (
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('personal')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'personal'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kişisel
            </button>
            <button
              onClick={() => setViewMode('company')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'company'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Şirket Geneli
            </button>
          </div>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              📊
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Toplam Hareket</p>
              <p className="text-lg font-bold text-gray-900">{filteredMovements.length} Adet</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              💰
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Toplam Alınan (TL)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(accountData.total_taken_try, 'TRY')}</p>
              <p className="text-xs text-gray-500 mt-1">Tüm para birimleri TL'ye çevrilmiştir</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              🔒
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Toplam Kapatılan (TL)</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(accountData.total_closed_try, 'TRY')}</p>
              <p className="text-xs text-gray-500 mt-1">Tüm para birimleri TL'ye çevrilmiştir</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 text-xl font-bold mr-4">
              ⚖️
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 font-medium">Bakiye</p>
              <p className={`text-lg font-bold ${accountData.current_balance_try < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {(accountData.current_balance_try < 0 ? '-' : '+')}{formatCurrency(Math.abs(accountData.current_balance_try), 'TRY')}
              </p>
              {accountData.current_balance_try < 0 && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  Şirkete Borçlusunuz
                </p>
              )}
              {accountData.current_balance_try > 0 && (
                <p className="text-xs text-green-600 font-medium mt-1">
                  Şirketten Alacaklısınız
                </p>
              )}
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
              ({filteredMovements.length} / {accountData.movements.length} hareket)
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arama</label>
                <Input
                  type="text"
                  placeholder="Talep eden, avans no ara..."
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
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bitiş Tarihi</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({...prev, dateTo: e.target.value}))}
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
            </div>
          </div>
        )}
      </Card>

      {/* Account Movements Table */}
      {filteredMovements.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BanknoteIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Sonuç bulunamadı' : 'Henüz hareket yok'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || Object.values(filters).some(value => value !== '') ? 'Arama kriterlerinizle eşleşen hareket bulunamadı.' : 'Cari hesap hareketleriniz burada görünecektir.'}
          </p>
        </Card>
      ) : (
        <Card>
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Hesap Hareketleri</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sıra No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avans No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Talep Eden
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapama Tarihi
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Alınan Avans
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kapatılan
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fark
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMovements.map((movement) => {
                  const diffStyle = getDifferenceStyle(movement.difference_original);
                  
                  return (
                    <tr key={movement.serial_no} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.serial_no}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <Tooltip content={movement.advance_number}>
                          <span className="font-mono cursor-help hover:text-blue-700 transition-colors">
                            {formatAdvanceNumber(movement.advance_number)}
                          </span>
                        </Tooltip>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                        {movement.requester_name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {movement.closing_date ? formatDate(movement.closing_date) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                        {formatCurrency(movement.taken_amount_original, movement.original_currency)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-medium">
                        {formatCurrency(movement.closed_amount_original, movement.original_currency)}
                      </td>
                      <td className={`px-4 py-4 whitespace-nowrap text-sm text-center font-medium ${diffStyle.color}`}>
                        {diffStyle.prefix}{formatCurrency(Math.abs(movement.difference_original), movement.original_currency)}
                        {diffStyle.icon}
                      </td>
                    </tr>
                  );
                })}
                
                {/* Total Row */}
                {filteredMovements.length > 0 && (
                  <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                    <td className="px-4 py-4 text-sm text-gray-900" colSpan="4">
                      TOPLAM
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900">
                      {/* Total Taken (Original Currency) - skip as mixed currencies */}
                      -
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-bold">
                      {/* Total Closed (Original Currency) - skip as mixed currencies */}
                      -
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center text-gray-900 font-bold">
                      {/* Total Difference in TRY */}
                      {(() => {
                        const totalDiff = filteredMovements.reduce((sum, m) => sum + (m.difference_try || 0), 0);
                        const diffColor = totalDiff < 0 ? 'text-red-600' : (totalDiff > 0 ? 'text-green-600' : 'text-gray-600');
                        const diffPrefix = totalDiff < 0 ? '-' : (totalDiff > 0 ? '+' : '');
                        return (
                          <span className={diffColor}>
                            {diffPrefix}{formatCurrency(Math.abs(totalDiff), 'TRY')}
                          </span>
                        );
                      })()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {filteredMovements.length} / {accountData.movements.length} hareket • Son güncelleme: {new Date().toLocaleString('tr-TR')}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default CurrentAccount;