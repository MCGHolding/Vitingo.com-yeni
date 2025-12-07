/**
 * useGlobalData Hooks
 * ====================
 * Global veriler için React hooks
 * 
 * TEK KAYNAK PRENSİBİ:
 * Tüm para birimleri, ülkeler, şehirler bu hook'lardan gelir.
 * Frontend'de her dropdown aynı veriyi kullanır.
 * 
 * Kullanım:
 * const { currencies, isLoading } = useCurrencies();
 * const { countries } = useCountries();
 * const { cities } = useCities('TR');
 */

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

// Global data cache
const globalDataCache = {
  currencies: null,
  countries: null,
  cities: {},
  languages: null,
  lastFetch: {}
};

const CACHE_DURATION = 30 * 60 * 1000; // 30 dakika

// ============================================================
// CURRENCIES
// ============================================================

/**
 * Para birimlerini getir
 */
export const useCurrencies = (options = {}) => {
  const { commonOnly = false } = options;
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCurrencies = async () => {
      // Cache kontrolü
      const cacheKey = commonOnly ? 'currencies_common' : 'currencies';
      if (
        globalDataCache[cacheKey] && 
        Date.now() - (globalDataCache.lastFetch[cacheKey] || 0) < CACHE_DURATION
      ) {
        setCurrencies(globalDataCache[cacheKey]);
        setIsLoading(false);
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const url = `${backendUrl}/api/global/currencies?common_only=${commonOnly}`;
        
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet
          globalDataCache[cacheKey] = data;
          globalDataCache.lastFetch[cacheKey] = Date.now();
          
          setCurrencies(data);
        } else {
          setError('Para birimleri yüklenemedi');
        }
      } catch (err) {
        console.error('Para birimleri yükleme hatası:', err);
        setError(err.message);
        
        // Fallback veriler
        setCurrencies([
          { code: 'TRY', symbol: '₺', name: 'Turkish Lira', name_tr: 'Türk Lirası' },
          { code: 'USD', symbol: '$', name: 'US Dollar', name_tr: 'Amerikan Doları' },
          { code: 'EUR', symbol: '€', name: 'Euro', name_tr: 'Euro' },
          { code: 'GBP', symbol: '£', name: 'British Pound', name_tr: 'İngiliz Sterlini' },
          { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', name_tr: 'BAE Dirhemi' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrencies();
  }, [commonOnly]);

  // Kod ile para birimi bul
  const getCurrency = useCallback((code) => {
    return currencies.find(c => c.code === code);
  }, [currencies]);

  // Para birimi formatla
  const formatCurrency = useCallback((amount, currencyCode) => {
    const currency = getCurrency(currencyCode);
    if (!currency) return `${amount} ${currencyCode}`;

    const formatted = new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: currency.decimal_places || 2,
      maximumFractionDigits: currency.decimal_places || 2,
    }).format(amount);

    return currency.symbol_position === 'before' 
      ? `${currency.symbol}${formatted}`
      : `${formatted} ${currency.symbol}`;
  }, [getCurrency]);

  return { 
    currencies, 
    isLoading, 
    error, 
    getCurrency, 
    formatCurrency 
  };
};

// ============================================================
// COUNTRIES
// ============================================================

/**
 * Ülkeleri getir
 */
