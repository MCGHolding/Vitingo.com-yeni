import React, { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { useActivityTracker } from './hooks/useActivityTracker';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Dashboard/Sidebar';
import CalendarPage from './components/Calendar/CalendarPage';
import MeetingRequestsPage from './components/Calendar/MeetingRequestsPage';
import ArchivedMeetingsPage from './components/Calendar/ArchivedMeetingsPage';
import StatCard from './components/Dashboard/StatCard';
import RevenueChart from './components/Dashboard/RevenueChart';
import CustomerSegmentChart from './components/Dashboard/CustomerSegmentChart';
import ActivityFeed from './components/Dashboard/ActivityFeed';
import SalesFunnelChart from './components/Dashboard/SalesFunnelChart';
import TopPerformersTable from './components/Dashboard/TopPerformersTable';
import OpenOpportunitiesPage from './components/Opportunities/OpenOpportunitiesPage';
import WonOpportunitiesPage from './components/Opportunities/WonOpportunitiesPage';
import LostOpportunitiesPage from './components/Opportunities/LostOpportunitiesPage';
import FavoriteOpportunitiesPage from './components/Opportunities/FavoriteOpportunitiesPage';
import AllOpportunitiesPage from './components/Opportunities/AllOpportunitiesPage';
import EditOpportunityPage from './components/Opportunities/EditOpportunityPage';
import OpportunityTimelinePage from './components/Opportunities/OpportunityTimelinePage';
import OpportunityDetailPage from './pages/opportunities/OpportunityDetailPage';
import OpportunityEditPageNew from './pages/opportunities/OpportunityEditPage';
import FinansOnayiPage from './components/Avans/FinansOnayiPage';
import KapanmisAvanslarPage from './components/Avans/KapanmisAvanslarPage';
import NewCustomerForm from './components/Customers/NewCustomerForm';
import NewPersonFormPage from './components/Customers/NewPersonFormPage';
import NewOpportunityFormPage from './components/Opportunities/NewOpportunityFormPage';
import NewPersonForm from './components/Customers/NewPersonForm';
import AllPeoplePage from './components/Customers/AllPeoplePage';
import AllCustomersPage from './components/Customers/AllCustomersPage';
import InactiveCustomersPage from './components/Customers/InactiveCustomersPage';
import FavoriteCustomersPage from './components/Customers/FavoriteCustomersPage';
import PassiveCustomersPage from './components/Customers/PassiveCustomersPage';
import CustomerProspectsPage from './components/Customers/CustomerProspectsPage';
import ViewCustomerPage from './components/Customers/ViewCustomerPage';
import EditCustomerPage from './components/Customers/EditCustomerPage';
import EmailPage from './pages/customers/emails/EmailPage';
import DesignVersionsPage from './pages/customers/designs/DesignVersionsPage';
import ActivityPlannerPage from './pages/ActivityPlannerPageNew';
import UserManagementModal from './components/UserManagement/UserManagementModal';
import AllUsersPage from './components/UserManagement/AllUsersPage';
import ViewUserModal from './components/UserManagement/ViewUserModal';
import EditUserModal from './components/UserManagement/EditUserModal';
import NewUserFormModal from './components/UserManagement/NewUserFormModal';
import AllFairsPage from './components/Fairs/AllFairsPageNew';
import FutureFairsPage from './components/Fairs/FutureFairsPage';
import PastFairsPageNew from './components/Fairs/PastFairsPageNew';
import NewFairForm from './components/Fairs/NewFairForm';
import NewFairFormPage from './components/Fairs/NewFairFormPage';
import NewFairFormSimple from './components/Fairs/NewFairFormSimple';
import NewProjectForm from './components/Projects/NewProjectForm';
import AllProjectsPage from './components/Projects/AllProjectsPage';
import EditProjectPage from './components/Projects/EditProjectPage';
import OngoingProjectsPage from './components/Projects/OngoingProjectsPage';
import CompletedProjectsPage from './components/Projects/CompletedProjectsPage';
import CancelledProjectsPage from './components/Projects/CancelledProjectsPage';
import ImportDataPage from './components/Settings/ImportDataPage';
import ExportDataPage from './components/Settings/ExportDataPage';
import SettingsPage from './components/Settings/SettingsPage';
import GroupCompaniesPage from './components/Settings/GroupCompaniesPage';
import ContractManagementPage from './components/Settings/ContractManagementPage';
import UserManagementPage from './components/Settings/UserManagementPage';
import PositionsPage from './components/Settings/PositionsPage';
import DepartmentsPage from './components/Settings/DepartmentsPage';
import ExpenseCentersPage from './components/Settings/ExpenseCentersPage';
import AdvanceCategoriesPage from './components/Settings/AdvanceCategoriesPage';
import ExpenseCategoriesSettings from './components/Settings/ExpenseCategoriesSettings';
import TransactionTypesPage from './components/Settings/TransactionTypesPage';
import LibraryPage from './components/Settings/LibraryPage';
import ContractCreatePage from './components/Settings/ContractCreatePage';
import ManualTemplateCreator from './components/Settings/ManualTemplateCreator';
import ContractsPage from './components/Contracts/ContractsPage';
import { customerStats, salesData } from './mock/data';
// Removed mock data import - now using real API data
import { mockUsers } from './mock/usersData';
// import { allCustomers } from './mock/customersData'; // Removed - using real API
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
import EditInvoiceForm from './components/Accounting/EditInvoiceForm';
import DraftInvoicesPage from './components/Accounting/DraftInvoicesPage';
import PendingCollectionPage from './components/Accounting/PendingCollectionPage';
import PaidInvoicesPage from './components/Accounting/PaidInvoicesPage';
import OverdueInvoicesPage from './components/Accounting/OverdueInvoicesPage';
import CurrentAccountsPage from './pages/accounting/CurrentAccountsPage';
import CurrentAccountDetailPage from './pages/accounting/CurrentAccountDetailPage';
import CollectionReceiptPage from './components/Accounting/CollectionReceiptPage';
import CollectionReceiptApprovalPage from './components/Accounting/CollectionReceiptApprovalPage';
import NewBankForm from './components/Accounting/NewBankForm';
import AllBanksPage from './components/Accounting/AllBanksPage';
import NewSupplierForm from './components/Suppliers/NewSupplierForm';
import AllSuppliersPage from './components/Suppliers/AllSuppliersPage';
import ContactRegistrationPage from './components/Suppliers/ContactRegistrationPage';
import NewExpenseReceiptForm from './components/ExpenseReceipts/NewExpenseReceiptForm';
import AllExpenseReceiptsPage from './components/ExpenseReceipts/AllExpenseReceiptsPage';
import PendingApprovalExpenseReceiptsPage from './components/ExpenseReceipts/PendingApprovalExpenseReceiptsPage';
import ApprovedExpenseReceiptsPage from './components/ExpenseReceipts/ApprovedExpenseReceiptsPage';
import PaidExpenseReceiptsPage from './components/ExpenseReceipts/PaidExpenseReceiptsPage';
import ExpenseReceiptApprovalPage from './components/ExpenseReceipts/ExpenseReceiptApprovalPage';
import NewBriefForm from './components/Brief/NewBriefForm';
import NewCollectionForm from './components/Collections/NewCollectionForm';
import AllBriefsPage from './components/Brief/AllBriefsPage';
import ProposalProfilesPage from './pages/proposals/ProposalProfilesPage';
import ProposalProfileWizard from './pages/proposals/ProposalProfileWizard';
import NewProposalWizard from './pages/proposals/NewProposalWizard';
import ProposalListPage from './pages/proposals/ProposalListPage';
import NewCustomerPage from './pages/NewCustomerPage';
import Header from './components/Dashboard/Header';
import LandingPage from './components/Landing/LandingPage';
import GetStartedPage from './components/Landing/GetStartedPage';
import UltraAdminPage from './components/Landing/UltraAdminPage';
import LoginPage from './components/Auth/LoginPage';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Menu,
  X
} from 'lucide-react';

