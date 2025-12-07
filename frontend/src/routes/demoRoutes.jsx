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

// Demo Pages (lazy load) - Sadece mevcut olanlar
const DemoLayout = React.lazy(() => import('../pages/demo/DemoLayout'));
const DemoHomePage = React.lazy(() => import('../pages/demo/DemoHomePage'));

/**
 * Demo Route'ları
 * Şimdilik sadece ana sayfa, ileride diğer sayfalar eklenecek
 */
export const demoRoutes = (
  <Route path="demo" element={<DemoLayout />}>
    {/* Demo Ana Sayfa */}
    <Route index element={<DemoHomePage />} />
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
