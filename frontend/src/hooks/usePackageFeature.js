/**
 * usePackageFeature Hook
 * =======================
 * Ticari paket özellik kontrolü için React hook
 * 
 * Bu hook Feature Flag'ten FARKLIDIR:
 * - Feature Flag = Geliştirme kontrolü (yeni modüller)
 * - Package Feature = Ticari kısıtlama (paket özellikleri)
 * 
 * Kullanım:
 * const { hasAccess, currentPackage, upgradePackages } = usePackageFeature('bank_parsing');
 * 
 * if (!hasAccess) {
 *   return <UpgradePrompt feature="bank_parsing" upgradePackages={upgradePackages} />;
 * }
 * return <BankParsingModule />;
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useTenant } from '../contexts/TenantContext';

// Package features cache
const packageCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 dakika

/**
 * Tek bir paket özelliği kontrolü
 */
export const usePackageFeature = (featureKey) => {
  const { tenantSlug } = useTenant();
  const [result, setResult] = useState({
    hasAccess: false,
    reason: 'loading',
    currentPackage: null,
    upgradePackages: [],
    isLoading: true
  });

  useEffect(() => {
    const checkFeature = async () => {
      if (!tenantSlug || !featureKey) {
        setResult(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Cache kontrolü
      const cacheKey = `${tenantSlug}:features`;
      const cached = packageCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        const hasAccess = cached.features.includes(featureKey);
        setResult({
          hasAccess,
          reason: hasAccess ? 'included' : 'not_in_package',
          currentPackage: cached.packageKey,
          upgradePackages: hasAccess ? [] : cached.upgradeMap[featureKey] || [],
          isLoading: false
        });
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/api/packages/tenant/${tenantSlug}/features`);

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet
          packageCache.set(cacheKey, {
            features: data.features,
            packageKey: data.package_key,
            limits: data.limits,
            upgradeMap: {}, // TODO: Upgrade map'i backend'den al
            timestamp: Date.now()
          });
          
          const hasAccess = data.features.includes(featureKey);
          setResult({
            hasAccess,
            reason: hasAccess ? 'included' : 'not_in_package',
            currentPackage: data.package_key,
            upgradePackages: [], // TODO: Backend'den al
            isLoading: false
          });
        } else {
          setResult(prev => ({ 
            ...prev, 
            hasAccess: false, 
            reason: 'error',
            isLoading: false 
          }));
        }
      } catch (err) {
        console.error('Package feature kontrolü hatası:', err);
        setResult(prev => ({ 
          ...prev, 
          hasAccess: false, 
          reason: 'error',
          isLoading: false 
        }));
      }
    };

    checkFeature();
  }, [featureKey, tenantSlug]);

  return result;
};

/**
 * Tenant'ın tüm özelliklerini getir
 */
export const useTenantFeatures = () => {
  const { tenantSlug } = useTenant();
  const [state, setState] = useState({
    features: [],
    limits: {},
    packageKey: null,
    packageName: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadFeatures = async () => {
      if (!tenantSlug) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Cache kontrolü
      const cacheKey = `${tenantSlug}:features`;
      const cached = packageCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setState({
          features: cached.features,
          limits: cached.limits,
          packageKey: cached.packageKey,
          packageName: cached.packageName,
          isLoading: false,
          error: null
        });
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/api/packages/tenant/${tenantSlug}/features`);

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet
          packageCache.set(cacheKey, {
            features: data.features,
            limits: data.limits,
            packageKey: data.package_key,
            packageName: data.package_name,
            timestamp: Date.now()
          });
          
          setState({
            features: data.features,
            limits: data.limits,
            packageKey: data.package_key,
            packageName: data.package_name,
            isLoading: false,
            error: null
          });
        } else {
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Özellikler yüklenemedi' 
          }));
        }
      } catch (err) {
        console.error('Tenant features yükleme hatası:', err);
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: err.message 
        }));
      }
    };

    loadFeatures();
  }, [tenantSlug]);

  // Özellik kontrolü için helper fonksiyon
  const hasFeature = useCallback((featureKey) => {
    return state.features.includes(featureKey);
  }, [state.features]);

  // Limit kontrolü için helper fonksiyon
  const checkLimit = useCallback((limitKey, currentUsage) => {
    const maxValue = state.limits[limitKey];
    
    if (maxValue === undefined || maxValue === -1) {
      return { isExceeded: false, remaining: Infinity };
    }
    
    return {
      isExceeded: currentUsage >= maxValue,
      remaining: Math.max(0, maxValue - currentUsage),
      maxValue,
      currentUsage
    };
  }, [state.limits]);

  return {
    ...state,
    hasFeature,
    checkLimit
  };
};

/**
 * Limit kontrolü hook'u
 */
export const usePackageLimit = (limitKey, currentUsage) => {
  const { tenantSlug } = useTenant();
  const [result, setResult] = useState({
    isExceeded: false,
    remaining: null,
    maxValue: null,
    isLoading: true
  });

  useEffect(() => {
    const checkLimit = async () => {
      if (!tenantSlug || !limitKey) {
        setResult(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(
          `${backendUrl}/api/packages/check-limit?tenant_slug=${tenantSlug}&limit_key=${limitKey}&current_usage=${currentUsage}`,
          { method: 'POST' }
        );

        if (response.ok) {
          const data = await response.json();
          setResult({
            isExceeded: data.is_exceeded,
            remaining: data.remaining,
            maxValue: data.max_value,
            isLoading: false
          });
        }
      } catch (err) {
        console.error('Limit kontrolü hatası:', err);
        setResult(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkLimit();
  }, [limitKey, currentUsage, tenantSlug]);

  return result;
};

/**
 * Paket listesi hook'u (pricing sayfası için)
 */
export const usePackages = () => {
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        
        const response = await fetch(`${backendUrl}/api/packages`);

        if (response.ok) {
          const data = await response.json();
          setPackages(data);
        } else {
          setError('Paketler yüklenemedi');
        }
      } catch (err) {
        console.error('Paketler yükleme hatası:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadPackages();
  }, []);

  return { packages, isLoading, error };
};

/**
 * Package features cache'ini temizle
 */
export const clearPackageCache = () => {
  packageCache.clear();
};

export default usePackageFeature;
