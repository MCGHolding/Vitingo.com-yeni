import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, Globe } from 'lucide-react';

const CountrySelect = ({ 
  value, 
  onChange, 
  placeholder = "Ülke seçin...", 
  searchPlaceholder = "Ara...",
  countries = [],
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCountries, setFilteredCountries] = useState([]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm, countries]);

  const selectedCountry = countries.find(c => c.code === value || c.iso2 === value);

  const handleSelect = (country) => {
    onChange(country.code || country.iso2);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Main Input Field */}
      <div 
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer
          flex items-center justify-between
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : ''}
        `}
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-gray-500" />
          <span className={selectedCountry ? 'text-gray-900' : 'text-gray-500'}>
            {selectedCountry ? selectedCountry.name : placeholder}
          </span>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
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
            {filteredCountries.length > 0 ? (
              <>
                {filteredCountries.map((country) => (
                  <div
                    key={country.code || country.iso2}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center space-x-2
                      hover:bg-blue-50 hover:text-blue-700
                      ${(country.code === value || country.iso2 === value) ? 'bg-blue-100 text-blue-700' : 'text-gray-900'}
                    `}
                    onClick={() => handleSelect(country)}
                  >
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{country.name}</span>
                  </div>
                ))}
                
                {/* Options Count */}
                <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                  {filteredCountries.length} seçenek gösteriliyor
                </div>
              </>
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                Sonuç bulunamadı
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;