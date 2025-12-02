import { useNavigate, useParams } from 'react-router-dom';
import { useCallback } from 'react';
import { buildUrl, ROUTES } from '../routes/routeConfig';

/**
 * Tenant-aware navigation hook
 * Otomatik olarak tenant slug'ı URL'e ekler
 */
export const useAppNavigate = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  
  const appNavigate = useCallback((route, params = {}, options = {}) => {
    // Eğer tenantSlug parametre olarak verilmediyse, mevcut tenant'ı kullan
    const finalParams = {
      tenantSlug: tenantSlug || 'default',
      ...params
    };
    
    const url = buildUrl(route, finalParams);
    navigate(url, options);
  }, [navigate, tenantSlug]);
  
  // Kısayol fonksiyonları
  const goToDashboard = useCallback(() => {
    appNavigate(ROUTES.DASHBOARD);
  }, [appNavigate]);
  
  const goToCustomers = useCallback(() => {
    appNavigate(ROUTES.CUSTOMERS);
  }, [appNavigate]);
  
  const goToCustomer = useCallback((customerId) => {
    appNavigate(ROUTES.CUSTOMER_DETAIL, { customerId });
  }, [appNavigate]);
  
  const goToCustomerEdit = useCallback((customerId) => {
    appNavigate(ROUTES.CUSTOMER_EDIT, { customerId });
  }, [appNavigate]);
  
  const goToCustomerNew = useCallback(() => {
    appNavigate(ROUTES.CUSTOMER_NEW);
  }, [appNavigate]);
  
  const goToProjects = useCallback(() => {
    appNavigate(ROUTES.PROJECTS);
  }, [appNavigate]);
  
  const goToProject = useCallback((projectId) => {
    appNavigate(ROUTES.PROJECT_DETAIL, { projectId });
  }, [appNavigate]);
  
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);
  
  return {
    navigate: appNavigate,
    goToDashboard,
    goToCustomers,
    goToCustomer,
    goToCustomerEdit,
    goToCustomerNew,
    goToProjects,
    goToProject,
    goBack,
    tenantSlug
  };
};

export default useAppNavigate;
