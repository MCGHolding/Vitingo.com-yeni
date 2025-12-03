import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate, useLocation } from 'react-router-dom';
import { TenantProvider, useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Dashboard/Sidebar';
import Header from '../components/Dashboard/Header';

// Inner layout component (TenantProvider içinde kullanılır)
const TenantLayoutInner = () => {
  const { tenant, loading, error } = useTenant();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { tenantSlug } = useParams();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Tenant yüklenirken loading göster
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yüklen iyor...</p>
        </div>
      </div>
    );
  }

  // Tenant bulunamazsa hata göster
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Şirket Bulunamadı</h1>
          <p className="text-gray-600 mb-4">&quot;{tenantSlug}&quot; adında bir şirket bulunamadı.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Navigation handlers - URL bazlı navigasyon
  const handleNavigate = (path) => {
    navigate(`/${tenantSlug}${path}`);
  };

  // Sidebar props - tüm navigation handler'ları
  const sidebarProps = {
    isOpen: sidebarOpen,
    toggleSidebar,
    user,
    tenantSlug,
    
    // Dashboard
    onDashboard: () => handleNavigate(''),
    
    // Müşteriler
    onNewCustomer: () => handleNavigate('/musteriler/yeni'),
    onAllCustomers: () => handleNavigate('/musteriler'),
    onInactiveCustomers: () => handleNavigate('/musteriler/pasif'),
    onFavoriteCustomers: () => handleNavigate('/musteriler/favoriler'),
    onCustomerProspects: () => handleNavigate('/musteriler/adaylar'),
    
    // Kişiler
    onNewPerson: () => handleNavigate('/kisiler/yeni'),
    onAllPeople: () => handleNavigate('/kisiler'),
    
    // Fırsatlar
    onNewOpportunity: () => handleNavigate('/firsatlar/yeni'),
    onAllOpportunities: () => handleNavigate('/firsatlar'),
    onOpenOpportunities: () => handleNavigate('/firsatlar/acik'),
    onWonOpportunities: () => handleNavigate('/firsatlar/kazanilan'),
    onLostOpportunities: () => handleNavigate('/firsatlar/kaybedilen'),
    onFavoriteOpportunities: () => handleNavigate('/firsatlar/favoriler'),
    
    // Projeler
    onNewProject: () => handleNavigate('/projeler/yeni'),
    onAllProjects: () => handleNavigate('/projeler'),
    onOngoingProjects: () => handleNavigate('/projeler/devam-eden'),
    onCompletedProjects: () => handleNavigate('/projeler/tamamlanan'),
    onCancelledProjects: () => handleNavigate('/projeler/iptal'),
    
    // Fuarlar
    onNewFair: () => handleNavigate('/fuarlar/yeni'),
    onAllFairs: () => handleNavigate('/fuarlar'),
    onActiveFairs: () => handleNavigate('/fuarlar/aktif'),
    onPastFairs: () => handleNavigate('/fuarlar/gecmis'),
    
    // Takvim
    onCalendar: () => handleNavigate('/takvim'),
    onNewMeeting: () => handleNavigate('/takvim/yeni'),
    onMeetingRequests: () => handleNavigate('/takvim/talepler'),
    onArchivedMeetings: () => handleNavigate('/takvim/arsiv'),
    
    // Teklifler
    onProposalList: () => handleNavigate('/teklifler'),
    onNewProposal: () => handleNavigate('/teklifler/yeni'),
    onProposalProfiles: () => handleNavigate('/teklifler/profiller'),
    onDraftQuotes: () => handleNavigate('/teklifler?durum=taslak'),
    onSentQuotes: () => handleNavigate('/teklifler?durum=gonderildi'),
    onWonQuotes: () => handleNavigate('/teklifler?durum=kazanildi'),
    onLostQuotes: () => handleNavigate('/teklifler?durum=kaybedildi'),
    
    // Faturalar
    onNewInvoice: () => handleNavigate('/faturalar/yeni'),
    onAllInvoices: () => handleNavigate('/faturalar'),
    onDraftInvoices: () => handleNavigate('/faturalar/taslak'),
    onPendingCollection: () => handleNavigate('/faturalar/bekleyen'),
    onPaidInvoices: () => handleNavigate('/faturalar/odenmis'),
    onOverdueInvoices: () => handleNavigate('/faturalar/vadesi-gecmis'),
    onCurrentAccounts: () => handleNavigate('/cari-hesaplar'),
    onCollectionReceipt: () => handleNavigate('/tahsilat-makbuzu'),
    onNewCollection: () => handleNavigate('/tahsilat/yeni'),
    onPendingApproval: () => handleNavigate('/faturalar/onay-bekleyen'),
    onPaymentRequests: () => handleNavigate('/odeme-talepleri'),
    onPurchaseInvoices: () => handleNavigate('/alis-faturalari'),
    onPurchaseApprovals: () => handleNavigate('/alis-fatura-onaylari'),
    
    // Tedarikçiler
    onNewSupplier: () => handleNavigate('/tedarikciler/yeni'),
    onAllSuppliers: () => handleNavigate('/tedarikciler'),
    
    // Bankalar
    onNewBank: () => handleNavigate('/bankalar/yeni'),
    onAllBanks: () => handleNavigate('/bankalar'),
    
    // Gider Makbuzları
    onNewExpenseReceipt: () => handleNavigate('/gider-makbuzu/yeni'),
    onAllExpenseReceipts: () => handleNavigate('/gider-makbuzu'),
    onPendingExpenseReceipts: () => handleNavigate('/gider-makbuzu/onay-bekleyen'),
    onApprovedExpenseReceipts: () => handleNavigate('/gider-makbuzu/onaylanmis'),
    onPaidExpenseReceipts: () => handleNavigate('/gider-makbuzu/odenmis'),
    
    // Avanslar
    onAdvances: () => handleNavigate('/avanslar'),
    onNewAdvance: () => handleNavigate('/avanslar/yeni'),
    onApprovedAdvances: () => handleNavigate('/avanslar/onaylilar'),
    onFinansOnayi: () => handleNavigate('/avanslar/finans-onayi'),
    onAdvanceClosing: () => handleNavigate('/avanslar/kapama'),
    onKapanmisAvanslar: () => handleNavigate('/avanslar/kapanmis'),
    onCurrentAccount: () => handleNavigate('/avanslar/cari-hesap'),
    
    // Briefler
    onNewBrief: () => handleNavigate('/briefler/yeni'),
    onAllBriefs: () => handleNavigate('/briefler'),
    onClosedBriefs: () => handleNavigate('/briefler/kapali'),
    onPassiveBriefs: () => handleNavigate('/briefler/pasif'),
    onRequestBrief: () => handleNavigate('/briefler/talep'),
    
    // Anketler & Teslimler
    onSurveys: () => handleNavigate('/anketler'),
    onHandovers: () => handleNavigate('/teslimler'),
    
    // Sözleşmeler
    onContracts: () => handleNavigate('/sozlesmeler'),
    onNewContract: () => handleNavigate('/sozlesmeler/yeni'),
    
    // Ayarlar
    onSettings: () => handleNavigate('/ayarlar'),
    onImportData: () => handleNavigate('/ayarlar/veri-aktar'),
    onExportData: () => handleNavigate('/ayarlar/veri-indir'),
    onAdvanceManagement: () => handleNavigate('/ayarlar/avans-yonetimi'),
    
    // Raporlar
    onSalesReports: () => handleNavigate('/raporlar/satis'),
    onCustomerReports: () => handleNavigate('/raporlar/musteri'),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar {...sidebarProps} />
      
      <Header 
        toggleSidebar={toggleSidebar} 
        sidebarOpen={sidebarOpen}
        onNewUser={() => handleNavigate('/ayarlar/kullanicilar/yeni')}
        onAllUsers={() => handleNavigate('/ayarlar/kullanicilar')}
        onInactiveUsers={() => handleNavigate('/ayarlar/kullanicilar?durum=pasif')}
        onFormerUsers={() => handleNavigate('/ayarlar/kullanicilar?durum=eski')}
      />
      
      {/* Ana içerik - Outlet ile child route'lar render edilir */}
      <div className="lg:ml-64">
        <Outlet />
      </div>
    </div>
  );
};

// Ana layout component - TenantProvider ile wrap edilmiş
const TenantLayout = () => {
  return (
    <TenantProvider>
      <TenantLayoutInner />
    </TenantProvider>
  );
};

export default TenantLayout;
