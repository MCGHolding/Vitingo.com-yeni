import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  FileText, 
  Settings, 
  Target,
  Calendar,
  BarChart3,
  Zap,
  ChevronDown,
  ChevronRight,
  Plus,
  List,
  Eye,
  Trophy,
  XCircle,
  Heart,
  User,
  UserPlus,
  UserSearch,
  ClipboardList,
  Files,
  Building,
  Building2,
  UserX,
  Star,
  UserRound,
  MapPin,
  Upload,
  Download,
  Calculator,
  Receipt,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  CreditCard,
  Folder,
  FolderPlus,
  Play,
  CheckSquare,
  X,
  Wallet,
  FileCheck,
  ShoppingCart,
  FileX,
  Briefcase,
  Archive,
  Pause,
  MessageSquare,
  PenTool,
  FolderOpen,
  Truck,
  UserCheck,
  Search
} from 'lucide-react';

// Function to get navigation based on user department
const getNavigation = (userDepartment) => {
  console.log('🔍 getNavigation called with userDepartment:', userDepartment);
  console.log('🔍 Is Muhasebe department?', userDepartment === 'Muhasebe');
  // Base navigation for all users
  const baseNavigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, current: true },
    { 
      name: 'Müşteriler', 
      href: '/customers', 
      icon: Building, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Müşteri', href: '/customers/new', icon: Plus },
        { name: 'Müşteri Adayları', href: '/customers/prospects', icon: UserSearch },
        { name: 'Tüm Müşteriler', href: '/customers/all', icon: Building },
        { name: 'Pasif Müşteriler', href: '/customers/inactive', icon: UserX },
        { name: 'Favori Müşteriler', href: '/customers/favorites', icon: Star }
      ]
    },
    { 
      name: 'Kişiler', 
      href: '/people', 
      icon: Users, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Kişi Ekle', href: '/people/new', icon: Plus },
        { name: 'Tüm Kişiler', href: '/people/all', icon: UserRound }
      ]
    },
    { name: 'Satışlar', href: '/sales', icon: TrendingUp, current: false },
    { 
      name: 'Satış Fırsatları', 
      href: '/opportunities', 
      icon: Zap, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Satış Fırsatı', href: '/opportunities/new', icon: Plus },
        { name: 'Açık Fırsatlar', href: '/opportunities/open', icon: Eye },
        { name: 'Kazanılan Fırsatlar', href: '/opportunities/won', icon: Trophy },
        { name: 'Kaybedilen Fırsatlar', href: '/opportunities/lost', icon: XCircle },
        { name: 'Favori Fırsatlar', href: '/opportunities/favorites', icon: Heart },
        { name: 'Tüm Satış Fırsatları', href: '/opportunities/all', icon: List }
      ]
    },
    { 
      name: 'Teklifler', 
      href: '/quotes', 
      icon: ClipboardList, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Teklif', href: '/quotes/new', icon: Plus },
        { name: 'Tüm Teklifler', href: '/quotes/all', icon: Files },
        { name: 'Taslak Teklifler', href: '/quotes/draft', icon: FileText },
        { name: 'Yönetici Onayında', href: '/quotes/pending-approval', icon: Clock },
        { name: 'Gönderilen Teklifler', href: '/quotes/sent', icon: Upload },
        { name: 'Kazanılan Teklifler', href: '/quotes/won', icon: Trophy },
        { name: 'Kaybedilen Teklifler', href: '/quotes/lost', icon: XCircle }
      ]
    },
    { 
      name: 'Fuarlar', 
      href: '/fairs', 
      icon: MapPin, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Fuar', href: '/fairs/new', icon: Plus },
        { name: 'Tüm Fuarlar', href: '/fairs/all', icon: List },
        { name: 'Aktif Fuarlar', href: '/fairs/active', icon: Eye },
        { name: 'Geçmiş Fuarlar', href: '/fairs/past', icon: Calendar }
      ]
    },
    { 
      name: 'Projeler', 
      href: '/projects', 
      icon: Folder, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Proje', href: '/projects/new', icon: FolderPlus },
        { name: 'Tüm Projeler', href: '/projects/all', icon: List },
        { name: 'Devam Edenler', href: '/projects/ongoing', icon: Play },
        { name: 'Tamamlananlar', href: '/projects/completed', icon: CheckSquare },
        { name: 'İptal Edilenler', href: '/projects/cancelled', icon: X }
      ]
    }
  ];

  // Standard Muhasebe menu for non-Muhasebe users
  const standardMuhasebeMenu = { 
    name: 'Muhasebe', 
    href: '/accounting', 
    icon: Calculator, 
    current: false,
    hasSubmenu: true,
    submenu: [
      { name: 'Yeni Fatura', href: '/accounting/new-invoice', icon: Plus },
      { name: 'Tüm Faturalar', href: '/accounting/all-invoices', icon: Receipt },
      { name: 'Taslak Faturalar', href: '/accounting/draft', icon: FileText },
      { name: 'Tahsilat Bekleyenler', href: '/accounting/pending-collection', icon: AlertTriangle },
      { name: 'Ödenmiş', href: '/accounting/paid', icon: CheckCircle },
      { name: 'Vadesi Geçmiş', href: '/accounting/overdue', icon: XCircle },
      { name: 'Cari Hesaplar', href: '/accounting/current-accounts', icon: DollarSign },
      { name: 'Tahsilat Makbuzu', href: '/accounting/collection-receipt', icon: CreditCard },
      { name: 'Ödeme Talepleri', href: '/accounting/payment-requests', icon: FileCheck },
      { name: 'Alış Faturaları', href: '/accounting/purchase-invoices', icon: ShoppingCart },
      { name: 'Alış Fatura Onayları', href: '/accounting/purchase-approvals', icon: FileX },
      { name: 'Yeni Banka', href: '/accounting/banks/new', icon: Building2 },
      { name: 'Tüm Bankalar', href: '/accounting/banks/all', icon: Building }
    ]
  };

  // Special Muhasebe menu for Muhasebe department users
  const specialMuhasebeMenu = { 
    name: 'Muhasebe', 
    href: '/accounting', 
    icon: Calculator, 
    current: false,
    hasSubmenu: true,
    submenu: [
      { name: 'Yeni Fatura', href: '/accounting/new-invoice', icon: Plus },
      { name: 'Tüm Faturalar', href: '/accounting/all-invoices', icon: Receipt },
      { name: 'Taslak Faturalar', href: '/accounting/draft', icon: FileText },
      { name: 'Tahsilat Bekleyenler', href: '/accounting/pending-collection', icon: AlertTriangle },
      { name: 'Ödenmiş', href: '/accounting/paid', icon: CheckCircle },
      { name: 'Vadesi Geçmiş', href: '/accounting/overdue', icon: XCircle },
      { name: 'Cari Hesaplar', href: '/accounting/current-accounts', icon: DollarSign },
      { 
        name: 'Yeni Tahsilatlar', 
        href: '/accounting/new-collections', 
        icon: Wallet,
        hasSubmenu: true,
        submenu: [
          { name: 'Yeni Tahsilat', href: '/accounting/new-collection', icon: Plus },
          { 
            name: 'Tahsilatlar', 
            href: '/accounting/collections', 
            icon: List,
            hasSubmenu: true,
            submenu: [
              { name: 'Tahsilat Makbuzu', href: '/accounting/collection-receipt', icon: CreditCard }
            ]
          }
        ]
      },
      { name: 'Ödeme Talepleri', href: '/accounting/payment-requests', icon: FileCheck },
      { name: 'Alış Faturaları', href: '/accounting/purchase-invoices', icon: ShoppingCart },
      { name: 'Alış Fatura Onayları', href: '/accounting/purchase-approvals', icon: FileX },
      { name: 'Yeni Banka', href: '/accounting/banks/new', icon: Building2 },
      { name: 'Tüm Bankalar', href: '/accounting/banks/all', icon: Building }
    ]
  };

  const remainingMenus = [
    { 
      name: 'Tedarikçi', 
      href: '/accounting/suppliers', 
      icon: Truck, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Tedarikçi', href: '/accounting/suppliers/new', icon: Plus },
        { name: 'Tüm Tedarikçiler', href: '/accounting/suppliers/all', icon: UserCheck }
      ]
    },
    { 
      name: 'Gider Makbuzu', 
      href: '/accounting/expense-receipts', 
      icon: Wallet, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Gider Makbuzu', href: '/accounting/expense-receipts/new', icon: Plus },
        { name: 'Tüm Makbuzlar', href: '/accounting/expense-receipts/all', icon: Receipt },
        { name: 'Onay Bekleyen Makbuzlar', href: '/accounting/expense-receipts/pending', icon: Clock },
        { name: 'Onaylanmış Makbuzlar', href: '/accounting/expense-receipts/approved', icon: CheckCircle },
        { name: 'Ödenmiş Makbuzlar', href: '/accounting/expense-receipts/paid', icon: CreditCard }
      ]
    },
    { 
      name: 'Brief', 
      href: '/brief', 
      icon: PenTool, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Yeni Brief', href: '/brief/new', icon: Plus },
        { name: 'Tüm Briefler', href: '/brief/all', icon: FolderOpen },
        { name: 'Kapanmış', href: '/brief/closed', icon: CheckCircle },
        { name: 'Pasif', href: '/brief/passive', icon: Pause },
        { name: 'Brief Talep Et', href: '/brief/request', icon: MessageSquare }
      ]
    },
    { 
      name: 'Raporlar', 
      href: '/reports', 
      icon: BarChart3, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Satış Raporları', href: '/reports/sales', icon: BarChart3 },
        { name: 'Müşteri Raporları', href: '/reports/customers', icon: Users },
        { name: 'Teslim Formları', href: '/reports/handovers', icon: FileText },
        { name: 'Anketler', href: '/reports/surveys', icon: ClipboardList }
      ]
    },
    { name: 'Görevler', href: '/tasks', icon: Target, current: false },
    { name: 'Takvim', href: '/calendar', icon: Calendar, current: false },
    { name: 'Dökümanlar', href: '/documents', icon: FileText, current: false },
    { 
      name: 'Ayarlar', 
      href: '/settings', 
      icon: Settings, 
      current: false,
      hasSubmenu: true,
      submenu: [
        { name: 'Import Data', href: '/settings/import', icon: Upload },
        { name: 'Export Data', href: '/settings/export', icon: Download }
      ]
    }
  ];

  // Choose the appropriate Muhasebe menu based on user department
  const muhasebeMenu = userDepartment === 'Muhasebe' ? specialMuhasebeMenu : standardMuhasebeMenu;
  
  return [...baseNavigation, muhasebeMenu, ...remainingMenus];
};

