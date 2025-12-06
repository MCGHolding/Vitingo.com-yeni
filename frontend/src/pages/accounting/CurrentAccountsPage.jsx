import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Dashboard from '../../components/Accounting/CurrentAccounts/Dashboard';
import Filters from '../../components/Accounting/CurrentAccounts/Filters';
import AccountsTable from '../../components/Accounting/CurrentAccounts/AccountsTable';
import WhatsAppModal from '../../components/WhatsApp/WhatsAppModal';

const CurrentAccountsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                    process.env.REACT_APP_BACKEND_URL || 
                    import.meta.env.VITE_BACKEND_URL ||
                    import.meta.env.REACT_APP_BACKEND_URL;
  
  // State
  const [accounts, setAccounts] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  
  // WhatsApp Modal
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [whatsAppRecipient, setWhatsAppRecipient] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, debtor, creditor, zero
  const [accountTypeFilter, setAccountTypeFilter] = useState(['customer', 'supplier', 'personnel']);
  const [sortBy, setSortBy] = useState('balance');
  const [sortOrder, setSortOrder] = useState('desc');
  const [overdueFilter, setOverdueFilter] = useState('all'); // all, 7, 15, 30, 60
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalReceivables: 0,
    totalPayables: 0,
    netBalance: 0,
    debtorCount: 0,
    creditorCount: 0,
    zeroBalanceCount: 0,
    overdueCount: 0
  });

  // Load accounts
  useEffect(() => {
    loadAccounts();
  }, []);

  // Apply filters
  useEffect(() => {
    applyFilters();
  }, [accounts, searchTerm, statusFilter, accountTypeFilter, sortBy, sortOrder, overdueFilter]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/current-accounts`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
        setStats(data.stats || stats);
      } else {
        loadMockData();
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      // Mock data for development
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    const mockAccounts = [
      { id: '1', accountNo: 'MUS-001', name: 'ABC Teknoloji Ltd. Şti.', type: 'customer', receivables: 125000, payables: 45000, balance: 80000, status: 'debtor', lastTransaction: '2025-12-01', riskScore: 3, overdueAmount: 0, currency: 'TRY' },
      { id: '2', accountNo: 'MUS-002', name: 'XYZ Otomotiv Sanayi A.Ş.', type: 'customer', receivables: 35000, payables: 85000, balance: -50000, status: 'creditor', lastTransaction: '2025-11-28', riskScore: 2, overdueAmount: 15000, currency: 'TRY' },
      { id: '3', accountNo: 'TED-001', name: 'Demir Çelik Sanayi Ltd.', type: 'supplier', receivables: 50000, payables: 50000, balance: 0, status: 'zero', lastTransaction: '2025-11-25', riskScore: 1, overdueAmount: 0, currency: 'TRY' },
      { id: '4', accountNo: 'MUS-003', name: 'Mega İnşaat Anonim Şirketi', type: 'customer', receivables: 250000, payables: 0, balance: 250000, status: 'debtor', lastTransaction: '2025-12-03', riskScore: 5, overdueAmount: 75000, currency: 'TRY' },
      { id: '5', accountNo: 'TED-002', name: 'Elektrik Malzemeleri Tic. A.Ş.', type: 'supplier', receivables: 15000, payables: 95000, balance: -80000, status: 'creditor', lastTransaction: '2025-11-20', riskScore: 2, overdueAmount: 0, currency: 'TRY' },
      { id: '6', accountNo: 'MUS-004', name: 'Global Yazılım Sistemleri', type: 'customer', receivables: 180000, payables: 30000, balance: 150000, status: 'debtor', lastTransaction: '2025-12-04', riskScore: 4, overdueAmount: 45000, currency: 'TRY' },
      { id: '7', accountNo: 'PER-001', name: 'Ahmet Yılmaz (Personel)', type: 'personnel', receivables: 5000, payables: 0, balance: 5000, status: 'debtor', lastTransaction: '2025-11-15', riskScore: 1, overdueAmount: 0, currency: 'TRY' },
      { id: '8', accountNo: 'MUS-005', name: 'Türk Havacılık ve Uzay San.', type: 'customer', receivables: 500000, payables: 120000, balance: 380000, status: 'debtor', lastTransaction: '2025-12-05', riskScore: 2, overdueAmount: 0, currency: 'TRY' },
    ];
    
    // Generate more mock data
    for (let i = 9; i <= 50; i++) {
      const isCustomer = Math.random() > 0.3;
      const receivables = Math.floor(Math.random() * 300000);
      const payables = Math.floor(Math.random() * 200000);
      const balance = receivables - payables;
      mockAccounts.push({
        id: String(i),
        accountNo: `${isCustomer ? 'MUS' : 'TED'}-${String(i).padStart(3, '0')}`,
        name: `Test Firma ${i} Ticaret Ltd. Şti.`,
        type: isCustomer ? 'customer' : 'supplier',
        receivables,
        payables,
        balance,
        status: balance > 0 ? 'debtor' : balance < 0 ? 'creditor' : 'zero',
        lastTransaction: '2025-11-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
        riskScore: Math.floor(Math.random() * 5) + 1,
        overdueAmount: Math.random() > 0.7 ? Math.floor(Math.random() * 50000) : 0,
        currency: 'TRY'
      });
    }
    
    setAccounts(mockAccounts);
    
    // Calculate stats
    const totalReceivables = mockAccounts.reduce((sum, acc) => sum + acc.receivables, 0);
    const totalPayables = mockAccounts.reduce((sum, acc) => sum + acc.payables, 0);
    setStats({
      totalAccounts: mockAccounts.length,
      totalReceivables,
      totalPayables,
      netBalance: totalReceivables - totalPayables,
      debtorCount: mockAccounts.filter(a => a.status === 'debtor').length,
      creditorCount: mockAccounts.filter(a => a.status === 'creditor').length,
      zeroBalanceCount: mockAccounts.filter(a => a.status === 'zero').length,
      overdueCount: mockAccounts.filter(a => a.overdueAmount > 0).length
    });
  };

  const applyFilters = () => {
    let filtered = [...accounts];
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(acc => 
        acc.name.toLowerCase().includes(term) ||
        acc.accountNo.toLowerCase().includes(term)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(acc => acc.status === statusFilter);
    }
    
    // Account type filter
    if (accountTypeFilter.length > 0 && accountTypeFilter.length < 4) {
      filtered = filtered.filter(acc => accountTypeFilter.includes(acc.type));
    }
    
    // Overdue filter
    if (overdueFilter !== 'all') {
      filtered = filtered.filter(acc => acc.overdueAmount > 0);
    }
    
    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'balance':
          aVal = Math.abs(a.balance);
          bVal = Math.abs(b.balance);
          break;
        case 'name':
          aVal = a.name;
          bVal = b.name;
          break;
        case 'receivables':
          aVal = a.receivables;
          bVal = b.receivables;
          break;
        case 'payables':
          aVal = a.payables;
          bVal = b.payables;
          break;
        case 'lastTransaction':
          aVal = new Date(a.lastTransaction);
          bVal = new Date(b.lastTransaction);
          break;
        default:
          aVal = a.balance;
          bVal = b.balance;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredAccounts(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAccountTypeFilter(['customer', 'supplier', 'personnel']);
    setSortBy('balance');
    setSortOrder('desc');
    setOverdueFilter('all');
  };

  // Pagination
  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);
  const paginatedAccounts = filteredAccounts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Bulk actions
  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedAccounts(paginatedAccounts.map(acc => acc.id));
    } else {
      setSelectedAccounts([]);
    }
  };

  const handleSelectAccount = (accountId) => {
    setSelectedAccounts(prev => 
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/current-accounts/export/excel`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tum_cari_hesaplar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Excel export sırasında hata oluştu');
    }
  };

  const handleExportPDF = async () => {
    alert('PDF export özelliği yakında eklenecek');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1600px] mx-auto p-6">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                💼 Cari Hesaplar
              </span>
            </h1>
            <p className="text-gray-500 mt-1">
              Tüm müşteri ve tedarikçi hesaplarının özeti
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Bulk Actions */}
            {selectedAccounts.length > 0 && (
              <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                <span className="text-sm text-blue-700">{selectedAccounts.length} seçili</span>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  📧 Toplu E-posta
                </button>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  📄 Toplu Ekstre
                </button>
              </div>
            )}
            
            {/* Export Buttons */}
            <button 
              onClick={handleExportExcel}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>
            <button 
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              PDF
            </button>
            
            {/* New Account Button */}
            <button 
              onClick={() => navigate(`/${tenantSlug}/cari-hesaplar/yeni`)}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-lg shadow-blue-500/30 flex items-center font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Yeni Hesap
            </button>
          </div>
        </div>

        {/* DASHBOARD */}
        <Dashboard stats={stats} loading={loading} />
        
        {/* FILTERS */}
        <Filters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          accountTypeFilter={accountTypeFilter}
          setAccountTypeFilter={setAccountTypeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          overdueFilter={overdueFilter}
          setOverdueFilter={setOverdueFilter}
          resetFilters={resetFilters}
          totalFiltered={filteredAccounts.length}
          totalAccounts={accounts.length}
        />
        
        {/* ACCOUNTS TABLE */}
        <AccountsTable
          accounts={paginatedAccounts}
          loading={loading}
          selectedAccounts={selectedAccounts}
          onSelectAll={handleSelectAll}
          onSelectAccount={handleSelectAccount}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={filteredAccounts.length}
          onPageChange={setCurrentPage}
        />
        
      </div>
    </div>
  );
};

export default CurrentAccountsPage;