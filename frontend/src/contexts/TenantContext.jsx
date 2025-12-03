import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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
        // TODO: Backend'den tenant bilgisi çek
        // const response = await fetch(`/api/tenants/${tenantSlug}`);
        // const data = await response.json();
        
        // Mock tenant data - şimdilik sabit, sonra API'den gelecek
        const mockTenant = {
          id: 'tenant_001',
          slug: 'quattro-stand',
          name: 'Quattro Stand',
          logo: null,
          settings: {
            currency: 'TRY',
            language: 'tr',
            timezone: 'Europe/Istanbul'
          }
        };
        
        setTenant(mockTenant);
        setError(null);
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