export const useCountries = (options = {}) => {
  const { search = '' } = options;
  const [countries, setCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCountries = async () => {
      // Cache kontrolü (arama yoksa)
      if (
        !search &&
        globalDataCache.countries && 
        Date.now() - (globalDataCache.lastFetch.countries || 0) < CACHE_DURATION
      ) {
        setCountries(globalDataCache.countries);
        setIsLoading(false);
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        let url = `${backendUrl}/api/global/countries`;
        if (search) {
          url += `?search=${encodeURIComponent(search)}`;
        }
        
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet (arama yoksa)
          if (!search) {
            globalDataCache.countries = data;
            globalDataCache.lastFetch.countries = Date.now();
          }
          
          setCountries(data);
        } else {
          setError('Ülkeler yüklenemedi');
        }
      } catch (err) {
        console.error('Ülkeler yükleme hatası:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCountries();
  }, [search]);

  // Kod ile ülke bul
  const getCountry = useCallback((code) => {
    return countries.find(c => c.code === code);
  }, [countries]);

  return { countries, isLoading, error, getCountry };
};

// ============================================================
// CITIES
// ============================================================

/**
 * Şehirleri getir (ülkeye göre filtrelenmiş)
 */
export const useCities = (countryCode, options = {}) => {
  const { hasFairCenter = null, search = '', limit = 100 } = options;
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCities = async () => {
      if (!countryCode) {
        setCities([]);
        setIsLoading(false);
        return;
      }

      // Cache kontrolü (basit sorgular için)
      const cacheKey = `cities_${countryCode}`;
      if (
        !search &&
        hasFairCenter === null &&
        globalDataCache.cities[cacheKey] && 
        Date.now() - (globalDataCache.lastFetch[cacheKey] || 0) < CACHE_DURATION
      ) {
        setCities(globalDataCache.cities[cacheKey]);
        setIsLoading(false);
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        let url = `${backendUrl}/api/global/cities?country_code=${countryCode}&limit=${limit}`;
        
        if (search) {
          url += `&search=${encodeURIComponent(search)}`;
        }
        if (hasFairCenter !== null) {
          url += `&has_fair_center=${hasFairCenter}`;
        }
        
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet (basit sorgular için)
          if (!search && hasFairCenter === null) {
            globalDataCache.cities[cacheKey] = data;
            globalDataCache.lastFetch[cacheKey] = Date.now();
          }
          
          setCities(data);
        } else {
          setError('Şehirler yüklenemedi');
        }
      } catch (err) {
        console.error('Şehirler yükleme hatası:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCities();
  }, [countryCode, hasFairCenter, search, limit]);

  return { cities, isLoading, error };
};

/**
 * Fuar merkezi olan şehirler
 */
export const useFairCities = (countryCode = null) => {
  return useCities(countryCode, { hasFairCenter: true });
};

// ============================================================
// LANGUAGES
// ============================================================

/**
 * Dilleri getir
 */
export const useLanguages = () => {
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadLanguages = async () => {
      // Cache kontrolü
      if (
        globalDataCache.languages && 
        Date.now() - (globalDataCache.lastFetch.languages || 0) < CACHE_DURATION
      ) {
        setLanguages(globalDataCache.languages);
        setIsLoading(false);
        return;
      }

      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/api/global/languages`);

        if (response.ok) {
          const data = await response.json();
          
          // Cache'e kaydet
          globalDataCache.languages = data;
          globalDataCache.lastFetch.languages = Date.now();
          
          setLanguages(data);
        } else {
          setError('Diller yüklenemedi');
        }
      } catch (err) {
        console.error('Diller yükleme hatası:', err);
        setError(err.message);
        
        // Fallback
        setLanguages([
          { code: 'tr', name: 'Turkish', name_native: 'Türkçe' },
          { code: 'en', name: 'English', name_native: 'English' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, []);

  return { languages, isLoading, error };
};

// ============================================================
// GLOBAL DATA CONTEXT
// ============================================================

const GlobalDataContext = createContext(null);

/**
 * Global Data Provider
 * App.jsx'te sarmalayıcı olarak kullan
 */
export const GlobalDataProvider = ({ children }) => {
  const { currencies, isLoading: currenciesLoading, formatCurrency, getCurrency } = useCurrencies();
  const { countries, isLoading: countriesLoading, getCountry } = useCountries();
  const { languages, isLoading: languagesLoading } = useLanguages();

  const isLoading = currenciesLoading || countriesLoading || languagesLoading;

  const value = {
    currencies,
    countries,
    languages,
    isLoading,
    formatCurrency,
    getCurrency,
    getCountry
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
};

/**
 * Global data context hook
 */
export const useGlobalData = () => {
  const context = useContext(GlobalDataContext);
  if (!context) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
};

// ============================================================
// CACHE UTILS
// ============================================================

/**
 * Global data cache'ini temizle
 */
export const clearGlobalDataCache = () => {
  globalDataCache.currencies = null;
  globalDataCache.countries = null;
  globalDataCache.cities = {};
  globalDataCache.languages = null;
  globalDataCache.lastFetch = {};
};

/**
 * Belirli bir cache'i temizle
 */
export const clearCache = (cacheType) => {
  if (cacheType === 'currencies') {
    globalDataCache.currencies = null;
    delete globalDataCache.lastFetch.currencies;
  } else if (cacheType === 'countries') {
    globalDataCache.countries = null;
    delete globalDataCache.lastFetch.countries;
  } else if (cacheType === 'cities') {
    globalDataCache.cities = {};
    // cities için tüm lastFetch'leri temizle
    Object.keys(globalDataCache.lastFetch).forEach(key => {
      if (key.startsWith('cities_')) {
        delete globalDataCache.lastFetch[key];
      }
    });
  } else if (cacheType === 'languages') {
    globalDataCache.languages = null;
    delete globalDataCache.lastFetch.languages;
  }
};

export default useGlobalData;
