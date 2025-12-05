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
    const loadTenant = async (retryCount = 0, maxRetries = 3) => {
      if (!tenantSlug) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch tenant from backend
        const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/tenants/${tenantSlug}`);
        
        if (!response.ok) {
          throw new Error(`Tenant fetch failed: ${response.status}`);
        }
        
        const data = await response.json();
        setTenant(data);
        setError(null);
      } catch (err) {
        console.error(`Tenant load error (attempt ${retryCount + 1}/${maxRetries + 1}):`, err);
        
        // Backend henüz hazır değilse, birkaç saniye sonra tekrar dene
        if (retryCount < maxRetries) {
          const delay = 1000 * (retryCount + 1); // 1s, 2s, 3s
          console.log(`Retrying in ${delay}ms...`);
          setTimeout(() => {
            loadTenant(retryCount + 1, maxRetries);
          }, delay);
        } else {
          // Tüm denemeler başarısız oldu
          setError('Şirket bulunamadı');
          setTenant(null);
          setLoading(false);
        }
      } finally {
        // Son denemede loading'i false yap
        if (retryCount === maxRetries) {
          setLoading(false);
        }
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
