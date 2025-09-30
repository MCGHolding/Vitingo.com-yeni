import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivityTracker } from '../../hooks/useActivityTracker';
import Sidebar from './Sidebar';
import Header from './Header';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Menu,
  X
} from 'lucide-react';
import { customerStats, salesData } from '../../mock/data';
import { openOpportunities } from '../../mock/opportunitiesData';
import { mockUsers } from '../../mock/usersData';
import { allCustomers } from '../../mock/customersData';
import { allPeople } from '../../mock/peopleData';
import { mockFairs } from '../../mock/fairsData';
import ModernKPICard from './ModernKPICard';
import ModernSalesChart from './ModernSalesChart';
import SalesByCountryTable from './SalesByCountryTable';
import RecentTransactionsTable from './RecentTransactionsTable';
import TopCustomersCard from './TopCustomersCard';
import RealTimeSurveyStats from './RealTimeSurveyStats';
import GeographicSalesMap from './GeographicSalesMap';
import CurrencyTooltip from './CurrencyTooltip';
import SalesSummaryCard from './SalesSummaryCard';
import GrowthRateCard from './GrowthRateCard';
import PassiveLeadsCard from './PassiveLeadsCard';

// Import all page components
import NewOpportunityForm from '../Opportunities/NewOpportunityForm';
import OpenOpportunitiesPage from '../Opportunities/OpenOpportunitiesPage';
import WonOpportunitiesPage from '../Opportunities/WonOpportunitiesPage';
import LostOpportunitiesPage from '../Opportunities/LostOpportunitiesPage';
import FavoriteOpportunitiesPage from '../Opportunities/FavoriteOpportunitiesPage';
import AllOpportunitiesPage from '../Opportunities/AllOpportunitiesPage';
import NewCustomerForm from '../Customers/NewCustomerForm';
import NewPersonForm from '../Customers/NewPersonForm';
import AllPeoplePage from '../Customers/AllPeoplePage';
import AllCustomersPage from '../Customers/AllCustomersPage';
import InactiveCustomersPage from '../Customers/InactiveCustomersPage';
import FavoriteCustomersPage from '../Customers/FavoriteCustomersPage';
import UserManagementModal from '../UserManagement/UserManagementModal';
import AllUsersPage from '../UserManagement/AllUsersPage';
import NewUserFormModal from '../UserManagement/NewUserFormModal';
import AllFairsPage from '../Fairs/AllFairsPage';
import ActiveFairsPage from '../Fairs/ActiveFairsPage';
import PastFairsPage from '../Fairs/PastFairsPage';
import NewFairForm from '../Fairs/NewFairForm';
import ImportDataPage from '../Settings/ImportDataPage';
import ExportDataPage from '../Settings/ExportDataPage';
import SurveyManagementPage from '../Surveys/SurveyManagementPage';
import HandoverManagementPage from '../Handovers/HandoverManagementPage';
import NewInvoiceForm from '../Accounting/NewInvoiceForm';
import AllInvoicesPage from '../Accounting/AllInvoicesPage';
import NewBankForm from '../Accounting/NewBankForm';
import AllBanksPage from '../Accounting/AllBanksPage';
import NewSupplierForm from '../Suppliers/NewSupplierForm';
import AllSuppliersPage from '../Suppliers/AllSuppliersPage';
import NewExpenseReceiptForm from '../ExpenseReceipts/NewExpenseReceiptForm';
import AllExpenseReceiptsPage from '../ExpenseReceipts/AllExpenseReceiptsPage';
import PendingApprovalExpenseReceiptsPage from '../ExpenseReceipts/PendingApprovalExpenseReceiptsPage';
import ApprovedExpenseReceiptsPage from '../ExpenseReceipts/ApprovedExpenseReceiptsPage';
import PaidExpenseReceiptsPage from '../ExpenseReceipts/PaidExpenseReceiptsPage';
import NewBriefForm from '../Brief/NewBriefForm';
import AllBriefsPage from '../Brief/AllBriefsPage';

