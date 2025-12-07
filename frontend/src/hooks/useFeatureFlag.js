/**
 * useFeatureFlag Hook
 * ====================
 * Feature flag kontrolü için React hook
 * 
 * Kullanım:
 * const isEnabled = useFeatureFlag('customer_module_v2');
 * 
 * if (isEnabled) {
 *   return <CustomerModuleV2 />;
 * }
 * return <CustomerModuleV1 />;
 */

import { useState, useEffect, useCallback } from 'react';
import { useTenant } from '../contexts/TenantContext';
import { useAuth } from '../contexts/AuthContext';

// Cache için global store
const flagCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

/**
 * Tek bir feature flag kontrolü
 */
export const useFeatureFlag = (flagKey) => {
  const { tenantSlug } = useTenant();
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkFlag = async () => {
      if (!tenantSlug || !flagKey) {
        setIsLoading(false);
        return;
      }

      // Cache kontrolü
      const cacheKey = `${tenantSlug}:${flagKey}`;
      const cached = flagCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setIsEnabled(cached.enabled);
        setIsLoading(false);
        return;
      }

      try {
        const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) || 
                          process.env.REACT_APP_BACKEND_URL || 
                          'https://saas-migration.preview.emergentagent.com';
        
        const response = await fetch(`${backendUrl}/api/feature-flags/${flagKey}/check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenant_slug: tenantSlug,
            user_role: user?.role || 'user'
          })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet
          flagCache.set(cacheKey, {
            enabled: data.enabled,
            reason: data.reason,
            timestamp: Date.now()
          });
          
          setIsEnabled(data.enabled);
        } else {
          console.warn(`Feature flag '${flagKey}' kontrol edilemedi`);
          setIsEnabled(false);
        }
      } catch (err) {
        console.error('Feature flag kontrolü hatası:', err);
        setError(err);
        setIsEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFlag();
  }, [flagKey, tenantSlug, user?.role]);

  return isEnabled;
};

/**
 * Birden fazla feature flag'i tek seferde kontrol et
 */
export const useFeatureFlags = (flagKeys) => {
  const { tenantSlug } = useTenant();
  const [flags, setFlags] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkFlags = async () => {
      if (!tenantSlug || !flagKeys || flagKeys.length === 0) {
        setIsLoading(false);
        return;
      }

      // Önce cache'den kontrol et
      const results = {};
      const uncachedKeys = [];

      for (const key of flagKeys) {
        const cacheKey = `${tenantSlug}:${key}`;
        const cached = flagCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          results[key] = cached.enabled;
        } else {
          uncachedKeys.push(key);
        }
      }

      // Cache'de olmayanları API'den çek
      if (uncachedKeys.length > 0) {
        try {
          const backendUrl = (window.ENV?.REACT_APP_BACKEND_URL) || 
                            process.env.REACT_APP_BACKEND_URL || 
                            'https://saas-migration.preview.emergentagent.com';
          
          const response = await fetch(`${backendUrl}/api/feature-flags/batch/check?tenant_slug=${tenantSlug}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(uncachedKeys)
          });

          if (response.ok) {
            const data = await response.json();
            
            for (const [key, value] of Object.entries(data)) {
              // Cache'e kaydet
              flagCache.set(`${tenantSlug}:${key}`, {
                enabled: value.enabled,
                reason: value.reason,
                timestamp: Date.now()
              });
              
              results[key] = value.enabled;
            }
          }
        } catch (err) {
          console.error('Batch feature flag kontrolü hatası:', err);
          // Hata durumunda false döndür
          for (const key of uncachedKeys) {
            results[key] = false;
          }
        }
      }

      setFlags(results);
      setIsLoading(false);
    };

    checkFlags();
  }, [flagKeys, tenantSlug]);

  return { flags, isLoading };
};

/**
 * Feature flag cache'ini temizle
 */
export const clearFeatureFlagCache = (flagKey = null) => {
  if (flagKey) {
    // Belirli bir flag'i temizle
    for (const key of flagCache.keys()) {
      if (key.endsWith(`:${flagKey}`)) {
        flagCache.delete(key);
      }
    }
  } else {
    // Tüm cache'i temizle
    flagCache.clear();
  }
};

/**
 * Demo modülü için özel hook
 * Sadece development modunda ve whitelist tenant'larda çalışır
 */
export const useDemoAccess = () => {
  const isDemoEnabled = useFeatureFlag('demo_module');
  const { user } = useAuth();
  
  // Demo erişimi: flag açık VE admin/super-admin rolü
  const hasDemoAccess = isDemoEnabled && 
    (user?.role === 'super-admin' || user?.role === 'admin');
  
  return hasDemoAccess;
};

export default useFeatureFlag;