// === YENİ TENANT-BASED ROUTING ===
import TenantLayout from './layouts/TenantLayout';
import { DashboardPage } from './pages/dashboard';
import { 
  CustomerListPage, 
  CustomerDetailPage, 
  CustomerEditPage, 
  CustomerNewPage 
} from './pages/customers';
import {
  ProjectListPage,
  ProjectNewPage,
  ProjectEditPage as ProjectEditPageWrapper,
  OngoingProjectsPage as OngoingProjectsPageWrapper,
  CompletedProjectsPage as CompletedProjectsPageWrapper,
  CancelledProjectsPage as CancelledProjectsPageWrapper
} from './pages/projects';
import {
  CalendarViewPage,
  MeetingRequestsPage as MeetingRequestsPageWrapper,
  ArchivedMeetingsPage as ArchivedMeetingsPageWrapper
} from './pages/calendar';
import {
  OpportunityListPage,
  OpportunityNewPage,
  OpportunityDetailPageWrapper as OpportunityDetailPageNew,
  OpportunityEditPageWrapper as OpportunityEditPageWrapperNew,
  OpenOpportunitiesPageWrapper,
  WonOpportunitiesPageWrapper,
  LostOpportunitiesPageWrapper,
  FavoriteOpportunitiesPageWrapper
} from './pages/opportunities';
import {
  FairListPage,
  FairNewPage,
  FutureFairsPage as FutureFairsPageWrapper,
  PastFairsPage as PastFairsPageWrapper
} from './pages/fairs';
import {
  PeopleListPage,
  PersonNewPage
} from './pages/people';
import {
  ProposalListPageWrapper,
  ProposalNewPageWrapper,
  ProposalProfilesPageWrapper,
  ProposalProfileWizardWrapper
} from './pages/proposals/indexNew';
import {
  SupplierListPage,
  SupplierNewPage
} from './pages/suppliers';
import {
  BankListPage,
  BankNewPage
} from './pages/banks';
import {
  InvoiceListPage,
  InvoiceNewPage,
  InvoiceEditPage,
  DraftInvoicesPage as DraftInvoicesPageWrapper,
  PendingCollectionPage as PendingCollectionPageWrapper,
  PaidInvoicesPage as PaidInvoicesPageWrapper,
  OverdueInvoicesPage as OverdueInvoicesPageWrapper,
  PurchaseInvoiceListPage
} from './pages/invoices';
import {
  ExpenseReceiptListPage,
  ExpenseReceiptNewPage,
  PendingExpenseReceiptsPage as PendingExpenseReceiptsPageWrapper,
  ApprovedExpenseReceiptsPage as ApprovedExpenseReceiptsPageWrapper,
  PaidExpenseReceiptsPage as PaidExpenseReceiptsPageWrapper
} from './pages/expenses';
import {
  BriefListPage,
  BriefNewPage
} from './pages/briefs';
import { SurveyPage } from './pages/surveys';

// Avanslar pages
import {
  AdvanceListPage,
  AdvanceNewPage,
  AdvanceFinanceApprovalPage,
  AdvanceClosedPage,
  AdvanceClosingPage,
  AdvanceCurrentAccountPage
} from './pages/advances';
import {
  ContractListPage,
  ContractNewPage,
  ContractEditPage
} from './pages/contracts';
import {
  SettingsMainPage,
  GroupCompaniesPage as GroupCompaniesPageWrapper,
  UserManagementPage as UserManagementPageWrapper,
  DepartmentsPage as DepartmentsPageWrapper,
  PositionsPage as PositionsPageWrapper,
  ExpenseCentersPage as ExpenseCentersPageWrapper,
  LibraryPage as LibraryPageWrapper,
  ProfileSettingsPage,
  SecuritySettingsPage,
  CompanyInfoPage,
  ContractManagementPage as ContractManagementSettingsPage,
  PositionHierarchyPage,
  SupplierManagementPage,
  BankManagementSettingsPage,
  AdvanceRulesPage,
  CreditCardsPage,
  BankCreditCardCategoriesPage,
  TransactionTypesPage as TransactionTypesSettingsPage,
  AdvanceCategoriesPage as AdvanceCategoriesSettingsPage,
  UserPermissionsPage,
  DocumentPermissionsPage,
  PaymentPermissionsPage,
  AppSettingsPage,
  ExpenseCategoriesPage as ExpenseCategoriesSettingsPage,
  AdvanceManagementPage
} from './pages/settings';

