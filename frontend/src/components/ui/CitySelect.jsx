import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, MapPin, Edit } from 'lucide-react';

const CitySelect = ({ 
  value, 
  onChange, 
  placeholder = "Şehir seçin...", 
  searchPlaceholder = "Ara...",
  cities = [],
  disabled = false,
  className = "",
  allowManualEntry = true,
  countrySelected = false,
  noCountryMessage = "Önce ülke seçiniz...",
  noCitiesMessage = "Bu ülke için kayıtlı şehir bulunamadı"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [showManualEntry, setShowManualEntry] = useState(false);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities(cities);
    } else {
      const filtered = cities.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  }, [searchTerm, cities]);

  const selectedCity = cities.find(c => c.name === value);

  const handleSelect = (city) => {
    onChange(city.name);
    setIsOpen(false);
    setSearchTerm('');
    setShowManualEntry(false);
  };

  const handleManualEntryToggle = () => {
    setShowManualEntry(!showManualEntry);
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (!disabled && countrySelected) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
        setShowManualEntry(false);
      }
    }
  };

  const getPlaceholderText = () => {
    if (!countrySelected) {
      return noCountryMessage;
    }
    if (cities.length === 0) {
      return noCitiesMessage;
    }
    return placeholder;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Input Field */}
      <div 
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer
          flex items-center justify-between
          ${disabled || !countrySelected ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || getPlaceholderText()}
          </span>
        </div>
        {countrySelected && (
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>

      {/* Dropdown Menu */}
      {isOpen && countrySelected && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Bar */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="h-4 w-4 text-gray-400 absolute left-2 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-2 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredCities.length > 0 ? (
              <>
                {filteredCities.map((city) => (
                  <div
                    key={city.id}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center space-x-2
                      hover:bg-blue-50 hover:text-blue-700
                      ${city.name === value ? 'bg-blue-100 text-blue-700' : 'text-gray-900'}
                    `}
                    onClick={() => handleSelect(city)}
                  >
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{city.name}</span>
                  </div>
                ))}
                
                {/* Manual Entry Option */}
                {allowManualEntry && (
                  <div
                    className="px-3 py-2 cursor-pointer flex items-center space-x-2 border-t border-gray-100 hover:bg-gray-50"
                    onClick={handleManualEntryToggle}
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Manuel olarak gir</span>
                  </div>
                )}
                
                {/* Options Count */}
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                  {filteredCities.length} seçenek gösteriliyor
                </div>
              </>
            ) : (
              <>
                {allowManualEntry && (
                  <div
                    className="px-3 py-2 cursor-pointer flex items-center space-x-2 hover:bg-gray-50"
                    onClick={handleManualEntryToggle}
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Manuel olarak gir</span>
                  </div>
                )}
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  Sonuç bulunamadı
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Manual Entry Field */}
      {showManualEntry && (
        <div className="mt-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Şehir adını manuel olarak girin"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
        </div>
      )}
    </div>
  );
};

export default CitySelect;