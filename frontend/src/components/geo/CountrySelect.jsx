import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, ChevronDown, X, Globe } from 'lucide-react';

/**
 * CountrySelect - Aranabilir ülke seçim componenti
 * 
 * Props:
 * - value: Seçili ülke ISO2 kodu (örn: "TR")
 * - onChange: (countryData) => void - Seçim değiştiğinde çağrılır
 * - placeholder: Input placeholder metni
 * - required: Zorunlu alan mı
 * - disabled: Component disabled mı
 * - className: Ek CSS sınıfları
 */
export default function CountrySelect({
  value = "",
  onChange,
  placeholder = "Ülke seçin...",
  required = false,
  disabled = false,
  className = "",
  refreshTrigger = 0
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Backend URL'i al
  const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

  // Ülke verilerini getir (ilk yüklemede ve arama yaparken)
  const fetchCountries = async (query = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/library/countries?query=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setCountries(data);
        setFilteredCountries(data);
      } else {
        console.error('Failed to fetch countries:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching countries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    // Set new timer (300ms debounce)
    const newTimer = setTimeout(() => {
      fetchCountries(query);
    }, 300);
    
    setDebounceTimer(newTimer);
  };

  // İlk yüklemede varsayılan ülkeyi ayarla (Türkiye)
  useEffect(() => {
    fetchCountries();
    
    // Cleanup timer on unmount
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [refreshTrigger]); // refreshTrigger değiştiğinde yeniden çek

  // Seçili ülkeyi güncelle
  useEffect(() => {
    if (value && countries.length > 0) {
      const country = countries.find(c => c.iso2 === value);
      setSelectedCountry(country);
    } else if (!value) {
      setSelectedCountry(null);
    }
  }, [value, countries]);

  // Varsayılan Türkiye seçimi
  useEffect(() => {
    if (!value && countries.length > 0) {
      const turkey = countries.find(c => c.iso2 === 'TR');
      if (turkey && onChange) {
        setSelectedCountry(turkey);
        onChange(turkey);
      }
    }
  }, [countries, value, onChange]);

  // Dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery('');
    if (onChange) {
      onChange(country);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedCountry(null);
    if (onChange) {
      onChange(null);
    }
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Focus input when opening
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main input area */}
      <div
        className={`
          relative flex items-center justify-between p-2 border border-gray-300 rounded-md 
          bg-white cursor-pointer transition-colors
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
          ${required && !selectedCountry ? 'border-red-300' : ''}
        `}
        onClick={toggleDropdown}
      >
        <div className="flex items-center space-x-2 flex-1">
          <Globe className="h-4 w-4 text-gray-400" />
          <span className={`text-sm ${selectedCountry ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedCountry ? (
              <span className="flex items-center space-x-2">
                <span className="font-medium">{selectedCountry.name}</span>
                <span className="text-xs text-gray-400">({selectedCountry.iso2})</span>
              </span>
            ) : (
              placeholder
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {selectedCountry && !disabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={clearSelection}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Ülke ara... (örn: Turkey, Türkiye)"
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Countries list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span>Ülkeler yükleniyor...</span>
                </div>
              </div>
            ) : filteredCountries.length > 0 ? (
              <div className="py-1">
                {filteredCountries.map((country) => (
                  <button
                    key={country.id}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between
                      ${selectedCountry?.iso2 === country.iso2 ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
                    `}
                    onClick={() => handleCountrySelect(country)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{country.name}</span>
                      <span className="text-xs text-gray-400 font-mono">({country.iso2})</span>
                    </div>
                    {selectedCountry?.iso2 === country.iso2 && (
                      <div className="text-blue-600">✓</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? `"${searchQuery}" için ülke bulunamadı` : 'Ülke bulunamadı'}
              </div>
            )}
          </div>

          {/* Footer info */}
          {filteredCountries.length > 0 && (
            <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
              {filteredCountries.length} ülke gösteriliyor
            </div>
          )}
        </div>
      )}
    </div>
  );
}