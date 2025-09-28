import React from 'react';
import { Input } from './input';
import { useIban } from '../../hooks/useIban';

/**
 * Standart IBAN Input component
 * Otomatik formatla, validate eder ve hata mesajları gösterir
 * Tüm uygulamada IBAN girişi için kullanılacak
 */
const IbanInput = ({ 
  value, 
  onChange, 
  placeholder = "TR00 0000 0000 0000 0000 00 00", 
  className = "",
  required = false,
  disabled = false,
  ...props 
}) => {
  const { ibanError, handleIbanChange } = useIban();

  const handleInputChange = (inputValue) => {
    handleIbanChange(inputValue, onChange);
  };

  return (
    <div>
      <Input
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        className={`${className} ${ibanError ? 'border-red-500' : ''}`}
        required={required}
        disabled={disabled}
        {...props}
      />
      {ibanError && (
        <p className="text-red-500 text-sm mt-1">{ibanError}</p>
      )}
    </div>
  );
};

export default IbanInput;