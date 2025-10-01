import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Search,
  Filter,
  Calendar,
  DollarSign,
  Users,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  CreditCard,
  AlertCircle
} from 'lucide-react';

const CurrentAccountsPage = ({ onBackToDashboard }) => {
  const [customers, setCustomers] = useState([]);
  const [currentAccounts, setCurrentAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: ''
  });

  // Mock cari hesap verileri - gerçek uygulamada backend'den gelecek
  const mockCurrentAccountsData = [
    {
      id: 1,
      customer_id: "cust_001",
      customer_name: "ABC İnşaat A.Ş.",
      customer_short_name: "ABC İnşaat",
      debit: 0,        // Borç - bizim müşteriye borçlu olduğumuz
      credit: 15000,   // Alacak - bizim müşteriden alacaklı olduğumuz
      due_date: "2024-12-15", // Vade tarihi
    },
    {
      id: 2,
      customer_id: "cust_002", 
      customer_name: "XYZ Teknoloji Ltd. Şti.",
      customer_short_name: "XYZ Tech",
      debit: 8000,
      credit: 3000,
      due_date: "2024-09-15", // Vadesi geçmiş (13+ gün)
    },
    {
      id: 3,
      customer_id: "cust_003",
      customer_name: "DEF Pazarlama A.Ş.",
      customer_short_name: "DEF Pazarlama", 
      debit: 5000,
      credit: 5000,
      due_date: "2024-10-10", // Vadesi yakın geçmiş
    },
    {
      id: 4,
      customer_id: "cust_004",
      customer_name: "GHI Danışmanlık Ltd.",
      customer_short_name: "GHI Danışmanlık",
      debit: 2000,
      credit: 12000,
      due_date: "2024-09-20", // Vadesi geçmiş
    },
    {
      id: 5,
      customer_id: "cust_005", 
      customer_name: "JKL Turizm A.Ş.",
      customer_short_name: "JKL Turizm",
      debit: 0,
      credit: 0,
      due_date: "2024-11-30", // Vadesi henüz gelmemiş
    },
    {
      id: 6,
      customer_id: "cust_006",
      customer_name: "MNO Lojistik Ltd. Şti.",
      customer_short_name: "MNO Lojistik",
      debit: 15000,
      credit: 8000,
      due_date: "2024-08-25", // Çok vadesi geçmiş
    }
  ];

  // Load data on component mount
  useEffect(() => {
    loadCurrentAccounts();
  }, []);

  const loadCurrentAccounts = async () => {
    setIsLoading(true);
    try {
      // Gerçek uygulamada burası backend'den veri çekecek
      // Şimdilik mock veri kullanıyoruz
      setCurrentAccounts(mockCurrentAccountsData);
    } catch (error) {
      console.error('Error loading current accounts:', error);
      setCurrentAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format number for display
  const formatNumber = (value) => {
    if (!value && value !== 0) return '0,00';
    
    const numStr = Math.abs(value).toString();
    const parts = numStr.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    if (parts[1]) {
      return `${integerPart},${parts[1].padEnd(2, '0')}`;
    }
    
    return `${integerPart},00`;
  };

  // Calculate balance (Alacak - Borç)
  const calculateBalance = (credit, debit) => {
    return credit - debit;
  };

  // Get balance display with color
  const getBalanceDisplay = (balance) => {
    if (balance === 0) {
      return {
        text: `₺${formatNumber(0)}`,
        color: 'text-gray-500'
      };
    } else if (balance > 0) {
      return {
        text: `₺${formatNumber(balance)}`,
        color: 'text-green-600'
      };
    } else {
      return {
        text: `-₺${formatNumber(Math.abs(balance))}`,
        color: 'text-red-600'
      };
    }
  };

  // Calculate overdue days
  const calculateOverdueDays = (dueDate) => {
    if (!dueDate) return 0;
    
    const today = new Date();
    const due = new Date(dueDate);
    
    // Set time to start of day to avoid time zone issues
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const timeDiff = today.getTime() - due.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return daysDiff > 0 ? daysDiff : 0; // Only return positive overdue days
  };

  // Get overdue days display
  const getOverdueDaysDisplay = (dueDate) => {
    const overdueDays = calculateOverdueDays(dueDate);
    
    if (overdueDays > 0) {
      return {
        text: `-${overdueDays}`,
        isOverdue: true,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800'
      };
    } else {
      const today = new Date();
      const due = new Date(dueDate);
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      
      const timeDiff = due.getTime() - today.getTime();
      const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysUntilDue === 0) {
        return {
          text: 'Bugün',
          isOverdue: false,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      } else if (daysUntilDue > 0) {
        return {
          text: `${daysUntilDue} gün`,
          isOverdue: false,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      } else {
        return {
          text: '-',
          isOverdue: false,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
      }
    }
  };

  // Get status info
  const getStatusInfo = (credit, debit) => {
    if (debit > credit) {
      return {
        status: 'BORÇLU',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        action: 'ÖDE',
        actionBg: 'bg-gray-100',
        actionText: 'text-gray-700'
      };
    } else if (credit > debit) {
      return {
        status: 'ALACAKLI',
        bgColor: 'bg-green-100', 
        textColor: 'text-green-800',
        action: 'ÖDEME TALEBİ',
        actionBg: 'bg-gray-100',
        actionText: 'text-gray-700'
      };
    } else {
      return {
        status: 'KAPALI',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800', 
        action: 'KAPALI',
        actionBg: 'bg-gray-100',
        actionText: 'text-gray-700'
      };
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...currentAccounts];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(account => 
        account.customer_short_name.toLowerCase().includes(filters.search.toLowerCase()) ||
        account.customer_name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(account => {
        const statusInfo = getStatusInfo(account.credit, account.debit);
        return statusInfo.status.toLowerCase() === filters.status.toLowerCase();
      });
    }

    setFilteredAccounts(filtered);
  }, [filters, currentAccounts]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Calculate statistics
  const totalCreditors = currentAccounts.filter(acc => acc.credit > acc.debit).length;
  const totalDebtors = currentAccounts.filter(acc => acc.debit > acc.credit).length;
  const totalClosed = currentAccounts.filter(acc => acc.credit === acc.debit).length;
  
  const totalCredit = currentAccounts.reduce((sum, acc) => sum + acc.credit, 0);
  const totalDebit = currentAccounts.reduce((sum, acc) => sum + acc.debit, 0);
  const netBalance = totalCredit - totalDebit;
  
  // Calculate overdue accounts
  const overdueAccounts = currentAccounts.filter(acc => calculateOverdueDays(acc.due_date) > 0);
  const totalOverdue = overdueAccounts.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cari Hesaplar</h1>
            <p className="text-gray-600">{filteredAccounts.length} müşteri cari hesap durumu</p>
          </div>
        </div>
        <div className="flex space-x-3">
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
              <p className="text-sm font-medium text-gray-600">Toplam Alacak</p>
              <p className="text-2xl font-bold text-green-600">₺{formatNumber(totalCredit)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Borç</p>
              <p className="text-2xl font-bold text-red-600">₺{formatNumber(totalDebit)}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Net Bakiye</p>
              <div className={`text-2xl font-bold ${getBalanceDisplay(netBalance).color}`}>
                {getBalanceDisplay(netBalance).text}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vade Durumu</p>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-sm text-red-600">{totalOverdue} Vadesi Geçmiş</span>
                <span className="text-sm text-green-600">{totalCreditors} Alacaklı</span>
                <span className="text-sm text-gray-500">{totalClosed} Kapalı</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              Arama
            </label>
            <Input
              type="text"
              placeholder="Müşteri adı ara..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="alacakli">Alacaklı</option>
              <option value="borçlu">Borçlu</option>
              <option value="kapali">Kapalı</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={clearFilters}
              variant="outline"
              size="sm"
            >
              Filtreleri Temizle
            </Button>
          </div>
        </div>
      </div>

      {/* Current Accounts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Cari Hesaplar Tablosu ({filteredAccounts.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Sıra No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Müşteri Kısa Adı
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borç
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alacak
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bakiye
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vade Gün
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksiyon
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-gray-500">Cari hesaplar yükleniyor...</div>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-center">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Cari hesap bulunamadı</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {currentAccounts.length === 0 ? 'Henüz cari hesap kaydı bulunmuyor' : 'Filtre kriterlerinize uygun cari hesap bulunamadı'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((account, index) => {
                  const balance = calculateBalance(account.credit, account.debit);
                  const balanceDisplay = getBalanceDisplay(balance);
                  const statusInfo = getStatusInfo(account.credit, account.debit);
                  
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      {/* Sıra No */}
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-700">
                          {index + 1}
                        </div>
                      </td>

                      {/* Müşteri Kısa Adı */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {account.customer_short_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.customer_name}
                        </div>
                      </td>

                      {/* Borç */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₺{formatNumber(account.debit)}
                        </div>
                      </td>

                      {/* Alacak */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ₺{formatNumber(account.credit)}
                        </div>
                      </td>

                      {/* Bakiye */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-bold ${balanceDisplay.color}`}>
                          {balanceDisplay.text}
                        </div>
                      </td>

                      {/* Vade Gün */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(() => {
                          const overdueDaysInfo = getOverdueDaysDisplay(account.due_date);
                          return (
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${overdueDaysInfo.bgColor} ${overdueDaysInfo.textColor}`}>
                              {overdueDaysInfo.text}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Durum */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                          {statusInfo.status}
                        </span>
                      </td>

                      {/* Aksiyon */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded ${statusInfo.actionBg} ${statusInfo.actionText}`}>
                          {statusInfo.action}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CurrentAccountsPage;