import React from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const SupplierPhone = ({ 
  value, 
  onChange, 
  label = "Telefon Numarası",
  placeholder = "Telefon numarası giriniz",
  className = "",
  required = false
}) => {
  
  return (
    <div className={`my-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <PhoneInput
        country={"tr"}
        value={value}
        onChange={onChange}
        enableSearch={true}   // Arama kutusu
        disableSearchIcon={false}
        inputClass="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
          autoFocus: false
        }}
      />
    </div>
  );
};

export default SupplierPhone;