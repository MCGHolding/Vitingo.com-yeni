import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../utils/apiClient';

const TenantContext = createContext(null);

export const TenantProvider = ({ children }) => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTenant = async () => {
      if (!tenantSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Set tenant slug in API client
        apiClient.setTenantSlug(tenantSlug);
        
        // Fetch tenant from new tenant-aware test endpoint
        const response = await apiClient.getTenantBySlug(tenantSlug);
        
        if (response && response.status === 'success') {
          // Extract tenant info from test endpoint response
          const tenantData = {
            slug: response.tenant_info.slug,
            name: response.tenant_info.name,
            id: response.tenant_info.id,
            status: response.tenant_info.status,
            package: response.tenant_info.package,
            database_name: response.tenant_info.database_name
          };
          setTenant(tenantData);
          setError(null);
          console.log('✅ Tenant loaded:', tenantData);
        } else {
          throw new Error('Invalid tenant response');
        }
      } catch (err) {
        console.error('Tenant load error:', err);
        setError('Şirket bulunamadı');
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [tenantSlug]);

  const value = {
    tenant,
    tenantSlug,
    loading,
    error,
    isLoaded: !loading && tenant !== null
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

export default TenantContext;
