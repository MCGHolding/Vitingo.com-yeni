import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { useActivityTracker } from './hooks/useActivityTracker';
import Sidebar from './components/Dashboard/Sidebar';
import StatCard from './components/Dashboard/StatCard';
import RevenueChart from './components/Dashboard/RevenueChart';
import CustomerSegmentChart from './components/Dashboard/CustomerSegmentChart';
import ActivityFeed from './components/Dashboard/ActivityFeed';
import SalesFunnelChart from './components/Dashboard/SalesFunnelChart';
import TopPerformersTable from './components/Dashboard/TopPerformersTable';
import NewOpportunityForm from './components/Opportunities/NewOpportunityForm';
import OpenOpportunitiesPage from './components/Opportunities/OpenOpportunitiesPage';
import WonOpportunitiesPage from './components/Opportunities/WonOpportunitiesPage';
import LostOpportunitiesPage from './components/Opportunities/LostOpportunitiesPage';
import FavoriteOpportunitiesPage from './components/Opportunities/FavoriteOpportunitiesPage';
import AllOpportunitiesPage from './components/Opportunities/AllOpportunitiesPage';
import NewCustomerForm from './components/Customers/NewCustomerForm';
import NewPersonForm from './components/Customers/NewPersonForm';
import AllPeoplePage from './components/Customers/AllPeoplePage';
import AllCustomersPage from './components/Customers/AllCustomersPage';
import InactiveCustomersPage from './components/Customers/InactiveCustomersPage';
import FavoriteCustomersPage from './components/Customers/FavoriteCustomersPage';
import UserManagementModal from './components/UserManagement/UserManagementModal';
import AllUsersPage from './components/UserManagement/AllUsersPage';
import ViewUserModal from './components/UserManagement/ViewUserModal';
import EditUserModal from './components/UserManagement/EditUserModal';
import NewUserFormModal from './components/UserManagement/NewUserFormModal';
import AllFairsPage from './components/Fairs/AllFairsPage';
import ActiveFairsPage from './components/Fairs/ActiveFairsPage';
import PastFairsPage from './components/Fairs/PastFairsPage';
import NewFairForm from './components/Fairs/NewFairForm';
import ImportDataPage from './components/Settings/ImportDataPage';
import ExportDataPage from './components/Settings/ExportDataPage';
import { customerStats, salesData } from './mock/data';
import { openOpportunities } from './mock/opportunitiesData';
import { mockUsers } from './mock/usersData';
import { allCustomers } from './mock/customersData';
import { allPeople } from './mock/peopleData';
import { mockFairs } from './mock/fairsData';
import ModernKPICard from './components/Dashboard/ModernKPICard';
import ModernSalesChart from './components/Dashboard/ModernSalesChart';
import SalesByCountryTable from './components/Dashboard/SalesByCountryTable';
import RecentTransactionsTable from './components/Dashboard/RecentTransactionsTable';
import TopCustomersCard from './components/Dashboard/TopCustomersCard';
import RealTimeSurveyStats from './components/Dashboard/RealTimeSurveyStats';
import GeographicSalesMap from './components/Dashboard/GeographicSalesMap';
import CurrencyTooltip from './components/Dashboard/CurrencyTooltip';
import SalesSummaryCard from './components/Dashboard/SalesSummaryCard';
import GrowthRateCard from './components/Dashboard/GrowthRateCard';
import PassiveLeadsCard from './components/Dashboard/PassiveLeadsCard';
import SurveyManagementPage from './components/Surveys/SurveyManagementPage';
import SurveyFormPage from './components/Surveys/SurveyFormPage';
import HandoverManagementPage from './components/Handovers/HandoverManagementPage';
import HandoverFormPage from './components/Handovers/HandoverFormPage';
import NewInvoiceForm from './components/Accounting/NewInvoiceForm';
import AllInvoicesPage from './components/Accounting/AllInvoicesPage';
import NewBriefForm from './components/Brief/NewBriefForm';
import AllBriefsPage from './components/Brief/AllBriefsPage';
import Header from './components/Dashboard/Header';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Menu,
  X
} from 'lucide-react';

