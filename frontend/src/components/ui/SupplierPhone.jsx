import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { usePhone } from "../../hooks/usePhone";

/**
 * Standart Telefon Input Component
 * Tüm uygulamada telefon numarası girişi için kullanılacak merkezi component
 */
const VitingoPhoneInput = ({ 
  value, 
  onChange, 
  label = "Telefon Numarası",
  placeholder = "Telefon numarası giriniz",
  className = "",
  required = false,
  disabled = false,
  country = "tr",
  ...props
}) => {
  const { phoneError, handlePhoneChange } = usePhone();

  const handleInputChange = (phoneValue) => {
    handlePhoneChange(phoneValue, onChange);
  };

  return (
    <div className={`my-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <PhoneInput
        country={country}
        value={value}
        onChange={handleInputChange}
        enableSearch={true}   // Arama kutusu
        disableSearchIcon={false}
        disabled={disabled}
        inputClass={`w-full py-2 px-3 border rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${phoneError ? 'border-red-500' : 'border-gray-300'}`}
        containerClass="phone-input-container"
        buttonClass="phone-input-button"
        dropdownClass="phone-input-dropdown"
        searchClass="phone-input-search"
        placeholder={placeholder}
        specialLabel=""
        countryCodeEditable={false}
        enableAreaCodes={false}
        enableLongNumbers={true}
        inputProps={{
          name: 'phone',
          required: required,
          autoFocus: false,
          ...props
        }}
      />
      {phoneError && (
        <p className="text-red-500 text-sm mt-1">{phoneError}</p>
      )}
    </div>
  );
};

// Geriye uyumluluk için eski isim
export const SupplierPhone = VitingoPhoneInput;
export default VitingoPhoneInput;