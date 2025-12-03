// Tüm route tanımları merkezi bir yerde
// Bu dosya hem route oluşturmak hem de link oluşturmak için kullanılır

// Default tenant slug
export const DEFAULT_TENANT = 'quattro-stand';

export const ROUTES = {
  // Auth routes (tenant dışı)
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Public routes
  LANDING: '/landing',
  GET_STARTED: '/get-started',
  
  // Tenant routes (tenant içi)
  DASHBOARD: '/:tenantSlug',
  
  // Müşteriler
  CUSTOMERS: '/:tenantSlug/musteriler',
  CUSTOMER_NEW: '/:tenantSlug/musteriler/yeni',
  CUSTOMER_DETAIL: '/:tenantSlug/musteriler/:customerId',
  CUSTOMER_EDIT: '/:tenantSlug/musteriler/:customerId/duzenle',
  CUSTOMERS_PASSIVE: '/:tenantSlug/musteriler/pasif',
  CUSTOMERS_FAVORITES: '/:tenantSlug/musteriler/favoriler',
  CUSTOMERS_PROSPECTS: '/:tenantSlug/musteriler/adaylar',
  
  // Kişiler
  PEOPLE: '/:tenantSlug/kisiler',
  PERSON_NEW: '/:tenantSlug/kisiler/yeni',
  PERSON_DETAIL: '/:tenantSlug/kisiler/:personId',
  
  // Fırsatlar
  OPPORTUNITIES: '/:tenantSlug/firsatlar',
  OPPORTUNITY_NEW: '/:tenantSlug/firsatlar/yeni',
  OPPORTUNITY_DETAIL: '/:tenantSlug/firsatlar/:opportunityId',
  OPPORTUNITY_EDIT: '/:tenantSlug/firsatlar/:opportunityId/duzenle',
  OPPORTUNITIES_OPEN: '/:tenantSlug/firsatlar/acik',
  OPPORTUNITIES_WON: '/:tenantSlug/firsatlar/kazanilan',
  OPPORTUNITIES_LOST: '/:tenantSlug/firsatlar/kaybedilen',
  OPPORTUNITIES_FAVORITES: '/:tenantSlug/firsatlar/favoriler',
  
  // Projeler
  PROJECTS: '/:tenantSlug/projeler',
  PROJECT_NEW: '/:tenantSlug/projeler/yeni',
  PROJECT_DETAIL: '/:tenantSlug/projeler/:projectId',
  PROJECT_EDIT: '/:tenantSlug/projeler/:projectId/duzenle',
  PROJECTS_ONGOING: '/:tenantSlug/projeler/devam-eden',
  PROJECTS_COMPLETED: '/:tenantSlug/projeler/tamamlanan',
  PROJECTS_CANCELLED: '/:tenantSlug/projeler/iptal',
  
  // Fuarlar
  FAIRS: '/:tenantSlug/fuarlar',
  FAIR_NEW: '/:tenantSlug/fuarlar/yeni',
  FAIRS_ACTIVE: '/:tenantSlug/fuarlar/aktif',
  FAIRS_PAST: '/:tenantSlug/fuarlar/gecmis',
  
  // Takvim
  CALENDAR: '/:tenantSlug/takvim',
  MEETING_NEW: '/:tenantSlug/takvim/yeni',
  MEETING_REQUESTS: '/:tenantSlug/takvim/talepler',
  MEETINGS_ARCHIVED: '/:tenantSlug/takvim/arsiv',
  
  // Teklifler
  PROPOSALS: '/:tenantSlug/teklifler',
  PROPOSAL_NEW: '/:tenantSlug/teklifler/yeni',
  PROPOSAL_PROFILES: '/:tenantSlug/teklifler/profiller',
  
  // Faturalar
  INVOICES: '/:tenantSlug/faturalar',
  INVOICE_NEW: '/:tenantSlug/faturalar/yeni',
  INVOICE_EDIT: '/:tenantSlug/faturalar/:invoiceId/duzenle',
  INVOICES_DRAFT: '/:tenantSlug/faturalar/taslak',
  INVOICES_PENDING: '/:tenantSlug/faturalar/bekleyen',
  INVOICES_PAID: '/:tenantSlug/faturalar/odenmis',
  INVOICES_OVERDUE: '/:tenantSlug/faturalar/vadesi-gecmis',
  
  // Tedarikçiler
  SUPPLIERS: '/:tenantSlug/tedarikciler',
  SUPPLIER_NEW: '/:tenantSlug/tedarikciler/yeni',
  
  // Bankalar
  BANKS: '/:tenantSlug/bankalar',
  BANK_NEW: '/:tenantSlug/bankalar/yeni',
  BANK_EDIT: '/:tenantSlug/bankalar/:bankId/duzenle',
  
  // Ayarlar
  SETTINGS: '/:tenantSlug/ayarlar',
  SETTINGS_COMPANIES: '/:tenantSlug/ayarlar/sirketler',
  SETTINGS_USERS: '/:tenantSlug/ayarlar/kullanicilar',
  SETTINGS_DEPARTMENTS: '/:tenantSlug/ayarlar/departmanlar',
  SETTINGS_POSITIONS: '/:tenantSlug/ayarlar/pozisyonlar',
  
  // Sözleşmeler
  CONTRACTS: '/:tenantSlug/sozlesmeler',
  CONTRACT_NEW: '/:tenantSlug/sozlesmeler/yeni',
  CONTRACT_EDIT: '/:tenantSlug/sozlesmeler/:contractId/duzenle',
};

// URL oluşturma yardımcı fonksiyonu
export const buildUrl = (route, params = {}) => {
  let url = route;
  
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return url;
};

// Örnek kullanım:
// buildUrl(ROUTES.CUSTOMER_DETAIL, { tenantSlug: 'acme-corp', customerId: '123' })
// => '/acme-corp/musteriler/123'

export const buildCustomerUrl = (tenantSlug, customerId = null, action = null) => {
  if (!customerId) {
    return `/${tenantSlug}/musteriler`;
  }
  if (action === 'edit') {
    return `/${tenantSlug}/musteriler/${customerId}/duzenle`;
  }
  return `/${tenantSlug}/musteriler/${customerId}`;
};

export const buildProjectUrl = (tenantSlug, projectId = null, action = null) => {
  if (!projectId) {
    return `/${tenantSlug}/projeler`;
  }
  if (action === 'edit') {
    return `/${tenantSlug}/projeler/${projectId}/duzenle`;
  }
  return `/${tenantSlug}/projeler/${projectId}`;
};
