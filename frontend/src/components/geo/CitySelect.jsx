import React, { useState, useEffect, useRef } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, ChevronDown, X, MapPin, Building } from 'lucide-react';

/**
 * CitySelect - Ülkeye bağlı aranabilir şehir seçim componenti
 * 
 * Props:
 * - country: Seçili ülke ISO2 kodu (örn: "TR")
 * - value: Seçili şehir adı
 * - onChange: (cityData) => void - Seçim değiştiğinde çağrılır
 * - placeholder: Input placeholder metni
 * - required: Zorunlu alan mı
 * - disabled: Component disabled mı
 * - className: Ek CSS sınıfları
 */
export default function CitySelect({
  country = "",
  value = "",
  onChange,
  placeholder = "Şehir seçin...",
  required = false,
  disabled = false,
  className = "",
  refreshTrigger = 0
}) {
  // Debug removed for production
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState(null);
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Backend URL'i al
  const backendUrl = window.runtimeConfig?.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;

  // Şehir verilerini getir
  const fetchCities = async (query = '', page = 1, append = false) => {
    if (!country) return;
    
    setIsLoading(true);
    try {
      // Use library cities endpoint
      const response = await fetch(`${backendUrl}/api/library/cities/${country}`);
      
      if (response.ok) {
        const citiesData = await response.json();
        let filteredCities = citiesData;
        
        // Apply search filter if query exists
        if (query) {
          filteredCities = citiesData.filter(city => 
            city.name.toLowerCase().includes(query.toLowerCase())
          );
        }
        
        // Simple pagination (client-side for now)
        const limit = 50;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCities = filteredCities.slice(startIndex, endIndex);
        
        if (append && page > 1) {
          setCities(prev => [...prev, ...paginatedCities]);
        } else {
          setCities(paginatedCities);
        }
        
        // Set pagination info
        const totalPages = Math.ceil(filteredCities.length / limit);
        setPagination({
          page: page,
          total_count: filteredCities.length,
          has_next: page < totalPages
        });
        setHasMore(page < totalPages);
      } else {
        console.error('Failed to fetch cities:', response.statusText);
        setCities([]);
        setPagination(null);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      setCities([]);
      setPagination(null);
      setHasMore(false);
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
      fetchCities(query, 1, false);
    }, 300);
    
    setDebounceTimer(newTimer);
  };

  // Load more cities
  const loadMoreCities = () => {
    if (hasMore && pagination && !isLoading) {
      fetchCities(searchQuery, pagination.page + 1, true);
    }
  };

  // Ülke değiştiğinde şehirleri yükle
  useEffect(() => {
    if (country) {
      fetchCities('', 1, false);
    } else {
      setCities([]);
      setSelectedCity(null);
      if (onChange) {
        onChange(null);
      }
    }
    
    // Cleanup timer on country change
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [country, refreshTrigger]); // refreshTrigger değiştiğinde de yeniden çek

  // Seçili şehri güncelle
  useEffect(() => {
    if (value && cities.length > 0) {
      const city = cities.find(c => c.name === value);
      setSelectedCity(city);
    } else if (!value) {
      setSelectedCity(null);
    }
  }, [value, cities]);

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

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setIsOpen(false);
    setSearchQuery('');
    if (onChange) {
      onChange(city);
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setSelectedCity(null);
    if (onChange) {
      onChange(null);
    }
  };

  const toggleDropdown = () => {
    if (!disabled && country) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        // Focus input when opening
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  };

  // Component disabled when no country selected
  const isComponentDisabled = disabled || !country;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main input area */}
      <div
        className={`
          relative flex items-center justify-between p-2 border border-gray-300 rounded-md 
          bg-white cursor-pointer transition-colors
          ${isComponentDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
          ${required && !selectedCity ? 'border-red-300' : ''}
        `}
        onClick={toggleDropdown}
      >
        <div className="flex items-center space-x-2 flex-1">
          <MapPin className="h-4 w-4 text-gray-400" />
          <span className={`text-sm ${selectedCity ? 'text-gray-900' : 'text-gray-500'}`}>
            {selectedCity ? (
              <span className="flex items-center space-x-2">
                <span className="font-medium">{selectedCity.name}</span>
                {selectedCity.is_capital && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">Başkent</span>
                )}
                {selectedCity.admin1 && (
                  <span className="text-xs text-gray-400">({selectedCity.admin1})</span>
                )}
              </span>
            ) : !country ? (
              <span className="text-gray-400">Önce ülke seçin</span>
            ) : (
              placeholder
            )}
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {selectedCity && !isComponentDisabled && (
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
      {isOpen && !isComponentDisabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {/* Search input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Şehir ara... (örn: Istanbul, Ankara)"
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Cities list */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading && cities.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span>Şehirler yükleniyor...</span>
                </div>
              </div>
            ) : cities.length > 0 ? (
              <div className="py-1">
                {cities.map((city) => (
                  <button
                    key={city.id}
                    className={`
                      w-full text-left px-3 py-2 text-sm hover:bg-blue-50 
                      ${selectedCity?.name === city.name ? 'bg-blue-100 text-blue-900' : 'text-gray-700'}
                    `}
                    onClick={() => handleCitySelect(city)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-3 w-3 text-gray-400" />
                        <span className="font-medium">{city.name}</span>
                        {city.is_capital && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">Başkent</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {city.admin1 && (
                          <span className="text-xs text-gray-400">{city.admin1}</span>
                        )}
                        {city.population && (
                          <span className="text-xs text-gray-400">
                            {(city.population / 1000000).toFixed(1)}M
                          </span>
                        )}
                        {selectedCity?.name === city.name && (
                          <div className="text-blue-600">✓</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Load more button */}
                {hasMore && (
                  <div className="p-2 border-t border-gray-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={loadMoreCities}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="inline-flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                          <span>Daha fazla yükleniyor...</span>
                        </div>
                      ) : (
                        'Daha fazla şehir yükle'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? `"${searchQuery}" için şehir bulunamadı` : 'Bu ülkede şehir bulunamadı'}
                <div className="mt-2 text-xs">
                  Şehrinizi bulamıyorsanız "Other" seçeneğini kullanabilirsiniz
                </div>
              </div>
            )}
          </div>

          {/* Footer info */}
          {cities.length > 0 && (
            <div className="p-2 border-t border-gray-100 text-xs text-gray-400 text-center">
              {pagination ? (
                <span>
                  {cities.length} şehir gösteriliyor
                  {pagination.total_count > cities.length && ` (toplam ${pagination.total_count})`}
                </span>
              ) : (
                `${cities.length} şehir gösteriliyor`
              )}
            </div>
          )}
        </div>
      )}

      {/* Help text */}
      {!country && (
        <div className="mt-1 text-xs text-gray-500">
          Şehir seçimi için önce ülke seçmeniz gerekiyor
        </div>
      )}
    </div>
  );
}