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
    { value: '+90', label: '🇹🇷 +90 (Turkey)' },
    { value: '+1', label: '🇺🇸 +1 (USA)' },
    { value: '+44', label: '🇬🇧 +44 (UK)' },
    { value: '+49', label: '🇩🇪 +49 (Germany)' },
    { value: '+33', label: '🇫🇷 +33 (France)' },
    { value: '+39', label: '🇮🇹 +39 (Italy)' },
    { value: '+34', label: '🇪🇸 +34 (Spain)' },
    { value: '+31', label: '🇳🇱 +31 (Netherlands)' },
    { value: '+41', label: '🇨🇭 +41 (Switzerland)' },
    { value: '+43', label: '🇦🇹 +43 (Austria)' },
    { value: '+32', label: '🇧🇪 +32 (Belgium)' },
    { value: '+46', label: '🇸🇪 +46 (Sweden)' },
    { value: '+47', label: '🇳🇴 +47 (Norway)' },
    { value: '+45', label: '🇩🇰 +45 (Denmark)' },
    { value: '+358', label: '🇫🇮 +358 (Finland)' },
    { value: '+7', label: '🇷🇺 +7 (Russia)' },
    { value: '+86', label: '🇨🇳 +86 (China)' },
    { value: '+81', label: '🇯🇵 +81 (Japan)' },
    { value: '+82', label: '🇰🇷 +82 (South Korea)' },
    { value: '+91', label: '🇮🇳 +91 (India)' },
    { value: '+61', label: '🇦🇺 +61 (Australia)' },
    { value: '+55', label: '🇧🇷 +55 (Brazil)' },
    { value: '+52', label: '🇲🇽 +52 (Mexico)' },
    { value: '+27', label: '🇿🇦 +27 (South Africa)' }
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