/**
 * Demo Routes
 * ============
 * Demo modülü için route tanımları
 * 
 * Bu dosyayı App.jsx'teki TenantLayout route'larına ekleyin:
 * 
 * import { demoRoutes } from './routes/demoRoutes';
 * 
 * <Route path="/:tenantSlug" element={<TenantLayout />}>
 *   ... mevcut route'lar ...
 *   {demoRoutes}
 * </Route>
 */

import React from 'react';
import { Route } from 'react-router-dom';

// Demo Pages (lazy load)
const DemoLayout = React.lazy(() => import('../pages/demo/DemoLayout'));
const DemoHomePage = React.lazy(() => import('../pages/demo/DemoHomePage'));
const CustomerListPageV2 = React.lazy(() => import('../pages/demo/customers/CustomerListPageV2'));
const DashboardV2 = React.lazy(() => import('../pages/demo/dashboard/DashboardV2'));
const EmailThreadsPage = React.lazy(() => import('../pages/demo/emails/EmailThreadsPage'));
const LeadGenerationPage = React.lazy(() => import('../pages/demo/leads/LeadGenerationPage'));
const AIFeaturesPage = React.lazy(() => import('../pages/demo/ai/AIFeaturesPage'));

// Admin Pages (super-admin only)
const GlobalDataAdmin = React.lazy(() => import('../pages/demo/admin/GlobalDataAdmin'));
const FeatureFlagsAdmin = React.lazy(() => import('../pages/demo/admin/FeatureFlagsAdmin'));
const PackagesAdmin = React.lazy(() => import('../pages/demo/admin/PackagesAdmin'));

/**
 * Demo Route'ları
 */
export const demoRoutes = (
  <Route path="demo" element={<DemoLayout />}>
    {/* Demo Ana Sayfa */}
    <Route index element={<DemoHomePage />} />
    
    {/* V2 Modüller */}
    <Route path="musteriler-v2" element={<CustomerListPageV2 />} />
    <Route path="musteriler-v2/:customerId" element={<CustomerListPageV2 />} />
    <Route path="dashboard-v2" element={<DashboardV2 />} />
    <Route path="email-threads" element={<EmailThreadsPage />} />
    <Route path="lead-gen" element={<LeadGenerationPage />} />
    <Route path="ai-features" element={<AIFeaturesPage />} />
    
    {/* Admin Araçları */}
    <Route path="admin/global-data" element={<GlobalDataAdmin />} />
    <Route path="admin/feature-flags" element={<FeatureFlagsAdmin />} />
    <Route path="admin/packages" element={<PackagesAdmin />} />
  </Route>
);

/**
 * Demo route'ları için guard component
 * Feature flag ve rol kontrolü yapar
 */
export const DemoGuard = ({ children, featureFlag, requiredRoles }) => {
  // Bu component DemoLayout içinde kullanılacak
  // Şimdilik placeholder
  return children;
};

export default demoRoutes;
