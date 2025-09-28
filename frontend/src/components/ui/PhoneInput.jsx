import React, { useState } from 'react';
import { Input } from './input';
import SearchableSelect from './SearchableSelect';

const PhoneInput = ({ 
  value, 
  onChange, 
  placeholder = "Telefon numarası", 
  className = "",
  required = false 
}) => {
  // Telefon değerini parse et: "+90 5555555555" formatında
  const parsePhoneValue = (phoneValue) => {
    if (!phoneValue) return { countryCode: '+90', number: '' };
    
    const match = phoneValue.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) {
      return { countryCode: match[1], number: match[2] };
    }
    
    return { countryCode: '+90', number: phoneValue };
  };

  const parsedValue = parsePhoneValue(value);
  const [countryCode, setCountryCode] = useState(parsedValue.countryCode);
  const [phoneNumber, setPhoneNumber] = useState(parsedValue.number);

  // Ülke kodları listesi
  const countryOptions = [
    { value: '+90', label: '🇹🇷 +90', sublabel: 'Turkey' },
    { value: '+1', label: '🇺🇸 +1', sublabel: 'USA' },
    { value: '+44', label: '🇬🇧 +44', sublabel: 'UK' },
    { value: '+49', label: '🇩🇪 +49', sublabel: 'Germany' },
    { value: '+33', label: '🇫🇷 +33', sublabel: 'France' },
    { value: '+39', label: '🇮🇹 +39', sublabel: 'Italy' },
    { value: '+34', label: '🇪🇸 +34', sublabel: 'Spain' },
    { value: '+31', label: '🇳🇱 +31', sublabel: 'Netherlands' },
    { value: '+41', label: '🇨🇭 +41', sublabel: 'Switzerland' },
    { value: '+43', label: '🇦🇹 +43', sublabel: 'Austria' },
    { value: '+32', label: '🇧🇪 +32', sublabel: 'Belgium' },
    { value: '+46', label: '🇸🇪 +46', sublabel: 'Sweden' },
    { value: '+47', label: '🇳🇴 +47', sublabel: 'Norway' },
    { value: '+45', label: '🇩🇰 +45', sublabel: 'Denmark' },
    { value: '+358', label: '🇫🇮 +358', sublabel: 'Finland' },
    { value: '+7', label: '🇷🇺 +7', sublabel: 'Russia' },
    { value: '+86', label: '🇨🇳 +86', sublabel: 'China' },
    { value: '+81', label: '🇯🇵 +81', sublabel: 'Japan' },
    { value: '+82', label: '🇰🇷 +82', sublabel: 'South Korea' },
    { value: '+91', label: '🇮🇳 +91', sublabel: 'India' },
    { value: '+61', label: '🇦🇺 +61', sublabel: 'Australia' },
    { value: '+55', label: '🇧🇷 +55', sublabel: 'Brazil' },
    { value: '+52', label: '🇲🇽 +52', sublabel: 'Mexico' },
    { value: '+27', label: '🇿🇦 +27', sublabel: 'South Africa' }
  ];

  const handleCountryCodeChange = (newCountryCode) => {
    setCountryCode(newCountryCode);
    const fullValue = phoneNumber ? `${newCountryCode} ${phoneNumber}` : newCountryCode;
    if (onChange) {
      onChange(fullValue);
    }
  };

  const handlePhoneNumberChange = (e) => {
    const newNumber = e.target.value;
    setPhoneNumber(newNumber);
    const fullValue = newNumber ? `${countryCode} ${newNumber}` : countryCode;
    if (onChange) {
      onChange(fullValue);
    }
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      {/* Ülke Kodu Seçici */}
      <div className="w-48">
        <SearchableSelect
          options={countryOptions}
          value={countryCode}
          onValueChange={handleCountryCodeChange}
          placeholder="Ülke kodu"
          className="phone-country-select"
        />
      </div>
      
      {/* Telefon Numarası Input */}
      <div className="flex-1">
        <Input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          required={required}
        />
      </div>
    </div>
  );
};

export default PhoneInput;