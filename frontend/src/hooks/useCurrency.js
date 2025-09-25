import { useState, useEffect } from 'react';

export const useCurrency = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/currency-rates`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch currency rates');
      }
      
      const ratesData = await response.json();
      
      // Convert to easier format
      const ratesMap = {};
      ratesData.forEach(rate => {
        ratesMap[rate.code] = {
          name: rate.name,
          buying: rate.buying_rate,
          selling: rate.selling_rate
        };
      });
      
      setRates(ratesMap);
      setError(null);
    } catch (err) {
      console.error('Currency rates error:', err);
      setError(err.message);
      // Set fallback rates
      setRates({
        USD: { name: 'US DOLLAR', buying: 34.5, selling: 34.7 },
        EUR: { name: 'EURO', buying: 38.2, selling: 38.5 },
        GBP: { name: 'POUND STERLING', buying: 44.1, selling: 44.4 }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    
    // Refresh rates every 30 minutes
    const interval = setInterval(fetchRates, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const convertFromTRY = (tryAmount) => {
    if (!rates) return null;
    
    return {
      TRY: tryAmount,
      USD: tryAmount / rates.USD?.selling || 0,
      EUR: tryAmount / rates.EUR?.selling || 0,
      GBP: tryAmount / rates.GBP?.selling || 0
    };
  };

  const formatCurrency = (amount, currency) => {
    const currencySymbols = {
      TRY: '₺',
      USD: '$',
      EUR: '€',
      GBP: '£'
    };

    return `${currencySymbols[currency] || ''}${amount.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    })}`;
  };

  return {
    rates,
    loading,
    error,
    convertFromTRY,
    formatCurrency,
    refreshRates: fetchRates
  };
};