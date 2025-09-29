import { useState } from 'react';

/**
 * Telefon numarası yönetimi için merkezi hook
 * Tüm uygulamada telefon numarası işlemleri için kullanılacak
 */
export const usePhone = () => {
  const [phoneError, setPhoneError] = useState('');

  // Telefon numarası validasyonu
  const validatePhone = (phone) => {
    if (!phone) return '';
    
    // Minimum uzunluk kontrolü (ülke kodu dahil)
    if (phone.length < 10) {
      return 'Telefon numarası çok kısa';
    }
    
    // Maksimum uzunluk kontrolü
    if (phone.length > 17) {
      return 'Telefon numarası çok uzun';
    }
    
    // Sadece rakam ve + kontrolü
    if (!/^[\d+\s()-]+$/.test(phone)) {
      return 'Geçersiz karakter içeriyor';
    }
    
    return '';
  };

  // Telefon numarası formatla (react-phone-input-2 kendi formatlıyor)
  const formatPhone = (phone) => {
    return phone || '';
  };

  // Telefon input handler
  const handlePhoneChange = (value, onChange) => {
    // Validasyon
    const error = validatePhone(value);
    setPhoneError(error);
    
    // Form'a güncellenmiş değeri gönder
    if (onChange) {
      onChange(value);
    }
    
    return value;
  };

  // Telefon numarasını temizle (sadece rakamlar)
  const cleanPhone = (phone) => {
    return phone.replace(/[^\d]/g, '');
  };

  // Telefon numarasının geçerli olup olmadığını kontrol et
  const isValidPhone = (phone) => {
    return validatePhone(phone) === '';
  };

  // Telefon numarasını uluslararası formata çevir
  const toInternationalFormat = (phone, countryCode = 'tr') => {
    if (!phone) return '';
    
    // Eğer zaten + ile başlıyorsa olduğu gibi döndür
    if (phone.startsWith('+')) return phone;
    
    // Ülke koduna göre format
    const countryPrefixes = {
      'tr': '+90',
      'us': '+1',
      'de': '+49',
      'fr': '+33',
      'uk': '+44'
    };
    
    const prefix = countryPrefixes[countryCode] || '+90';
    return `${prefix}${cleanPhone(phone)}`;
  };

  return {
    phoneError,
    setPhoneError,
    validatePhone,
    formatPhone,
    handlePhoneChange,
    cleanPhone,
    isValidPhone,
    toInternationalFormat
  };
};

export default usePhone;