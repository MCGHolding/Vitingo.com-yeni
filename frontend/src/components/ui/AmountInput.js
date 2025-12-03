import React from 'react';
import { Input } from './input';

const AmountInput = ({ 
  value, 
  onChange, 
  placeholder = "0,00", 
  className = "form-input text-lg font-semibold",
  required = false,
  id,
  disabled = false,
  currency = "TRY",
  ...props 
}) => {
  const [displayAmount, setDisplayAmount] = React.useState('');

  // Format number with Turkish locale (1.000.000,00 format)
  const formatAmount = (amount) => {
    if (!amount || amount === '') return '';
    const numValue = Number(amount);
    if (isNaN(numValue) || numValue === 0) return '';
    return numValue.toLocaleString('tr-TR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Get display value - use displayAmount if exists, otherwise format the actual value
  const getDisplayValue = () => {
    if (displayAmount !== '') return displayAmount;
    return value ? formatAmount(value) : '';
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    
    // Store display value for immediate visual feedback
    setDisplayAmount(inputValue);
    
    // Extract numeric value for backend
    const numericValue = inputValue.replace(/[^\d,]/g, '').replace(/\./g, '').replace(',', '.');
    
    if (numericValue && !isNaN(Number(numericValue))) {
      onChange(numericValue);
    } else {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Format on blur
    if (value) {
      const formatted = formatAmount(value);
      setDisplayAmount(formatted);
    } else {
      setDisplayAmount('');
    }
  };

  const handleFocus = () => {
    // Clear display amount to allow raw input
    setDisplayAmount('');
  };

  return (
    <Input
      id={id}
      type="text"
      value={getDisplayValue()}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={className}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      {...props}
    />
  );
};

export default AmountInput;