const Dashboard = () => {
  useActivityTracker();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Changed to true - sidebar visible by default

  // ResizeObserver cleanup to prevent loop errors
  useEffect(() => {
    const handleResizeError = (e) => {
      if (e.message && e.message.includes('ResizeObserver')) {
        e.stopImmediatePropagation();
        return true;
      }
    };

    // Suppress ResizeObserver errors globally
    const debounceResizeObserver = () => {
      const ro = window.ResizeObserver;
      if (ro) {
        window.ResizeObserver = class extends ro {
          constructor(callback) {
            super((entries, observer) => {
              window.requestAnimationFrame(() => {
                callback(entries, observer);
              });
            });
          }
        };
      }
    };

    debounceResizeObserver();
    window.addEventListener('error', handleResizeError);
    
    return () => {
      window.removeEventListener('error', handleResizeError);
    };
  }, []);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  
  // Get initial view from URL path
  const getInitialView = () => {
    const path = window.location.pathname;
    
    // Check for edit routes first
    if (path.startsWith('/contracts/edit/')) {
      return 'contracts-edit';
    }
    
    const pathMap = {
      '/': 'dashboard',
      '/dashboard': 'dashboard',
      '/contracts': 'contracts',
      '/contracts/new': 'contracts-new',
      '/projects': 'projects',
      '/projects/new': 'new-project',
      '/projects/all': 'all-projects',
      '/customers': 'all-customers',
      '/customers/new': 'new-customer',
      '/opportunities': 'all-opportunities',
      '/opportunities/new': 'new-opportunity',
      '/proposals': 'proposal-list',
      '/proposals/new': 'new-proposal',
      '/proposals/profiles': 'proposal-profiles',
      '/proposals/profiles/new': 'new-proposal-profile',
      '/proposals/profiles/edit/:id': 'edit-proposal-profile',
      '/settings': 'settings',
      '/documents': 'documents',
      '/tasks': 'tasks',
      '/fairs': 'fairs',
      '/fairs/new': 'new-fair',
      '/accounting': 'muhasebe',
      '/bank': 'bank',
      '/people': 'people',
      '/suppliers': 'suppliers',
      '/surveys': 'surveys',
      '/briefs': 'briefs',
      '/hr': 'hr',
      '/analytics': 'analytics',
      '/reports': 'reports'
    };
    
    // Check exact match first
    if (pathMap[path]) {
      return pathMap[path];
    }
    
    // Check for partial matches
    if (path.startsWith('/projects/edit/')) {
      return 'edit-project';
    }
    if (path.startsWith('/customers/')) {
      return 'all-customers';
    }
    if (path.startsWith('/opportunities/')) {
      return 'all-opportunities';
    }
    
    return 'dashboard';
  };
  
  const [currentView, setCurrentView] = useState(getInitialView());
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  
  // Update URL when view changes (without reload)
  useEffect(() => {
    const viewToPath = {
      'dashboard': '/',
      'contracts': '/contracts',
      'contracts-new': '/contracts/new',
      'projects': '/projects',
      'new-project': '/projects/new',
      'all-projects': '/projects/all',
      'all-customers': '/customers',
      'new-customer': '/customers/new',
      'all-opportunities': '/opportunities',
      'new-opportunity': '/opportunities/new',
      'proposal-list': '/proposals',
      'new-proposal': '/proposals/new',
      'proposal-profiles': '/proposals/profiles',
      'new-proposal-profile': '/proposals/profiles/new',
      'edit-proposal-profile': '/proposals/profiles/edit',
      'settings': '/settings',
      'documents': '/documents',
      'tasks': '/tasks',
      'fairs': '/fairs',
      'new-fair': '/fairs/new',
      'muhasebe': '/accounting',
      'bank': '/bank',
      'people': '/people',
      'suppliers': '/suppliers',
      'surveys': '/surveys',
      'briefs': '/briefs',
      'hr': '/hr',
      'analytics': '/analytics',
      'reports': '/reports'
    };
    
    const newPath = viewToPath[currentView] || '/';
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, '', newPath);
    }
  }, [currentView]);
  
  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getInitialView());
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  const [opportunities, setOpportunities] = useState([]);
  const [users, setUsers] = useState(mockUsers);
  const [customers, setCustomers] = useState([]);
  // const [showNewCustomerForm, setShowNewCustomerForm] = useState(false); // Removed for page-based approach
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [people, setPeople] = useState(allPeople);
  const [fairs, setFairs] = useState(mockFairs);
  // const [showNewFairForm, setShowNewFairForm] = useState(false); // Removed for page-based approach
  const [surveyInitialTab, setSurveyInitialTab] = useState('send');
  const [editingProjectId, setEditingProjectId] = useState(null);
  // Supplier states
  const [showNewSupplierForm, setShowNewSupplierForm] = useState(false);
  const [showAllSuppliersPage, setShowAllSuppliersPage] = useState(false);
  
  // Invoice states
  const [selectedInvoiceForEdit, setSelectedInvoiceForEdit] = useState(null);
  
  // Bank state
  const [selectedBankForEdit, setSelectedBankForEdit] = useState(null);
  
  // Template state
  const [selectedTemplateForEdit, setSelectedTemplateForEdit] = useState(null);

  // Collection states
  const [showNewCollectionForm, setShowNewCollectionForm] = useState(false);
  
  // Opportunity edit states
  const [selectedOpportunityForEdit, setSelectedOpportunityForEdit] = useState(null);
  
  // Opportunity timeline states
  const [selectedOpportunityForTimeline, setSelectedOpportunityForTimeline] = useState(null);
  
  // Opportunity view/edit states (New)
  const [selectedOpportunityForView, setSelectedOpportunityForView] = useState(null);
  const [selectedOpportunityForEditNew, setSelectedOpportunityForEditNew] = useState(null);
  
  // Customer view/edit states
  const [selectedCustomerForView, setSelectedCustomerForView] = useState(null);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState(null);

  // Load fairs from backend API
  useEffect(() => {
    const loadFairs = async () => {
      try {
        // Try runtime config first, fallback to environment variables, then hardcoded  
        const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                          process.env.REACT_APP_BACKEND_URL || 
                          'https://vitingo-dashboard.preview.emergentagent.com';
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

  // Load customers from backend API
  const loadCustomers = async () => {
    try {
      // Try runtime config first, fallback to environment variables, then hardcoded
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-dashboard.preview.emergentagent.com';
      console.log('Loading customers from:', backendUrl);
      const response = await fetch(`${backendUrl}/api/customers`);
      
      if (response.ok) {
        const customersData = await response.json();
        setCustomers(customersData);
        console.log('✅ Customers loaded from database:', customersData.length);
      } else {
        console.error('❌ Failed to load customers from API, status:', response.status);
        setCustomers([]);
      }
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      setCustomers([]);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewOpportunity = () => {
    setCurrentView('new-opportunity');
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

  // Load all opportunities from API
  const loadOpportunities = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-dashboard.preview.emergentagent.com';
      
      const response = await fetch(`${backendUrl}/api/opportunities`);
      if (response.ok) {
        const data = await response.json();
        setOpportunities(data);
        console.log('Opportunities loaded:', data.length);
      } else {
        console.error('Failed to load opportunities');
      }
    } catch (error) {
      console.error('Error loading opportunities:', error);
    }
  };

  const handleAllOpportunities = () => {
    loadOpportunities(); // Refresh opportunities data when opening All Opportunities page
    setCurrentView('all-opportunities');
  };

  const handleEditOpportunity = (opportunity) => {
    setSelectedOpportunityForEdit(opportunity);
    setCurrentView('edit-opportunity');
  };

  const handleBackFromEditOpportunity = () => {
    setSelectedOpportunityForEdit(null);
    setCurrentView('all-opportunities'); // or open-opportunities depending on where user came from
  };

  const handleOpportunityTimeline = (opportunity) => {
    setSelectedOpportunityForTimeline(opportunity);
    setCurrentView('opportunity-timeline');
  };

  const handleBackFromOpportunityTimeline = () => {
    setSelectedOpportunityForTimeline(null);
    setCurrentView('edit-opportunity');
  };

  // New Opportunity view/edit handlers
  const handleViewOpportunity = (opportunity) => {
    setSelectedOpportunityForView(opportunity);
    setCurrentView('view-opportunity');
  };

  const handleEditOpportunityNew = (opportunity) => {
    setSelectedOpportunityForEditNew(opportunity);
    setCurrentView('edit-opportunity-new');
  };

  const handleBackFromViewOpportunity = () => {
    setSelectedOpportunityForView(null);
    setCurrentView('all-opportunities');
  };

  const handleBackFromEditOpportunityNew = () => {
    setSelectedOpportunityForEditNew(null);
    setCurrentView('all-opportunities');
  };

  const handleEditFromViewOpportunity = (opportunity) => {
    setSelectedOpportunityForView(null);
    setSelectedOpportunityForEditNew(opportunity);
    setCurrentView('edit-opportunity-new');
  };

  // Customer view/edit handlers
  const handleViewCustomer = (customer) => {
    setSelectedCustomerForView(customer);
    setCurrentView('view-customer');
  };

  const handleEditCustomerFromPage = (customer) => {
    setSelectedCustomerForEdit(customer);
    setCurrentView('edit-customer');
  };

  const handleBackFromViewCustomer = () => {
    setSelectedCustomerForView(null);
    setCurrentView('all-customers');
  };

  const handleBackFromEditCustomer = () => {
    setSelectedCustomerForEdit(null);
    setCurrentView('all-customers');
  };

  const handleSaveCustomerFromPage = async (updatedCustomer) => {
    try {
      // Try runtime config first, fallback to environment variables, then hardcoded
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-dashboard.preview.emergentagent.com';
      console.log('Updating customer to:', backendUrl);
      
      const response = await fetch(`${backendUrl}/api/customers/${updatedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCustomer)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers.entries()]);
      
      if (response.ok) {
        // Get response text first to debug JSON parsing issues
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        console.log('Response text length:', responseText.length);
        console.log('First 50 chars:', responseText.substring(0, 50));
        console.log('Last 50 chars:', responseText.substring(Math.max(0, responseText.length - 50)));
        
        try {
          const customer = JSON.parse(responseText);
          // Update customers list
          setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
          console.log('Customer updated:', customer);
          
          // Navigate back to customers list
          setSelectedCustomerForEdit(null);
          setCurrentView('all-customers');
          
          // Reload customers to get latest data
          loadCustomers();
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError);
          console.error('Failed to parse response as JSON:', responseText);
          alert('Müşteri kaydedilirken hata oluştu: ' + jsonError.message);
        }
      } else {
        // Get response text first for error responses too
        const responseText = await response.text();
        console.log('Error response text:', responseText);
        
        try {
          const errorData = JSON.parse(responseText);
          console.error('Failed to update customer:', errorData);
          alert('Müşteri güncellenirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
        } catch (jsonError) {
          console.error('Error response not JSON:', responseText);
          alert('Müşteri güncellenirken hata oluştu: ' + responseText || 'Bilinmeyen hata');
        }
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Müşteri güncellenirken hata oluştu: ' + error.message);
    }
  };

  const handleEditFromView = (customer) => {
    setSelectedCustomerForView(null);
    setSelectedCustomerForEdit(customer);
    setCurrentView('edit-customer');
  };

  // Avans handlers
  const handleNewAdvance = () => {
    navigate(`/${tenantSlug}/avanslar/yeni`);
  };

  const handleApprovedAdvances = () => {
    navigate(`/${tenantSlug}/avanslar/onaylilar`);
  };

  const handleFinansOnayi = () => {
    navigate(`/${tenantSlug}/avanslar/finans-onayi`);
  };

  const handleAdvanceClosing = () => {
    navigate(`/${tenantSlug}/avanslar/kapama`);
  };

  const handleKapanmisAvanslar = () => {
    navigate(`/${tenantSlug}/avanslar/kapanmis`);
  };

  const handleCurrentAccount = () => {
    navigate(`/${tenantSlug}/avanslar/cari-hesap`);
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

  // Customer Prospects Handler
  const handleCustomerProspects = () => {
    setCurrentView('customer-prospects');
  };

  // Quote Management Handlers
  const handleNewQuote = () => {
    setCurrentView('new-quote');
    console.log('New Quote clicked');
  };

  const handleWonQuotes = () => {
    setCurrentView('won-quotes');
    console.log('Won Quotes clicked');
  };

  const handleLostQuotes = () => {
    setCurrentView('lost-quotes');
    console.log('Lost Quotes clicked');
  };

  // Customer Management Handlers
  const [newCustomerInitialState, setNewCustomerInitialState] = useState({});

  const handleNewCustomer = (options = {}) => {
    const { returnToInvoice = false, isProspect = false } = typeof options === 'boolean' ? { returnToInvoice: options } : options;
    
    // Set initial state for form
    setNewCustomerInitialState({ isProspect });
    
    setCurrentView('new-customer');
    // Fatura sayfasından gelme durumunu işaretlemek için
    if (returnToInvoice) {
      sessionStorage.setItem('returnToInvoiceAfterCustomer', 'true');
    }
  };

  const handleCustomerAdded = (customerId, customerName) => {
    console.log('Yeni müşteri eklendi:', customerId, customerName);
    // Yeni müşteri bilgilerini session storage'da sakla
    sessionStorage.setItem('newlyAddedCustomer', JSON.stringify({
      id: customerId,
      name: customerName
    }));
    // Fatura sayfasına dön
    setCurrentView('new-invoice');
  };

  const handleNewPerson = () => {
    setCurrentView('new-person');
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

  // const closeCustomerForm = () => {
  //   setShowNewCustomerForm(false);
  // }; // Removed for page-based approach

  const saveCustomer = async (customerData) => {
    try {
      // Try runtime config first, fallback to environment variables, then hardcoded
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-dashboard.preview.emergentagent.com';
      console.log('Saving customer to:', backendUrl);
      const response = await fetch(`${backendUrl}/api/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const newCustomer = await response.json();
        setCustomers(prev => [newCustomer, ...prev]);
        console.log('New customer created:', newCustomer);
        
        // Navigate back to dashboard (success modal handled by form)
        setCurrentView('dashboard');
      } else {
        const errorData = await response.json();
        console.error('Failed to save customer:', errorData);
        alert('Müşteri kaydedilirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      alert('Müşteri kaydedilirken hata oluştu: ' + error.message);
    }
  };

  // Load all people from API
  const loadPeople = async () => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-dashboard.preview.emergentagent.com';
      
      const response = await fetch(`${backendUrl}/api/people`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
        console.log('People loaded:', data.length);
      } else {
        console.error('Failed to load people');
      }
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

  const savePerson = async (personData) => {
    try {
      const backendUrl = (window.ENV && window.ENV.REACT_APP_BACKEND_URL) || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://vitingo-dashboard.preview.emergentagent.com';
      console.log('Saving person to:', backendUrl);
      const response = await fetch(`${backendUrl}/api/people`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personData)
      });

      if (response.ok) {
        const newPerson = await response.json();
        setPeople(prev => [newPerson, ...prev]);
        console.log('New person created:', newPerson);
        
        // Reload people to ensure fresh data
        await loadPeople();
        
        // Navigate back to dashboard (success modal handled by form)
        setCurrentView('dashboard');
      } else {
        const errorData = await response.json();
        console.error('Failed to save person:', errorData);
        alert('Kişi kaydedilirken hata oluştu: ' + (errorData.detail || 'Bilinmeyen hata'));
      }
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Kişi kaydedilirken hata oluştu.');
    }
  };

  const handleAllPeople = () => {
    loadPeople(); // Refresh people data when opening All People page
    setCurrentView('all-people');
  };

  const closePersonForm = () => {
    setShowNewPersonForm(false);
  };

  const handleProposalProfiles = () => {
    setCurrentView('proposal-profiles');
  };

  const handleNewProposal = () => {
    setCurrentView('new-proposal');
    window.history.pushState({}, '', '/proposals/new');
  };

  const handleProposalList = () => {
    setCurrentView('proposal-list');
    window.history.pushState({}, '', '/proposals');
  };

  const handleDraftQuotes = () => {
    setCurrentView('proposal-list');
    window.history.pushState({}, '', '/proposals?status=draft');
  };

  const handleSentQuotes = () => {
    setCurrentView('proposal-list');
    window.history.pushState({}, '', '/proposals?status=sent');
  };

  const handleViewProposal = (proposalId) => {
    console.log('View proposal:', proposalId);
    // Store proposal ID for wizard to load
    setSelectedProposalId(proposalId);
    // Navigate to wizard to edit
    setCurrentView('new-proposal');
    window.history.pushState({}, '', `/proposals/edit/${proposalId}`);
  };

  // Project Management Handlers
  const handleNewProject = () => {
    setCurrentView('new-project');
  };

  const handleAllProjects = () => {
    setCurrentView('all-projects');
    setEditingProjectId(null);
  };

  const handleEditProject = (projectId) => {
    setEditingProjectId(projectId);
    setCurrentView('edit-project');
  };

  const handleOngoingProjects = () => {
    setCurrentView('ongoing-projects');
  };

  const handleCompletedProjects = () => {
    setCurrentView('completed-projects');
  };

  const handleCancelledProjects = () => {
    setCurrentView('cancelled-projects');
  };

  // Fair Management Handlers
  const handleNewFair = () => {
    setCurrentView('new-fair');
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
    setCurrentView('dashboard');
  };

  const saveFair = (fairData) => {
    // fairData is already the response from backend API with proper ID
    setFairs(prev => [fairData, ...prev]);
    console.log('New fair saved to database:', fairData);
  };

  // Settings Management Handlers
  const handleSettings = () => {
    console.log('Settings clicked');
    setCurrentView('settings');
  };

  const handleImportData = () => {
    console.log('Import Data clicked');
    setCurrentView('import-data');
  };

  const handleExportData = () => {
    console.log('Export Data clicked');
    setCurrentView('export-data');
  };

  // Contract Management Handlers
  const handleContracts = () => {
    console.log('Contracts clicked');
    setCurrentView('contracts');
  };

  const handleNewContract = () => {
    console.log('New Contract clicked');
    setCurrentView('contracts-new');
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

  const handleEditInvoice = (invoice) => {
    setSelectedInvoiceForEdit(invoice);
    setCurrentView('edit-invoice');
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

  const handleDraftInvoices = () => {
    setCurrentView('draft-invoices');
  };

  const handleCurrentAccounts = () => {
    setCurrentView('current-accounts');
  };

  const handleCollectionReceipt = () => {
    setCurrentView('collection-receipt');
  };

  const handleNewCollection = () => {
    setCurrentView('new-collection');
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

  // Bank handlers
  const handleNewBank = () => {
    setCurrentView('new-bank');
  };

  const handleAllBanks = () => {
    setCurrentView('all-banks');
  };

  const handleEditBank = (bank) => {
    console.log('Editing bank:', bank);
    setSelectedBankForEdit(bank);
    setCurrentView('edit-bank');
  };

  // Template handlers
  const handleEditTemplate = (template) => {
    console.log('Editing template:', template);
    setSelectedTemplateForEdit(template);
    setCurrentView('edit-template');
  };

  // Supplier handlers
  const handleNewSupplier = () => {
    setCurrentView('new-supplier');
  };

  const handleAllSuppliers = () => {
    setCurrentView('all-suppliers');
  };

  // Expense Receipt handlers
  const handleNewExpenseReceipt = () => {
    setCurrentView('new-expense-receipt');
  };

  const handleAllExpenseReceipts = () => {
    setCurrentView('all-expense-receipts');
  };

  const handlePendingExpenseReceipts = () => {
    setCurrentView('pending-expense-receipts');
  };

  const handleApprovedExpenseReceipts = () => {
    setCurrentView('approved-expense-receipts');
  };

  const handlePaidExpenseReceipts = () => {
    setCurrentView('paid-expense-receipts');
  };

  // Brief handlers
  const handleNewBrief = () => {
    setCurrentView('new-brief');
  };

  const handleCalendar = () => {
    console.log('🗓️ handleCalendar called - setting view to calendar');
    setCurrentView('calendar');
  };

  const handleNewMeeting = () => {
    console.log('➕ handleNewMeeting called - setting view to new-meeting');
    setCurrentView('new-meeting');
  };

  const handleMeetingInvitations = () => {
    console.log('📬 handleMeetingInvitations called - setting view to meeting-invitations');
    setCurrentView('meeting-invitations');
  };

  const handleMeetingRequests = () => {
    console.log('📋 handleMeetingRequests called - setting view to meeting-requests');
    setCurrentView('meeting-requests');
  };

  const handleArchivedMeetings = () => {
    console.log('📚 handleArchivedMeetings called - setting view to calendar-archive');
    setCurrentView('calendar-archive');
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

  const handleBackToDashboard = (targetView = 'dashboard') => {
    console.log('🔄 handleBackToDashboard called with targetView:', targetView);
    setCurrentView(targetView);
    
    // Scroll to top when navigating to new page
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const saveOpportunity = async (formData) => {
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
    
    // Reload opportunities to ensure fresh data from API
    await loadOpportunities();
    
    // Navigate back to dashboard (success modal handled by form)
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    console.log('🔍 renderContent called with currentView:', currentView);
    switch (currentView) {
      case 'open-opportunities':
        return <OpenOpportunitiesPage onBackToDashboard={handleBackToDashboard} opportunities={opportunities} onEditOpportunity={handleEditOpportunity} />;
      case 'won-opportunities':
        return <WonOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'lost-opportunities':
        return <LostOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'favorite-opportunities':
        return <FavoriteOpportunitiesPage onBackToDashboard={handleBackToDashboard} />;
      case 'all-opportunities':
        return <AllOpportunitiesPage onBackToDashboard={handleBackToDashboard} onEditOpportunity={handleEditOpportunity} onViewOpportunity={handleViewOpportunity} opportunities={opportunities} refreshOpportunities={loadOpportunities} />;
      case 'view-opportunity':
        return <OpportunityDetailPage 
          opportunityId={selectedOpportunityForView?.id}
          onBack={handleBackFromViewOpportunity}
          onEdit={handleEditFromViewOpportunity}
        />;
      case 'edit-opportunity-new':
        return <OpportunityEditPageNew 
          opportunityId={selectedOpportunityForEditNew?.id}
          onBack={handleBackFromEditOpportunityNew}
          onSave={(updatedOpportunity) => {
            console.log('Opportunity updated:', updatedOpportunity);
            loadOpportunities();
            setSelectedOpportunityForEditNew(null);
            setCurrentView('all-opportunities');
          }}
        />;
      case 'edit-opportunity':
        return <EditOpportunityPage 
          opportunity={selectedOpportunityForEdit} 
          onBack={handleBackFromEditOpportunity}
          onSave={(updatedOpportunity) => {
            console.log('Opportunity updated:', updatedOpportunity);
            setSelectedOpportunityForEdit(null);
            setCurrentView('all-opportunities');
          }}
          onNewOpportunity={handleNewOpportunity}
          onActivityTimeline={handleOpportunityTimeline}
        />;
      case 'opportunity-timeline':
        return <OpportunityTimelinePage 
          opportunityId={selectedOpportunityForTimeline?.id}
          opportunityTitle={selectedOpportunityForTimeline?.eventName || selectedOpportunityForTimeline?.title}
          onBack={handleBackFromOpportunityTimeline}
        />;
      case 'new-opportunity':
        return <NewOpportunityFormPage onSave={saveOpportunity} onClose={handleBackToDashboard} />;
      case 'new-customer':
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Yeni Müşteri Formu</h2>
            <NewCustomerForm 
              onSave={saveCustomer} 
              onClose={handleBackToDashboard}
              returnToInvoice={sessionStorage.getItem('returnToInvoiceAfterCustomer') === 'true'}
              onCustomerAdded={handleCustomerAdded}
              refreshCustomers={loadCustomers}
              initialIsProspect={newCustomerInitialState.isProspect || false}
            />
          </div>
        );
      case 'new-person':
        return <NewPersonFormPage onSave={savePerson} onClose={handleBackToDashboard} />;
      case 'all-customers':
        return <AllCustomersPage 
          key={`customers-${customers.length}`}
          onBackToDashboard={handleBackToDashboard} 
          customers={customers} 
          refreshCustomers={loadCustomers}
          onNewCustomer={handleNewCustomer}
          onViewCustomer={handleViewCustomer}
          onEditCustomer={handleEditCustomerFromPage}
        />;
      case 'view-customer':
        return <ViewCustomerPage 
          customer={selectedCustomerForView}
          onBack={handleBackFromViewCustomer}
          onEdit={handleEditFromView}
        />;
      case 'edit-customer':
        return <EditCustomerPage 
          customer={selectedCustomerForEdit}
          onBack={handleBackFromEditCustomer}
          onSave={handleSaveCustomerFromPage}
        />;
      case 'inactive-customers':
        return <PassiveCustomersPage customers={customers} onBackToDashboard={handleBackToDashboard} refreshCustomers={loadCustomers} />;
      case 'favorite-customers':
        return <FavoriteCustomersPage customers={customers} onBackToDashboard={handleBackToDashboard} refreshCustomers={loadCustomers} />;
      case 'customer-prospects':
        return <CustomerProspectsPage onBackToDashboard={handleBackToDashboard} refreshCustomers={loadCustomers} onNewCustomer={handleNewCustomer} />;
      case 'all-people':
        return (
          <AllPeoplePage 
            onBackToDashboard={handleBackToDashboard} 
            people={people}
            refreshPeople={loadPeople}
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
      case 'future-fairs':
        return (
          <FutureFairsPage 
            fairs={fairs}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'past-fairs':
        return (
          <PastFairsPageNew 
            fairs={fairs}
            onBackToDashboard={handleBackToDashboard}
          />
        );
      case 'new-fair':
        return <NewFairFormSimple onClose={handleBackToDashboard} />;
      
      case 'new-project':
        return <NewProjectForm onBackToDashboard={handleBackToDashboard} onClose={handleBackToDashboard} />;
      
      case 'all-projects':
        return <AllProjectsPage onBackToDashboard={handleBackToDashboard} onEditProject={handleEditProject} />;
      
      case 'edit-project':
        return (
          <EditProjectPage 
            projectId={editingProjectId}
            onClose={handleAllProjects}
            onSave={() => {
              handleAllProjects();
            }}
          />
        );
      
      case 'ongoing-projects':
        return <OngoingProjectsPage onBackToDashboard={handleBackToDashboard} />;
      
      case 'completed-projects':
        return <CompletedProjectsPage onBackToDashboard={handleBackToDashboard} />;
      
      case 'cancelled-projects':
        return <CancelledProjectsPage onBackToDashboard={handleBackToDashboard} />;
      
      case 'settings':
        return (
          <SettingsPage 
            onBack={handleBackToDashboard}
            currentUser={user}
            onNavigate={(view) => setCurrentView(view)}
          />
        );

      case 'group-companies':
        return (
          <GroupCompaniesPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'contract-management':
        return (
          <ContractManagementPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'user-management':
        return (
          <UserManagementPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'user-positions':
        return (
          <PositionsPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'department-management':
        return (
          <DepartmentsPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'expense-centers':
        return (
          <ExpenseCentersPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'advance-categories':
        return (
          <AdvanceCategoriesPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'expense-categories':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span>←</span>
                    <span>Geri</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 py-8">
              <ExpenseCategoriesSettings />
            </div>
          </div>
        );

      case 'transaction-types':
        return (
          <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setCurrentView('settings')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <span>←</span>
                    <span>Geri</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-6 py-8">
              <TransactionTypesPage />
            </div>
          </div>
        );

      case 'library':
        return (
          <LibraryPage 
            onBack={() => setCurrentView('settings')}
          />
        );

      case 'contracts':
        return (
          <ContractsPage 
            onBack={handleBackToDashboard}
            user={user}
            setCurrentView={setCurrentView}
          />
        );

      case 'contracts-new':
        return (
          <ContractCreatePage 
            onBack={() => setCurrentView('contracts')}
            fromContracts={true}
            onEditTemplate={handleEditTemplate}
          />
        );

      case 'contracts-edit':
        // Extract contract ID from URL
        const contractId = window.location.pathname.split('/').pop();
        return (
          <ContractCreatePage 
            onBack={() => setCurrentView('contracts')}
            fromContracts={true}
            contractId={contractId}
            isEdit={true}
            onEditTemplate={handleEditTemplate}
          />
        );

      case 'edit-template':
        return (
          <ManualTemplateCreator
            templateToEdit={selectedTemplateForEdit}
            onBack={() => {
              setSelectedTemplateForEdit(null);
              setCurrentView('contracts-new');
            }}
            onComplete={() => {
              setSelectedTemplateForEdit(null);
              setCurrentView('contracts-new');
            }}
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
        return <NewInvoiceForm onBackToDashboard={handleBackToDashboard} onNewCustomer={handleNewCustomer} />;

      case 'all-invoices':
        return <AllInvoicesPage onBackToDashboard={handleBackToDashboard} onNewInvoice={handleNewInvoice} onEditInvoice={handleEditInvoice} />;

      case 'edit-invoice':
        return <EditInvoiceForm 
          invoice={selectedInvoiceForEdit} 
          onBackToAllInvoices={handleAllInvoices}
          onSaveSuccess={() => {
            setSelectedInvoiceForEdit(null);
            setCurrentView('all-invoices');
          }}
        />;

      case 'new-bank':
        return <NewBankForm 
          onBackToDashboard={handleBackToDashboard} 
          onGoToBanks={() => setActiveContent('all-banks')}
        />;
      
      case 'edit-bank':
        return <NewBankForm 
          bankToEdit={selectedBankForEdit} 
          onBackToDashboard={() => {
            setSelectedBankForEdit(null);
            handleBackToDashboard();
          }}
          onGoToBanks={() => {
            setSelectedBankForEdit(null);
            setActiveContent('all-banks');
          }}
        />;

      case 'bank-management':
      case 'all-banks':
        return <AllBanksPage onBackToDashboard={handleBackToDashboard} onNewBank={handleNewBank} onEditBank={handleEditBank} />;

      case 'new-supplier':
        return <NewSupplierForm onClose={handleBackToDashboard} />;

      case 'all-suppliers':
        return <AllSuppliersPage onBackToDashboard={handleBackToDashboard} onNewSupplier={handleNewSupplier} />;

      // Avans cases
      case 'finans-onayi':
        return <FinansOnayiPage onBackToDashboard={handleBackToDashboard} />;

      case 'kapanmis-avanslar':
        return <KapanmisAvanslarPage onBackToDashboard={handleBackToDashboard} />;

      // Expense Receipt cases
      case 'new-expense-receipt':
        return <NewExpenseReceiptForm onBackToDashboard={handleBackToDashboard} />;

      case 'all-expense-receipts':
        return <AllExpenseReceiptsPage onBackToDashboard={handleBackToDashboard} onNewExpenseReceipt={handleNewExpenseReceipt} />;

      case 'pending-expense-receipts':
        return <PendingApprovalExpenseReceiptsPage onBackToDashboard={handleBackToDashboard} onNewExpenseReceipt={handleNewExpenseReceipt} />;

      case 'approved-expense-receipts':
        return <ApprovedExpenseReceiptsPage onBackToDashboard={handleBackToDashboard} onNewExpenseReceipt={handleNewExpenseReceipt} />;

      case 'paid-expense-receipts':
        return <PaidExpenseReceiptsPage onBackToDashboard={handleBackToDashboard} onNewExpenseReceipt={handleNewExpenseReceipt} />;

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
        return <PendingCollectionPage 
          onBackToDashboard={handleBackToDashboard} 
          onNewInvoice={handleNewInvoice}
          onEditInvoice={handleEditInvoice}
        />;

      case 'paid-invoices':
        return <PaidInvoicesPage 
          onBackToDashboard={handleBackToDashboard} 
          onNewInvoice={handleNewInvoice}
          onEditInvoice={handleEditInvoice}
        />;

      case 'overdue-invoices':
        return <OverdueInvoicesPage 
          onBackToDashboard={handleBackToDashboard} 
          onNewInvoice={handleNewInvoice}
          onEditInvoice={handleEditInvoice}
        />;

      // Quote cases (old - removed, replaced with new-teklif)

      // All quote/teklif cases REMOVED

      case 'draft-invoices':
        return <DraftInvoicesPage 
          onBackToDashboard={handleBackToDashboard} 
          onNewInvoice={handleNewInvoice}
          onEditInvoice={handleEditInvoice}
        />;

      case 'current-accounts':
        return <CurrentAccountsPage 
          onBackToDashboard={handleBackToDashboard} 
        />;

      case 'collection-receipt':
        return <CollectionReceiptPage 
          onBackToDashboard={handleBackToDashboard}
        />;

      case 'new-collection':
        return <NewCollectionForm 
          onBackToDashboard={handleBackToDashboard}
        />;

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
        return <AllBriefsPage onBackToDashboard={handleBackToDashboard} onNewBrief={handleNewBrief} />;

      // Teklif cases (v2 - new system)
      case 'proposal-profiles':
        return <ProposalProfilesPage onBackToDashboard={handleBackToDashboard} />;
      
      case 'new-proposal-profile':
        return <ProposalProfileWizard />;
      
      case 'edit-proposal-profile':
        return <ProposalProfileWizard />;
      
      case 'proposal-list':
        return <ProposalListPage onNewProposal={handleNewProposal} onViewProposal={handleViewProposal} />;
      
      case 'new-proposal':
        return <NewProposalWizard onBack={handleProposalList} editProposalId={selectedProposalId} />;

      // Calendar cases
      case 'calendar':
      case 'new-meeting':
      case 'meeting-invitations':
        console.log('🗓️ SUCCESS: Rendering CalendarPage component for currentView:', currentView);
        return <CalendarPage currentUser={{ id: 'demo_user', role: user?.role || 'user', name: user?.name || 'Demo User' }} />;
      
      case 'meeting-requests':
        console.log('📋 SUCCESS: Rendering MeetingRequestsPage component for currentView:', currentView);
        return <MeetingRequestsPage currentUser={{ id: 'demo_user', role: user?.role || 'user', name: user?.name || 'Demo User' }} />;

      case 'calendar-archive':
        console.log('📚 SUCCESS: Rendering ArchivedMeetingsPage component');
        return <ArchivedMeetingsPage onBack={handleBackToDashboard} />;

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

      case 'collection-receipt-approval':
        // Extract signature key from URL or state
        const urlParams = new URLSearchParams(window.location.search);
        const signatureKey = urlParams.get('key') || currentView.signatureKey;
        return <CollectionReceiptApprovalPage 
          signatureKey={signatureKey}
        />;

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
                  {/* Navigation Buttons */}
                  <button
                    onClick={() => window.location.href = '/ultra-admin'}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ultra Admin
                  </button>
                  
                  <button
                    onClick={() => window.location.href = '/landing'}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Ana Sayfa
                  </button>
                  
                  <div className="h-8 w-px bg-slate-600"></div>
                  
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
                  value={customers?.length || 0}
                  change={customers?.length > 0 ? `${customers.length} müşteri` : "Müşteri yok"}
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
        user={user}
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
        onCustomerProspects={handleCustomerProspects}
        onNewPerson={handleNewPerson}
        onAllPeople={handleAllPeople}
        // Removed old quote handlers - replaced with new Teklif handlers
        onSentQuotes={handleSentQuotes}
        onWonQuotes={handleWonQuotes}
        onLostQuotes={handleLostQuotes}
        onNewFair={handleNewFair}
        onAllFairs={handleAllFairs}
        onActiveFairs={handleActiveFairs}
        onPastFairs={handlePastFairs}
        // Project handlers
        onNewProject={handleNewProject}
        onAllProjects={handleAllProjects}
        onOngoingProjects={handleOngoingProjects}
        onCompletedProjects={handleCompletedProjects}
        onCancelledProjects={handleCancelledProjects}
        onSettings={handleSettings}
        onImportData={handleImportData}
        onExportData={handleExportData}
        // Contract handlers
        onContracts={handleContracts}
        onNewContract={handleNewContract}
        onSalesReports={handleSalesReports}
        onCustomerReports={handleCustomerReports}
        onHandovers={handleHandovers}
        onSurveys={handleSurveys}
        // Accounting handlers
        onNewInvoice={handleNewInvoice}
        onAllInvoices={handleAllInvoices}
        onPendingApproval={handlePendingApproval}
        onDraftInvoices={handleDraftInvoices}
        onPendingCollection={handlePendingCollection}
        onPaidInvoices={handlePaidInvoices}
        onOverdueInvoices={handleOverdueInvoices}
        onCurrentAccounts={handleCurrentAccounts}
        onCollectionReceipt={handleCollectionReceipt}
        onNewCollection={handleNewCollection}
        onPaymentRequests={handlePaymentRequests}
        // Expense Receipt handlers
        onNewExpenseReceipt={handleNewExpenseReceipt}
        onAllExpenseReceipts={handleAllExpenseReceipts}
        onPendingExpenseReceipts={handlePendingExpenseReceipts}
        onApprovedExpenseReceipts={handleApprovedExpenseReceipts}
        onPaidExpenseReceipts={handlePaidExpenseReceipts}
        onPurchaseInvoices={handlePurchaseInvoices}
        onPurchaseApprovals={handlePurchaseApprovals}
        // Bank handlers
        onNewBank={handleNewBank}
        onAllBanks={handleAllBanks}
        // Supplier handlers  
        onNewSupplier={handleNewSupplier}
        onAllSuppliers={handleAllSuppliers}
        // Avans handlers
        onNewAdvance={handleNewAdvance}
        onApprovedAdvances={handleApprovedAdvances}
        onFinansOnayi={handleFinansOnayi}
        onAdvanceClosing={handleAdvanceClosing}
        onKapanmisAvanslar={handleKapanmisAvanslar}
        onCurrentAccount={handleCurrentAccount}
        // Brief handlers
        onNewBrief={handleNewBrief}
        onAllBriefs={handleAllBriefs}
        onClosedBriefs={handleClosedBriefs}
        onPassiveBriefs={handlePassiveBriefs}
        // Teklif handlers (v2 - new system)
        onProposalList={handleProposalList}
        onNewProposal={handleNewProposal}
        onDraftQuotes={handleDraftQuotes}
        onSentQuotes={handleSentQuotes}
        onProposalProfiles={handleProposalProfiles}
        onRequestBrief={handleRequestBrief}
        // Calendar handlers
        onCalendar={handleCalendar}
        onNewMeeting={handleNewMeeting}
        onMeetingInvitations={handleMeetingInvitations}
        onMeetingRequests={handleMeetingRequests}
        onArchivedMeetings={handleArchivedMeetings}
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

      {/* New Customer Form Modal - Removed for page-based approach */}

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

      {/* New Fair Form Modal - Removed, now using page-based approach */}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route 
              path="/landing" 
              element={<LandingPage />} 
            />
            <Route 
              path="/get-started" 
              element={<GetStartedPage />} 
            />
            <Route 
              path="/ultra-admin" 
              element={<UltraAdminPage />} 
            />
            <Route 
              path="/login" 
              element={<LoginPage />} 
            />
            
            {/* === YENİ TENANT-BASED ROUTES === */}
            {/* Bu route'lar önce kontrol edilir */}
            <Route path="/:tenantSlug" element={<ProtectedRoute><TenantLayout /></ProtectedRoute>}>
              {/* Dashboard */}
              <Route index element={<DashboardPage />} />
              
              {/* Müşteriler - DOĞRU SIRALAMA: Statik path'ler ÖNCE */}
              <Route path="musteriler">
                <Route index element={<CustomerListPage />} />
                {/* Statik path'ler ÖNCE (yeni, pasif, favoriler, adaylar) */}
                <Route path="yeni" element={<CustomerNewPage />} />
                <Route path="pasif" element={<CustomerListPage />} />
                <Route path="favoriler" element={<CustomerListPage />} />
                <Route path="adaylar" element={<CustomerListPage />} />
                {/* Dinamik path'ler SONRA (:customerId) */}
                <Route path=":customerId" element={<CustomerDetailPage />} />
                <Route path=":customerId/duzenle" element={<CustomerEditPage />} />
              </Route>

              {/* Projeler */}
              <Route path="projeler">
                <Route index element={<ProjectListPage />} />
                <Route path="yeni" element={<ProjectNewPage />} />
                <Route path="devam-eden" element={<OngoingProjectsPageWrapper />} />
                <Route path="tamamlanan" element={<CompletedProjectsPageWrapper />} />
                <Route path="iptal" element={<CancelledProjectsPageWrapper />} />
                <Route path=":projectId/duzenle" element={<ProjectEditPageWrapper />} />
              </Route>

              {/* Takvim */}
              <Route path="takvim">
                <Route index element={<CalendarViewPage />} />
                <Route path="talepler" element={<MeetingRequestsPageWrapper />} />
                <Route path="arsiv" element={<ArchivedMeetingsPageWrapper />} />
              </Route>

              {/* Fırsatlar */}
              <Route path="firsatlar">
                <Route index element={<OpportunityListPage />} />
                <Route path="yeni" element={<OpportunityNewPage />} />
                <Route path="acik" element={<OpenOpportunitiesPageWrapper />} />
                <Route path="kazanilan" element={<WonOpportunitiesPageWrapper />} />
                <Route path="kaybedilen" element={<LostOpportunitiesPageWrapper />} />
                <Route path="favoriler" element={<FavoriteOpportunitiesPageWrapper />} />
                <Route path=":opportunityId" element={<OpportunityDetailPageNew />} />
                <Route path=":opportunityId/duzenle" element={<OpportunityEditPageWrapperNew />} />
              </Route>

              {/* Fuarlar */}
              <Route path="fuarlar">
                <Route index element={<FairListPage />} />
                <Route path="yeni" element={<FairNewPage />} />
                <Route path="aktif" element={<FutureFairsPageWrapper />} />
                <Route path="gelecek" element={<FutureFairsPageWrapper />} />
                <Route path="gecmis" element={<PastFairsPageWrapper />} />
              </Route>

              {/* Kişiler */}
              <Route path="kisiler">
                <Route index element={<PeopleListPage />} />
                <Route path="yeni" element={<PersonNewPage />} />
              </Route>

              {/* Teklifler */}
              <Route path="teklifler">
                <Route index element={<ProposalListPageWrapper />} />
                <Route path="yeni" element={<ProposalNewPageWrapper />} />
                <Route path="profiller" element={<ProposalProfilesPageWrapper />} />
                <Route path="profiller/yeni" element={<ProposalProfileWizardWrapper />} />
                <Route path="profiller/:profileId/duzenle" element={<ProposalProfileWizardWrapper />} />
                <Route path=":proposalId" element={<ProposalNewPageWrapper />} />
                <Route path=":proposalId/duzenle" element={<ProposalNewPageWrapper />} />
              </Route>

              {/* Tedarikçiler */}
              <Route path="tedarikciler">
                <Route index element={<SupplierListPage />} />
                <Route path="yeni" element={<SupplierNewPage />} />
              </Route>

              {/* Bankalar */}
              <Route path="bankalar">
                <Route index element={<BankListPage />} />
                <Route path="yeni" element={<BankNewPage />} />
              </Route>

              {/* Faturalar */}
              <Route path="faturalar">
                <Route index element={<InvoiceListPage />} />
                <Route path="yeni" element={<InvoiceNewPage />} />
                <Route path="taslak" element={<DraftInvoicesPageWrapper />} />
                <Route path="bekleyen" element={<PendingCollectionPageWrapper />} />
                <Route path="odenmis" element={<PaidInvoicesPageWrapper />} />
                <Route path="vadesi-gecmis" element={<OverdueInvoicesPageWrapper />} />
                <Route path=":invoiceId/duzenle" element={<InvoiceEditPage />} />
              </Route>

              {/* Cari Hesaplar */}
              <Route path="cari-hesaplar" element={<CurrentAccountsPage />} />
              <Route path="cari-hesaplar/:accountId" element={<CurrentAccountDetailPage />} />

              {/* Alış Faturaları */}
              <Route path="alis-faturalari" element={<PurchaseInvoiceListPage />} />

              {/* Gider Makbuzları */}
              <Route path="gider-makbuzu">
                <Route index element={<ExpenseReceiptListPage />} />
                <Route path="yeni" element={<ExpenseReceiptNewPage />} />
                <Route path="onay-bekleyen" element={<PendingExpenseReceiptsPageWrapper />} />
                <Route path="onaylanmis" element={<ApprovedExpenseReceiptsPageWrapper />} />
                <Route path="odenmis" element={<PaidExpenseReceiptsPageWrapper />} />
              </Route>

              {/* Briefler */}
              <Route path="briefler">
                <Route index element={<BriefListPage />} />
                <Route path="yeni" element={<BriefNewPage />} />
              </Route>

              {/* Anketler */}
              <Route path="anketler" element={<SurveyPage />} />

              {/* Sözleşmeler */}
              <Route path="sozlesmeler">
                <Route index element={<ContractListPage />} />
                <Route path="yeni" element={<ContractNewPage />} />
                <Route path=":contractId/duzenle" element={<ContractEditPage />} />
              </Route>

              {/* Ayarlar */}
              <Route path="ayarlar">
                <Route index element={<SettingsMainPage />} />
                <Route path="profil" element={<ProfileSettingsPage />} />
                <Route path="guvenlik" element={<SecuritySettingsPage />} />
                <Route path="sirket-bilgileri" element={<CompanyInfoPage />} />
                <Route path="sirketler" element={<GroupCompaniesPageWrapper />} />
                <Route path="sozlesme-yonetimi" element={<ContractManagementSettingsPage />} />
                <Route path="kullanicilar" element={<UserManagementPageWrapper />} />
                <Route path="pozisyonlar" element={<PositionsPageWrapper />} />
                <Route path="pozisyon-hiyerarsisi" element={<PositionHierarchyPage />} />
                <Route path="tedarikci-yonetimi" element={<SupplierManagementPage />} />
                <Route path="departmanlar" element={<DepartmentsPageWrapper />} />
                <Route path="banka-yonetimi" element={<BankManagementSettingsPage />} />
                <Route path="avans-kurallari" element={<AdvanceRulesPage />} />
                <Route path="masraf-merkezleri" element={<ExpenseCentersPageWrapper />} />
                <Route path="kredi-kartlari" element={<CreditCardsPage />} />
                <Route path="harcama-kategorileri" element={<BankCreditCardCategoriesPage />} />
                <Route path="islem-turleri" element={<TransactionTypesSettingsPage />} />
                <Route path="avans-kategorileri" element={<AdvanceCategoriesSettingsPage />} />
                <Route path="gider-kategorileri" element={<ExpenseCategoriesSettingsPage />} />
                <Route path="kutuphane" element={<LibraryPageWrapper />} />
                <Route path="kullanici-yetkileri" element={<UserPermissionsPage />} />
                <Route path="belge-yetkileri" element={<DocumentPermissionsPage />} />
                <Route path="odeme-yetkileri" element={<PaymentPermissionsPage />} />
                <Route path="uygulama" element={<AppSettingsPage />} />
                <Route path="avans-yonetimi" element={<AdvanceManagementPage />} />
              </Route>

              {/* Avanslar */}
              <Route path="avanslar">
                <Route index element={<AdvanceListPage />} />
                <Route path="yeni" element={<AdvanceNewPage />} />
                <Route path="onaylilar" element={<AdvanceListPage />} />
                <Route path="finans-onayi" element={<AdvanceFinanceApprovalPage />} />
                <Route path="kapama" element={<AdvanceClosingPage />} />
                <Route path="kapanmis" element={<AdvanceClosedPage />} />
                <Route path="cari-hesap" element={<AdvanceCurrentAccountPage />} />
              </Route>
            </Route>
            
            {/* Ana sayfa - tenant'a yönlendir */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Navigate to="/quattro-stand" replace />
                </ProtectedRoute>
              } 
            />
            
            {/* Eski sistem route'ları kaldırıldı - artık tenant-based sistem kullanılıyor */}
            
            {/* Public routes - tenant olmadan erişilebilir */}
            <Route 
              path="/survey/:token" 
              element={<SurveyFormPage />} 
            />
            <Route 
              path="/handover/:token" 
              element={<HandoverFormPage />} 
            />
            <Route 
              path="/contact-registration/:registrationKey" 
              element={<ContactRegistrationPage />} 
            />
            <Route 
              path="/expense-receipt-approval/:token" 
              element={<ExpenseReceiptApprovalPage />} 
            />
            
            {/* Deprecated old routes - kaldırıldı */}
            <Route 
              path="/customers/:customerId/designs" 
              element={
                <ProtectedRoute>
                  <DesignVersionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/opportunities/:opportunityId/activity-planner" 
              element={
                <ProtectedRoute>
                  <ActivityPlannerPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customers/:customerId/activity-planner" 
              element={
                <ProtectedRoute>
                  <ActivityPlannerPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </BrowserRouter>
      </div>
    </AuthProvider>
  );
}

export default App;// Force rebuild
// Update 2
// fuarYili update
// Yil moved to dates