export default function Sidebar({ 
  isOpen, 
  toggleSidebar, 
  onDashboard,
  onNewOpportunity, 
  onOpenOpportunities,
  onWonOpportunities,
  onLostOpportunities,
  onFavoriteOpportunities,
  onAllOpportunities,
  onNewCustomer,
  onAllCustomers,
  onInactiveCustomers,
  onFavoriteCustomers,
  onCustomerProspects,
  onNewPerson,
  onAllPeople,
  onNewQuote,
  onAllQuotes,
  onDraftQuotes,
  onPendingApprovalQuotes,
  onSentQuotes,
  onWonQuotes,
  onLostQuotes,
  onNewFair,
  onAllFairs,
  onActiveFairs,
  onPastFairs,
  // Project handlers
  onNewProject,
  onAllProjects,
  onOngoingProjects,
  onCompletedProjects,
  onCancelledProjects,
  onImportData,
  onExportData,
  onSalesReports,
  onCustomerReports,
  onHandovers,
  onSurveys,
  // Accounting handlers
  onNewInvoice,
  onAllInvoices,
  onPendingApproval,
  onDraftInvoices,
  onPendingCollection,
  onPaidInvoices,
  onOverdueInvoices,
  onCurrentAccounts,
  onCollectionReceipt,
  onPaymentRequests,
  // Expense Receipt handlers
  onNewExpenseReceipt,
  onAllExpenseReceipts,
  onPendingExpenseReceipts,
  onApprovedExpenseReceipts,
  onPaidExpenseReceipts,
  onPurchaseInvoices,
  onPurchaseApprovals,
  // Bank handlers
  onNewBank,
  onAllBanks,
  // Supplier handlers
  onNewSupplier,
  onAllSuppliers,
  // Brief handlers
  onNewBrief,
  onAllBriefs,
  onClosedBriefs,
  onPassiveBriefs,
  onRequestBrief
}) {
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Clear search term when user changes (to prevent login username from affecting sidebar search)
  useEffect(() => {
    setSearchTerm('');
  }, [user?.id]);
  
  // Get navigation based on user department
  const navigation = React.useMemo(() => {
    console.log('🔍 Sidebar Debug - User:', user);
    console.log('🔍 Sidebar Debug - User Department:', user?.department);
    console.log('🔍 Sidebar Debug - Calling getNavigation with:', user?.department);
    const nav = getNavigation(user?.department);
    console.log('🔍 Sidebar Debug - Generated navigation:', nav);
    return nav;
  }, [user?.department]);

  const toggleSubmenu = (itemName) => {
    setOpenSubmenu(openSubmenu === itemName ? null : itemName);
  };

  // Filter navigation items based on search term
  const filteredNavigation = React.useMemo(() => {
    console.log('Sidebar search term:', searchTerm);
    
    if (!searchTerm || searchTerm.trim() === '') {
      console.log('No search term, showing all navigation items');
      return navigation;
    }
    
    const filtered = navigation.filter(item => {
      const matchesMain = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubmenu = item.submenu?.some(subItem => 
        subItem.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matches = matchesMain || matchesSubmenu;
      
      if (matches) {
        console.log(`Item "${item.name}" matches search "${searchTerm}"`);
      }
      
      return matches;
    });
    
    console.log('Filtered navigation items:', filtered.length);
    return filtered;
  }, [searchTerm]);

  // Filter submenu items for each navigation item
  const getFilteredSubmenu = (item) => {
    if (!item.submenu || !searchTerm) return item.submenu;
    return item.submenu.filter(subItem =>
      subItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Auto-expand submenus when searching
  const shouldAutoExpand = (item) => {
    if (!searchTerm || !item.hasSubmenu) return false;
    return item.submenu?.some(subItem => 
      subItem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleMenuClick = (item, subItem = null, nestedSubItem = null, deepNestedItem = null) => {
    // Handle nested submenu for "Yeni Tahsilatlar"
    if (subItem && subItem.name === 'Yeni Tahsilatlar' && !nestedSubItem) {
      toggleSubmenu(subItem.name);
      return;
    }
    
    // Handle nested submenu for "Tahsilatlar" 
    if (nestedSubItem && nestedSubItem.name === 'Tahsilatlar' && !deepNestedItem) {
      toggleSubmenu(nestedSubItem.name);
      return;
    }
    
    // If no subItem and the item has submenu, toggle submenu
    if (!subItem && item.hasSubmenu) {
      toggleSubmenu(item.name);
      return;
    }
    
    // Handle Dashboard main menu
    if (item.name === 'Dashboard' && !subItem) {
      if (onDashboard) {
        onDashboard();
      }
      return;
    }
    
    // Handle Customer menu actions
    if (subItem && subItem.name === 'Yeni Müşteri') {
      if (onNewCustomer) {
        onNewCustomer();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Müşteriler') {
      if (onAllCustomers) {
        onAllCustomers();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Pasif Müşteriler') {
      if (onInactiveCustomers) {
        onInactiveCustomers();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Favori Müşteriler') {
      if (onFavoriteCustomers) {
        onFavoriteCustomers();
      }
      return;
    }

    if (subItem && subItem.name === 'Müşteri Adayları') {
      if (onCustomerProspects) {
        onCustomerProspects();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Kişi Ekle') {
      if (onNewPerson) {
        onNewPerson();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Kişiler') {
      if (onAllPeople) {
        onAllPeople();
      }
      return;
    }
    
    // Prospect menu handlers removed - integrated into customer menu
    
    if (subItem && subItem.name === 'Yeni Satış Fırsatı') {
      if (onNewOpportunity) {
        onNewOpportunity();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Açık Fırsatlar') {
      if (onOpenOpportunities) {
        onOpenOpportunities();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Kazanılan Fırsatlar') {
      if (onWonOpportunities) {
        onWonOpportunities();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Kaybedilen Fırsatlar') {
      if (onLostOpportunities) {
        onLostOpportunities();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Favori Fırsatlar') {
      if (onFavoriteOpportunities) {
        onFavoriteOpportunities();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Satış Fırsatları') {
      if (onAllOpportunities) {
        onAllOpportunities();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Yeni Teklif') {
      if (onNewQuote) {
        onNewQuote();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Teklifler') {
      if (onAllQuotes) {
        onAllQuotes();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Taslak Teklifler') {
      if (onDraftQuotes) {
        onDraftQuotes();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Yönetici Onayında') {
      if (onPendingApprovalQuotes) {
        onPendingApprovalQuotes();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Gönderilen Teklifler') {
      if (onSentQuotes) {
        onSentQuotes();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Kazanılan Teklifler') {
      if (onWonQuotes) {
        onWonQuotes();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Kaybedilen Teklifler') {
      if (onLostQuotes) {
        onLostQuotes();
      }
      return;
    }
    // Handle Fair Management menu actions
    if (subItem && subItem.name === 'Yeni Fuar') {
      if (onNewFair) {
        onNewFair();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Fuarlar') {
      if (onAllFairs) {
        onAllFairs();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Aktif Fuarlar') {
      if (onActiveFairs) {
        onActiveFairs();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Geçmiş Fuarlar') {
      if (onPastFairs) {
        onPastFairs();
      }
      return;
    }

    // Handle Project Management menu actions
    if (subItem && subItem.name === 'Yeni Proje') {
      if (onNewProject) {
        onNewProject();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tüm Projeler') {
      if (onAllProjects) {
        onAllProjects();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Devam Edenler') {
      if (onOngoingProjects) {
        onOngoingProjects();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Tamamlananlar') {
      if (onCompletedProjects) {
        onCompletedProjects();
      }
      return;
    }
    
    if (subItem && subItem.name === 'İptal Edilenler') {
      if (onCancelledProjects) {
        onCancelledProjects();
      }
      return;
    }
    
    // Handle Settings menu actions
    if (subItem && subItem.name === 'Import Data') {
      if (onImportData) {
        onImportData();
      }
      return;
    }
    
    if (subItem && subItem.name === 'Export Data') {
      if (onExportData) {
        onExportData();
      }
      return;
    }

    // Handle Reports menu actions
    if (subItem && subItem.name === 'Satış Raporları') {
      if (onSalesReports) {
        onSalesReports();
      }
      return;
    }

    if (subItem && subItem.name === 'Müşteri Raporları') {
      if (onCustomerReports) {
        onCustomerReports();
      }
      return;
    }

    if (subItem && subItem.name === 'Teslim Formları') {
      if (onHandovers) {
        onHandovers();
      }
      return;
    }

    if (subItem && subItem.name === 'Anketler') {
      if (onSurveys) {
        onSurveys();
      }
      return;
    }

    // Handle Accounting menu actions
    if (subItem && subItem.name === 'Yeni Fatura') {
      if (onNewInvoice) {
        onNewInvoice();
      }
      return;
    }

    if (subItem && subItem.name === 'Tüm Faturalar') {
      if (onAllInvoices) {
        onAllInvoices();
      }
      return;
    }

    if (subItem && subItem.name === 'Taslak Faturalar') {
      if (onDraftInvoices) {
        onDraftInvoices();
      }
      return;
    }

    if (subItem && subItem.name === 'Tahsilat Bekleyenler') {
      if (onPendingCollection) {
        onPendingCollection();
      }
      return;
    }

    if (subItem && subItem.name === 'Ödenmiş') {
      if (onPaidInvoices) {
        onPaidInvoices();
      }
      return;
    }

    if (subItem && subItem.name === 'Vadesi Geçmiş') {
      if (onOverdueInvoices) {
        onOverdueInvoices();
      }
      return;
    }

    if (subItem && subItem.name === 'Cari Hesaplar') {
      if (onCurrentAccounts) {
        onCurrentAccounts();
      }
      return;
    }

    if (subItem && subItem.name === 'Tahsilat Makbuzu') {
      if (onCollectionReceipt) {
        onCollectionReceipt();
      }
      return;
    }

    // Handle deep nested submenu items (third level)
    if (deepNestedItem && deepNestedItem.name === 'Tahsilat Makbuzu') {
      if (onCollectionReceipt) {
        onCollectionReceipt();
      }
      return;
    }

    // Handle nested submenu items for "Yeni Tahsilatlar"
    if (nestedSubItem && nestedSubItem.name === 'Yeni Tahsilat') {
      // For now, redirect to the existing collection receipt page
      if (onCollectionReceipt) {
        onCollectionReceipt();
      }
      return;
    }
    
    // The "Tahsilatlar" item now just opens its submenu since it has nested items

    // Gider Makbuzu removed from Muhasebe submenu

    if (subItem && subItem.name === 'Ödeme Talepleri') {
      if (onPaymentRequests) {
        onPaymentRequests();
      }
      return;
    }

    if (subItem && subItem.name === 'Alış Faturaları') {
      if (onPurchaseInvoices) {
        onPurchaseInvoices();
      }
      return;
    }

    if (subItem && subItem.name === 'Alış Fatura Onayları') {
      if (onPurchaseApprovals) {
        onPurchaseApprovals();
      }
      return;
    }

    // Handle Bank menu actions
    if (subItem && subItem.name === 'Yeni Banka') {
      if (onNewBank) {
        onNewBank();
      }
      return;
    }

    if (subItem && subItem.name === 'Tüm Bankalar') {
      if (onAllBanks) {
        onAllBanks();
      }
      return;
    }

    // Handle Supplier menu actions
    if (subItem && subItem.name === 'Yeni Tedarikçi') {
      if (onNewSupplier) {
        onNewSupplier();
      }
      return;
    }

    if (subItem && subItem.name === 'Tüm Tedarikçiler') {
      if (onAllSuppliers) {
        onAllSuppliers();
      }
      return;
    }

    // Handle Expense Receipt menu actions
    if (subItem && subItem.name === 'Yeni Gider Makbuzu') {
      if (onNewExpenseReceipt) {
        onNewExpenseReceipt();
      }
      return;
    }

    if (subItem && subItem.name === 'Tüm Makbuzlar') {
      if (onAllExpenseReceipts) {
        onAllExpenseReceipts();
      }
      return;
    }

    if (subItem && subItem.name === 'Onay Bekleyen Makbuzlar') {
      if (onPendingExpenseReceipts) {
        onPendingExpenseReceipts();
      }
      return;
    }

    if (subItem && subItem.name === 'Onaylanmış Makbuzlar') {
      if (onApprovedExpenseReceipts) {
        onApprovedExpenseReceipts();
      }
      return;
    }

    if (subItem && subItem.name === 'Ödenmiş Makbuzlar') {
      if (onPaidExpenseReceipts) {
        onPaidExpenseReceipts();
      }
      return;
    }

    // Handle Brief menu actions
    if (subItem && subItem.name === 'Yeni Brief') {
      if (onNewBrief) {
        onNewBrief();
      }
      return;
    }

    if (subItem && subItem.name === 'Tüm Briefler') {
      if (onAllBriefs) {
        onAllBriefs();
      }
      return;
    }

    if (subItem && subItem.name === 'Kapanmış') {
      if (onClosedBriefs) {
        onClosedBriefs();
      }
      return;
    }

    if (subItem && subItem.name === 'Pasif') {
      if (onPassiveBriefs) {
        onPassiveBriefs();
      }
      return;
    }

    if (subItem && subItem.name === 'Brief Talep Et') {
      if (onRequestBrief) {
        onRequestBrief();
      }
      return;
    }
    
    // Default click behavior (preventDefault for demo)
    if (!subItem) {
      if (item.hasSubmenu) {
        toggleSubmenu(item.name);
      } else {
        // Handle main menu navigation
        console.log('Navigate to:', item.href);
      }
    } else {
      // Handle submenu navigation
      console.log('Navigate to:', subItem.href);
    }
  };

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-slate-900 to-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Vitingo</h1>
        </div>

        {/* Search */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Menüde ara..."
              value={searchTerm}
              onChange={(e) => {
                console.log('Search input changed:', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isSubmenuOpen = openSubmenu === item.name || shouldAutoExpand(item);
            
            return (
              <div key={item.name}>
                {/* Main menu item */}
                <div
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 cursor-pointer",
                    item.current
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  )}
                  onClick={() => handleMenuClick(item)}
                >
                  <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{item.name}</span>
                  {item.hasSubmenu && (
                    isSubmenuOpen ? 
                      <ChevronDown className="h-4 w-4 text-slate-400" /> :
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </div>

                {/* Submenu */}
                {item.hasSubmenu && isSubmenuOpen && (
                  <div className="ml-6 mt-2 space-y-1">
                    {getFilteredSubmenu(item)?.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isNestedSubmenuOpen = openSubmenu === subItem.name;
                      
                      return (
                        <div key={subItem.name}>
                          {/* Submenu item */}
                          <a
                            href={subItem.href}
                            className="group flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                            onClick={(e) => {
                              e.preventDefault();
                              handleMenuClick(item, subItem);
                            }}
                          >
                            <SubIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                            <span className="flex-1">{subItem.name}</span>
                            {subItem.hasSubmenu && (
                              isNestedSubmenuOpen ? 
                                <ChevronDown className="h-4 w-4 text-slate-400" /> :
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                            )}
                          </a>
                          
                          {/* Nested submenu for "Yeni Tahsilatlar" */}
                          {subItem.hasSubmenu && isNestedSubmenuOpen && (
                            <div className="ml-6 mt-2 space-y-1">
                              {subItem.submenu?.map((nestedSubItem) => {
                                const NestedIcon = nestedSubItem.icon;
                                const isDeepNestedSubmenuOpen = openSubmenu === nestedSubItem.name;
                                
                                return (
                                  <div key={nestedSubItem.name}>
                                    {/* Second level submenu item */}
                                    <a
                                      href={nestedSubItem.href}
                                      className="group flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleMenuClick(item, subItem, nestedSubItem);
                                      }}
                                    >
                                      <NestedIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                      <span className="flex-1">{nestedSubItem.name}</span>
                                      {nestedSubItem.hasSubmenu && (
                                        isDeepNestedSubmenuOpen ? 
                                          <ChevronDown className="h-4 w-4 text-slate-400" /> :
                                          <ChevronRight className="h-4 w-4 text-slate-400" />
                                      )}
                                    </a>
                                    
                                    {/* Third level nested submenu for "Tahsilatlar" */}
                                    {nestedSubItem.hasSubmenu && isDeepNestedSubmenuOpen && (
                                      <div className="ml-6 mt-2 space-y-1">
                                        {nestedSubItem.submenu?.map((deepNestedItem) => {
                                          const DeepNestedIcon = deepNestedItem.icon;
                                          return (
                                            <a
                                              key={deepNestedItem.name}
                                              href={deepNestedItem.href}
                                              className="group flex items-center px-3 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all duration-200"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                handleMenuClick(item, subItem, nestedSubItem, deepNestedItem);
                                              }}
                                            >
                                              <DeepNestedIcon className="mr-3 h-4 w-4 flex-shrink-0" />
                                              {deepNestedItem.name}
                                            </a>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">AD</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-400">admin@company.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}