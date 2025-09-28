import { useState } from 'react';

/**
 * IBAN validasyonu ve formatlaması için custom hook
 * Tüm uygulamada IBAN işlemleri için kullanılacak
 */
export const useIban = (initialValue = '') => {
  const [ibanError, setIbanError] = useState('');

  // IBAN validasyonu - Gelişmiş version (mod 97 algoritması ile)
  const validateIban = (iban) => {
    // Boşlukları sil ve büyük harfe çevir
    const rawIban = iban.replace(/\s/g, '').toUpperCase();
    
    if (!rawIban) {
      return '';
    }

    // 1. Uzunluk kontrolü
    if (rawIban.length < 15 || rawIban.length > 34) {
      return "IBAN uzunluğu 15 ile 34 karakter arasında olmalıdır.";
    }

    // 2. İlk 2 karakter harf değilse
    if (!/^[A-Z]{2}/.test(rawIban)) {
      return "İlk 2 karakter harf olmalıdır.";
    }

    // 3. İlk 2 karakterden sonrasında harf varsa
    if (!/^[A-Z]{2}[0-9]+$/.test(rawIban)) {
      return "İlk 2 karakterden sonrası sadece rakam olmalıdır.";
    }

    // 4. Genel format (sadece alfanümerik)
    if (!/^[A-Z0-9]+$/.test(rawIban)) {
      return "IBAN sadece harf ve rakam içerebilir.";
    }

    // 5. Checksum (mod 97 algoritması)
    const rearranged = rawIban.slice(4) + rawIban.slice(0, 4);
    let expanded = "";
    
    for (let char of rearranged) {
      if (/[A-Z]/.test(char)) {
        expanded += (char.charCodeAt(0) - 55).toString();
      } else {
        expanded += char;
      }
    }

    let remainder = parseInt(expanded[0]);
    for (let i = 1; i < expanded.length; i++) {
      remainder = (remainder * 10 + parseInt(expanded[i])) % 97;
    }

    if (remainder !== 1) {
      return "Geçersiz IBAN (checksum hatası).";
    }

    // ✅ Geçerli IBAN
    return '';
  };

  // IBAN formatla - her 4 karakterde bir boşluk
  const formatIban = (iban) => {
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();
    let formatted = '';
    for (let i = 0; i < cleanIban.length; i += 4) {
      if (i > 0) formatted += ' ';
      formatted += cleanIban.slice(i, i + 4);
    }
    return formatted;
  };

  // IBAN input handler - format ve validate işlemlerini birleştirir
  const handleIbanChange = (value, onChange) => {
    // Önce formatla
    const formattedValue = formatIban(value);
    
    // Form'a güncellenmiş değeri gönder
    if (onChange) {
      onChange(formattedValue);
    }
    
    // Sonra validate et
    const error = validateIban(formattedValue);
    setIbanError(error);
    
    return formattedValue;
  };

  // IBAN'ı sadece temizle (boşluksuz, büyük harf)
  const cleanIban = (iban) => {
    return iban.replace(/\s/g, '').toUpperCase();
  };

  // IBAN'ın geçerli olup olmadığını kontrol et
  const isValidIban = (iban) => {
    return validateIban(iban) === '';
  };

  return {
    ibanError,
    setIbanError,
    validateIban,
    formatIban,
    handleIbanChange,
    cleanIban,
    isValidIban
  };
};

export default useIban;