const Dashboard = () => {
  useActivityTracker();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewOpportunityForm, setShowNewOpportunityForm] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [opportunities, setOpportunities] = useState(openOpportunities);
  const [users, setUsers] = useState(mockUsers);
  const [customers, setCustomers] = useState(allCustomers);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [people, setPeople] = useState(allPeople);
  const [fairs, setFairs] = useState(mockFairs);
  const [showNewFairForm, setShowNewFairForm] = useState(false);
  const [surveyInitialTab, setSurveyInitialTab] = useState('send');

  // Load fairs from backend API
  useEffect(() => {
    const loadFairs = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
        const response = await fetch(`${backendUrl}/api/fairs`);
        
        if (response.ok) {
          const fairsData = await response.json();
          setFairs(fairsData);
          console.log('Fairs loaded from database:', fairsData.length);
        } else {
          console.log('Failed to load fairs from API, using mock data');
        }
      } catch (error) {
        console.error('Error loading fairs:', error);
        console.log('Using mock data as fallback');
      }
    };

    loadFairs();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewOpportunity = () => {
    setShowNewOpportunityForm(true);
  };

  const handleOpenOpportunities = () => {
    setCurrentView('open-opportunities');
  };

  const handleWonOpportunities = () => {
    setCurrentView('won-opportunities');
  };

  const handleLostOpportunities = () => {
    setCurrentView('lost-opportunities');
  };

  const handleFavoriteOpportunities = () => {
    setCurrentView('favorite-opportunities');
  };

  const handleAllOpportunities = () => {
    setCurrentView('all-opportunities');
  };

  // User Management Handlers
  const handleNewUser = () => {
    setShowNewUserForm(true);
  };

  const handleAllUsers = () => {
    setCurrentView('all-users');
  };

  const handleInactiveUsers = () => {
    setCurrentView('inactive-users');
  };

  const handleFormerUsers = () => {
    setCurrentView('former-users');
  };

  // Prospect Management Handlers
  const handleNewProspect = () => {
    console.log('New Prospect clicked');
    // TODO: Implement new prospect modal/form
  };

  const handleAllProspects = () => {
    console.log('All Prospects clicked');
    // TODO: Implement all prospects page view
  };

  // Quote Management Handlers
  const handleNewQuote = () => {
    console.log('New Quote clicked');
    // TODO: Implement new quote modal/form
  };

  // Customer Management Handlers
  const handleNewCustomer = () => {
    setShowNewCustomerForm(true);
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

  const closeCustomerForm = () => {
    setShowNewCustomerForm(false);
  };

  const saveCustomer = (customerData) => {
    const newCustomer = {
      ...customerData,
      id: Date.now()
    };
    setCustomers(prev => [newCustomer, ...prev]);
    console.log('New customer created:', newCustomer);
  };

  // People Management Handlers
  const handleNewPerson = () => {
    setShowNewPersonForm(true);
  };

  const handleAllPeople = () => {
    setCurrentView('all-people');
  };

  const closePersonForm = () => {
    setShowNewPersonForm(false);
  };

  const savePerson = (personData) => {
    const newPerson = {
      ...personData,
      id: Date.now()
    };
    console.log('Before update - People count:', people.length);
    setPeople(prev => {
      const updated = [newPerson, ...prev];
      console.log('After update - People count:', updated.length);
      console.log('New person data:', newPerson);
      return updated;
    });
  };

  const handleAllQuotes = () => {
    console.log('All Quotes clicked');
    // TODO: Implement all quotes page view
  };

  // Fair Management Handlers
  const handleNewFair = () => {
    setShowNewFairForm(true);
  };

  const handleAllFairs = () => {
    setCurrentView('all-fairs');
  };

  const handleActiveFairs = () => {
    setCurrentView('active-fairs');
  };

  const handlePastFairs = () => {
    setCurrentView('past-fairs');
  };

  const closeNewFairForm = () => {
    setShowNewFairForm(false);
  };

  const saveFair = (fairData) => {
    // fairData is already the response from backend API with proper ID
    setFairs(prev => [fairData, ...prev]);
    console.log('New fair saved to database:', fairData);
  };

  // Settings Management Handlers
  const handleImportData = () => {
    console.log('Import Data clicked');
    setCurrentView('import-data');
  };

  const handleExportData = () => {
    console.log('Export Data clicked');
    setCurrentView('export-data');
  };

  const handleSalesReports = () => {
    setCurrentView('sales-reports');
  };

  const handleCustomerReports = () => {
    setCurrentView('customer-reports');
  };

  const handleSurveys = () => {
    setSurveyInitialTab('send');
    setCurrentView('surveys');
  };

  const handleSurveyResults = () => {
    setSurveyInitialTab('results');
    setCurrentView('surveys');
  };

  const handleHandovers = () => {
    setCurrentView('handovers');
  };

  // Accounting handlers
  const handleNewInvoice = () => {
    setCurrentView('new-invoice');
  };

  const handleAllInvoices = () => {
    setCurrentView('all-invoices');
  };

  const handlePendingApproval = () => {
    setCurrentView('pending-approval');
  };

  const handlePendingCollection = () => {
    setCurrentView('pending-collection');
  };

  const handlePaidInvoices = () => {
    setCurrentView('paid-invoices');
  };

  const handleOverdueInvoices = () => {
    setCurrentView('overdue-invoices');
  };

  const handleCurrentAccounts = () => {
    setCurrentView('current-accounts');
  };

  const handleCollectionReceipt = () => {
    setCurrentView('collection-receipt');
  };

  const handleExpenseReceipt = () => {
    setCurrentView('expense-receipt');
  };

  const handlePaymentRequests = () => {
    setCurrentView('payment-requests');
  };

  const handlePurchaseInvoices = () => {
    setCurrentView('purchase-invoices');
  };

  const handlePurchaseApprovals = () => {
    setCurrentView('purchase-approvals');
  };

  // Brief handlers
  const handleNewBrief = () => {
    setCurrentView('new-brief');
  };

  const handleAllBriefs = () => {
    setCurrentView('all-briefs');
  };

  const handleClosedBriefs = () => {
    setCurrentView('closed-briefs');
  };

  const handlePassiveBriefs = () => {
    setCurrentView('passive-briefs');
  };

  const handleRequestBrief = () => {
    setCurrentView('request-brief');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  const closeOpportunityForm = () => {
    setShowNewOpportunityForm(false);
  };

  const closeUserManagementModal = () => {
    setShowUserManagementModal(false);
  };

  const saveUser = (userData) => {
    const newUser = {
      ...userData,
      id: Date.now(),
      status: 'active' // New users are active by default
    };
    setUsers(prev => [newUser, ...prev]);
    console.log('New user created:', newUser);
  };

  const updateUser = (updatedUser) => {
    setUsers(prev => prev.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    console.log('User updated:', updatedUser);
  };

  const saveOpportunity = (formData) => {
    // Generate new ID (get highest existing ID + 1)
    const maxId = Math.max(...opportunities.map(op => op.id));
    const newId = maxId + 1;

    // Create tags array from form data
    const tags = [];
    if (formData.country) {
      const countryMap = {
        'tr': 'TÜRKİYE',
        'de': 'ALMANYA',
        'us': 'ABD',
        'gb': 'İNGİLTERE',
        'fr': 'FRANSA'
      };
      if (countryMap[formData.country]) {
        tags.push(countryMap[formData.country]);
      }
    }

    if (formData.city) {
      const cityMap = {
        'istanbul': 'İSTANBUL',
        'frankfurt': 'FRANKFURT',
        'munich': 'MÜNİH',
        'cologne': 'KÖLN',
        'dusseldorf': 'DÜSSELDORF'
      };
      if (cityMap[formData.city]) {
        tags.push(cityMap[formData.city]);
      }
    }

    if (formData.tradeShowName) {
      tags.push(formData.tradeShowName.toUpperCase());
    }

    // Create new opportunity object
    const newOpportunity = {
      id: newId,
      customer: formData.customer,
      eventName: formData.subject || formData.tradeShowName || 'Yeni Etkinlik',
      amount: parseFloat(formData.amount) || 0,
      currency: formData.currency,
      status: formData.status || 'open-active',
      statusText: `Açık - Aktif - ${formData.stage === 'lead' ? 'Yeni Fırsat' : 
                   formData.stage === 'qualified' ? 'Nitelikli Fırsat' :
                   formData.stage === 'proposal' ? 'Teklif Bekleniyor' :
                   formData.stage === 'negotiation' ? 'Müzakere' : 'Değerlendiriliyor'}`,
      tags: tags,
      lastUpdate: new Date().toISOString().split('T')[0],
      contactPerson: formData.contactPerson || 'Belirtilmemiş'
    };

    // Add to opportunities list
    setOpportunities(prev => [newOpportunity, ...prev]);
    
    console.log('New opportunity saved:', newOpportunity);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'open-opportunities':
        return <OpenOpportunitiesPage onBackToDashboard={handleBackToDashboard} opportunities={opportunities} />;
      case 'won-opportunities':
        return <WonOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'lost-opportunities':
        return <LostOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'favorite-opportunities':
        return <FavoriteOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-opportunities':
        return <AllOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-customers':
        return <AllCustomersPage onBackToDashboard={handleBackToDashboard} />;
      case 'inactive-customers':
        return <InactiveCustomersPage onBackToDashboard={handleBackToDashboard} />;
      case 'favorite-customers':
        return <FavoriteCustomersPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-people':
        return (
          <AllPeoplePage 
            onBackToDashboard={handleBackToDashboard} 
            people={people}
            onUpdatePerson={(updatedPerson) => {
              setPeople(prev => prev.map(p => 
                p.id === updatedPerson.id ? updatedPerson : p
              ));
            }}
          />
        );
      case 'all-users':
        return (
          <AllUsersPage 
            users={users}
            onBack={handleBackToDashboard}
            onUpdateUser={updateUser}
          />
        );
      case 'inactive-users':
        return (
          <AllUsersPage 
            users={users.filter(user => user.status === 'inactive')}
            onBack={handleBackToDashboard}
            onUpdateUser={updateUser}
          />
        );
      case 'former-users':
        return (
          <AllUsersPage 
            users={users.filter(user => user.status === 'former')}
            onBack={handleBackToDashboard}
            onUpdateUser={updateUser}
          />
        );
      case 'all-fairs':
        return (
          <AllFairsPage 
            fairs={fairs}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'active-fairs':
        return (
          <ActiveFairsPage 
            fairs={fairs}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'past-fairs':
        return (
          <PastFairsPage 
            fairs={fairs}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'import-data':
        return (
          <ImportDataPage 
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'export-data':
        return (
          <ExportDataPage 
            onBackToDashboard={handleBackToDashboard}
          />
        );

      case 'surveys':
        return <SurveyManagementPage onBackToDashboard={handleBackToDashboard} initialTab={surveyInitialTab} />;

      case 'handovers':
        return <HandoverManagementPage onBackToDashboard={handleBackToDashboard} />;

      case 'sales-reports':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Satış Raporları</h1>
            <p className="text-gray-600">Satış raporları yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'customer-reports':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Müşteri Raporları</h1>
            <p className="text-gray-600">Müşteri raporları yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      // Accounting cases
      case 'new-invoice':
        return <NewInvoiceForm onBackToDashboard={handleBackToDashboard} />;

      case 'all-invoices':
        return <AllInvoicesPage onBackToDashboard={handleBackToDashboard} onNewInvoice={handleNewInvoice} />;

      case 'pending-approval':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Onay Bekleyenler</h1>
            <p className="text-gray-600">Onay bekleyen faturalar listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'pending-collection':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tahsilat Bekleyenler</h1>
            <p className="text-gray-600">Tahsilat bekleyen faturalar listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'paid-invoices':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ödenmiş</h1>
            <p className="text-gray-600">Ödenmiş faturalar listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'overdue-invoices':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Vadesi Geçmiş</h1>
            <p className="text-gray-600">Vadesi geçmiş faturalar listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'current-accounts':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Cari Hesaplar</h1>
            <p className="text-gray-600">Cari hesaplar yönetimi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'collection-receipt':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tahsilat Makbuzu</h1>
            <p className="text-gray-600">Tahsilat makbuzu oluşturma sayfası yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'expense-receipt':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Gider Makbuzu</h1>
            <p className="text-gray-600">Gider makbuzu oluşturma sayfası yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'payment-requests':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ödeme Talepleri</h1>
            <p className="text-gray-600">Ödeme talepleri listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'purchase-invoices':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Alış Faturaları</h1>
            <p className="text-gray-600">Alış faturaları listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'purchase-approvals':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Alış Fatura Onayları</h1>
            <p className="text-gray-600">Alış fatura onayları listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      // Brief cases
      case 'new-brief':
        return <NewBriefForm onBackToDashboard={handleBackToDashboard} />;

      case 'all-briefs':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tüm Briefler</h1>
            <p className="text-gray-600">Tüm briefler listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'closed-briefs':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Kapanmış Briefler</h1>
            <p className="text-gray-600">Kapanmış briefler listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'passive-briefs':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Pasif Briefler</h1>
            <p className="text-gray-600">Pasif briefler listesi yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

      case 'request-brief':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Brief Talep Et</h1>
            <p className="text-gray-600">Brief talep formu yakında eklenecek...</p>
            <button
              onClick={handleBackToDashboard}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Dashboard'a Dön
            </button>
          </div>
        );

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

              {/* Second Row KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <ModernKPICard
                  title="Açık Leadler"
                  value={89}
                  change="+12 bu hafta"
                  changeType="positive"
                  icon={Users}
                  gradient="from-cyan-500 to-cyan-600"
                />
                <ModernKPICard
                  title="Kaybedilen Leadler"
                  value={15}
                  change="-3 bu hafta"
                  changeType="positive"
                  icon={Users}
                  gradient="from-red-500 to-red-600"
                />
                <ModernKPICard
                  title="Toplam Alacaklar"
                  value={1234567}
                  change="+8.9%"
                  changeType="positive"
                  icon={DollarSign}
                  gradient="from-indigo-500 to-indigo-600"
                  isCurrency={true}
                />
                <ModernKPICard
                  title="CSAT Puanı"
                  value={87.5}
                  change="+2.3%"
                  changeType="positive"
                  icon={Target}
                  gradient="from-pink-500 to-pink-600"
                  isPercentage={true}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="xl:col-span-2">
                  <ModernSalesChart />
                </div>
                <RealTimeSurveyStats 
                  onDetailedReport={handleSurveyResults}
                  onSendSurvey={handleSurveys}
                />
              </div>

              {/* Sales Summary and Additional Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <SalesSummaryCard />
                <GeographicSalesMap />
              </div>

              {/* Tables Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                <SalesByCountryTable />
                <RecentTransactionsTable />
              </div>

              {/* Bottom Section */}
              <div className="grid grid-cols-1">
                <TopCustomersCard />
              </div>
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
        onNewOpportunity={handleNewOpportunity}
        onOpenOpportunities={handleOpenOpportunities}
        onWonOpportunities={handleWonOpportunities}
        onLostOpportunities={handleLostOpportunities}
        onFavoriteOpportunities={handleFavoriteOpportunities}
        onAllOpportunities={handleAllOpportunities}
        onNewCustomer={handleNewCustomer}
        onAllCustomers={handleAllCustomers}
        onInactiveCustomers={handleInactiveCustomers}
        onFavoriteCustomers={handleFavoriteCustomers}
        onNewPerson={handleNewPerson}
        onAllPeople={handleAllPeople}
        onNewProspect={handleNewProspect}
        onAllProspects={handleAllProspects}
        onNewQuote={handleNewQuote}
        onAllQuotes={handleAllQuotes}
        onNewFair={handleNewFair}
        onAllFairs={handleAllFairs}
        onActiveFairs={handleActiveFairs}
        onPastFairs={handlePastFairs}
        onImportData={handleImportData}
        onExportData={handleExportData}
        onSalesReports={handleSalesReports}
        onCustomerReports={handleCustomerReports}
        onHandovers={handleHandovers}
        onSurveys={handleSurveys}
        // Accounting handlers
        onNewInvoice={handleNewInvoice}
        onAllInvoices={handleAllInvoices}
        onPendingApproval={handlePendingApproval}
        onPendingCollection={handlePendingCollection}
        onPaidInvoices={handlePaidInvoices}
        onOverdueInvoices={handleOverdueInvoices}
        onCurrentAccounts={handleCurrentAccounts}
        onCollectionReceipt={handleCollectionReceipt}
        onExpenseReceipt={handleExpenseReceipt}
        onPaymentRequests={handlePaymentRequests}
        onPurchaseInvoices={handlePurchaseInvoices}
        onPurchaseApprovals={handlePurchaseApprovals}
        // Brief handlers
        onNewBrief={handleNewBrief}
        onAllBriefs={handleAllBriefs}
        onClosedBriefs={handleClosedBriefs}
        onPassiveBriefs={handlePassiveBriefs}
        onRequestBrief={handleRequestBrief}
      />
      
      {/* Header */}
      <Header 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        onNewUser={handleNewUser}
        onAllUsers={handleAllUsers}
        onInactiveUsers={handleInactiveUsers}
        onFormerUsers={handleFormerUsers}
      />
      
      {/* Main content */}
      <div className="lg:ml-64">
        {renderContent()}
      </div>

      {/* New Opportunity Form Modal */}
      {showNewOpportunityForm && (
        <NewOpportunityForm
          onClose={closeOpportunityForm}
          onSave={saveOpportunity}
        />
      )}
      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <NewCustomerForm
          onClose={closeCustomerForm}
          onSave={saveCustomer}
        />
      )}

      {/* New Person Form Modal */}
      {showNewPersonForm && (
        <NewPersonForm
          onClose={closePersonForm}
          onSave={savePerson}
        />
      )}

      {/* New User Form Modal */}
      {showNewUserForm && (
        <NewUserFormModal
          onClose={() => setShowNewUserForm(false)}
          onSave={(userData) => {
            console.log('New user created:', userData);
            setShowNewUserForm(false);
          }}
        />
      )}

      {/* User Management Modal */}
      {showUserManagementModal && (
        <UserManagementModal
          onClose={closeUserManagementModal}
          onSave={saveUser}
        />
      )}

      {/* New Fair Form Modal */}
      {showNewFairForm && (
        <NewFairForm
          onClose={closeNewFairForm}
          onSave={saveFair}
        />
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/survey/:token" 
              element={<SurveyFormPage />} 
            />
            <Route 
              path="/handover/:token" 
              element={<HandoverFormPage />} 
            />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;