const DashboardWrapper = () => {
  const navigate = useNavigate();
  useActivityTracker();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewOpportunityForm, setShowNewOpportunityForm] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [opportunities, setOpportunities] = useState(openOpportunities);
  const [users, setUsers] = useState(mockUsers);
  const [customers, setCustomers] = useState([]);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [people, setPeople] = useState(allPeople);
  const [fairs, setFairs] = useState(mockFairs);
  const [showNewFairForm, setShowNewFairForm] = useState(false);
  const [surveyInitialTab, setSurveyInitialTab] = useState('send');

  // Customer Management Handlers
  const handleNewCustomer = () => {
    navigate('/customers/new');
  };

  const handleAllCustomers = () => {
    setCurrentView('all-customers');
  };

  const handleInactiveCustomers = () => {
    setCurrentView('inactive-customers');
  };

  const handleFavoriteCustomers = () => {
    setCurrentView('favorite-customers');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  // Add other handlers here as needed...

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load customers from backend API
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                          process.env.REACT_APP_BACKEND_URL || 
                          'https://crm-geo-fix.preview.emergentagent.com';
        console.log('Loading customers from:', backendUrl);
        const response = await fetch(`${backendUrl}/api/customers`);
        
        if (response.ok) {
          const customersData = await response.json();
          setCustomers(customersData);
          console.log('Customers loaded from database:', customersData.length);
        } else {
          console.log('Failed to load customers from API, using mock data');
          setCustomers(allCustomers);
        }
      } catch (error) {
        console.error('Error loading customers:', error);
        console.log('Using mock data as fallback');
        setCustomers(allCustomers);
      }
    };

    loadCustomers();
  }, []);

  const renderContent = () => {
    switch (currentView) {
      case 'all-customers':
        return <AllCustomersPage onBackToDashboard={handleBackToDashboard} customers={customers} />;
      case 'inactive-customers':
        return <InactiveCustomersPage customers={customers} onBackToDashboard={handleBackToDashboard} />;
      case 'favorite-customers':
        return <FavoriteCustomersPage customers={customers} onBackToDashboard={handleBackToDashboard} />;
      
      default:
        return (
          <>
            {/* Modern Top bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 shadow-xl px-4 py-6 lg:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    className="lg:hidden p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10"
                    onClick={toggleSidebar}
                  >
                    {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </button>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Vitingo CRM</h1>
                    <p className="text-slate-300 mt-1">Modern İş Yönetimi Dashboard'u</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">Bugün</p>
                    <p className="text-xs text-slate-300">
                      {new Date().toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-slate-600"></div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-white">Online</p>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-slate-300">Aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modern Dashboard content */}
            <div className="p-4 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
              {/* Welcome Message */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Hoş Geldiniz! 🚀</h2>
                    <p className="text-blue-100">Bugün harika bir performans sergiliyorsunuz. İşte özet durumunuz:</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end">
                      <p className="text-2xl font-bold">₺{(2847500).toLocaleString('tr-TR')}</p>
                      <CurrencyTooltip tryAmount={2847500} />
                    </div>
                    <p className="text-blue-100 text-sm">Bu Ayın Toplam Satışı</p>
                  </div>
                </div>
              </div>

              {/* KPI Grid - Modern Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <ModernKPICard
                  title="Toplam Satışlar"
                  value={2847500}
                  change="+23.8%"
                  changeType="positive"
                  icon={DollarSign}
                  gradient="from-green-500 to-green-600"
                  isCurrency={true}
                />
                <GrowthRateCard />
                <ModernKPICard
                  title="Aktif Müşteri"
                  value={892}
                  change="+42 bu ay"
                  changeType="positive"
                  icon={Users}
                  gradient="from-orange-500 to-orange-600"
                />
                <PassiveLeadsCard />
              </div>

              {/* Additional dashboard content... */}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        onDashboard={handleBackToDashboard}
        onNewCustomer={handleNewCustomer}
        onAllCustomers={handleAllCustomers}
        onInactiveCustomers={handleInactiveCustomers}
        onFavoriteCustomers={handleFavoriteCustomers}
        // Add other sidebar handlers as needed...
      />
      
      <Header 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        // Add header handlers as needed...
      />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {renderContent()}
      </div>
    </div>
  );
};

export default DashboardWrapper;