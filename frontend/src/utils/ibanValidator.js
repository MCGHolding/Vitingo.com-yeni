// Ülkelere göre IBAN uzunlukları ve formatları
export const IBAN_SPECS = {
  TR: { length: 26, name: 'Türkiye', format: 'TR00 0000 0000 0000 0000 0000 00' },
  AE: { length: 23, name: 'BAE', format: 'AE00 0000 0000 0000 0000 000' },
  SA: { length: 24, name: 'Suudi Arabistan', format: 'SA00 0000 0000 0000 0000 0000' },
  DE: { length: 22, name: 'Almanya', format: 'DE00 0000 0000 0000 0000 00' },
  GB: { length: 22, name: 'İngiltere', format: 'GB00 0000 0000 0000 0000 00' },
  FR: { length: 27, name: 'Fransa', format: 'FR00 0000 0000 0000 0000 0000 000' },
  IT: { length: 27, name: 'İtalya', format: 'IT00 0000 0000 0000 0000 0000 000' },
  ES: { length: 24, name: 'İspanya', format: 'ES00 0000 0000 0000 0000 0000' },
  NL: { length: 18, name: 'Hollanda', format: 'NL00 0000 0000 0000 00' },
  BE: { length: 16, name: 'Belçika', format: 'BE00 0000 0000 0000' },
  AT: { length: 20, name: 'Avusturya', format: 'AT00 0000 0000 0000 0000' },
  CH: { length: 21, name: 'İsviçre', format: 'CH00 0000 0000 0000 0000 0' },
  PL: { length: 28, name: 'Polonya', format: 'PL00 0000 0000 0000 0000 0000 0000' },
  PT: { length: 25, name: 'Portekiz', format: 'PT00 0000 0000 0000 0000 0000 0' },
  SE: { length: 24, name: 'İsveç', format: 'SE00 0000 0000 0000 0000 0000' },
  NO: { length: 15, name: 'Norveç', format: 'NO00 0000 0000 000' },
  DK: { length: 18, name: 'Danimarka', format: 'DK00 0000 0000 0000 00' },
  FI: { length: 18, name: 'Finlandiya', format: 'FI00 0000 0000 0000 00' },
  GR: { length: 27, name: 'Yunanistan', format: 'GR00 0000 0000 0000 0000 0000 000' },
  CZ: { length: 24, name: 'Çekya', format: 'CZ00 0000 0000 0000 0000 0000' },
  RO: { length: 24, name: 'Romanya', format: 'RO00 0000 0000 0000 0000 0000' },
  HU: { length: 28, name: 'Macaristan', format: 'HU00 0000 0000 0000 0000 0000 0000' },
  IE: { length: 22, name: 'İrlanda', format: 'IE00 0000 0000 0000 0000 00' },
  QA: { length: 29, name: 'Katar', format: 'QA00 0000 0000 0000 0000 0000 0000 0' },
  KW: { length: 30, name: 'Kuveyt', format: 'KW00 0000 0000 0000 0000 0000 0000 00' },
  BH: { length: 22, name: 'Bahreyn', format: 'BH00 0000 0000 0000 0000 00' },
  JO: { length: 30, name: 'Ürdün', format: 'JO00 0000 0000 0000 0000 0000 0000 00' },
  LB: { length: 28, name: 'Lübnan', format: 'LB00 0000 0000 0000 0000 0000 0000' },
  EG: { length: 29, name: 'Mısır', format: 'EG00 0000 0000 0000 0000 0000 0000 0' },
  RU: { length: 33, name: 'Rusya', format: 'RU00 0000 0000 0000 0000 0000 0000 0000 0' },
  UA: { length: 29, name: 'Ukrayna', format: 'UA00 0000 0000 0000 0000 0000 0000 0' },
  AZ: { length: 28, name: 'Azerbaycan', format: 'AZ00 0000 0000 0000 0000 0000 0000' },
  GE: { length: 22, name: 'Gürcistan', format: 'GE00 0000 0000 0000 0000 00' },
  KZ: { length: 20, name: 'Kazakistan', format: 'KZ00 0000 0000 0000 0000' },
  PK: { length: 24, name: 'Pakistan', format: 'PK00 0000 0000 0000 0000 0000' },
};

// IBAN kullanmayan ülkeler
export const NON_IBAN_COUNTRIES = ['US', 'CA', 'AU', 'CN', 'JP', 'IN', 'MX', 'SG', 'HK', 'KR'];

// IBAN formatla (4'lü gruplar)
export const formatIBAN = (iban) => {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
};

// MOD-97 hesaplama
const mod97 = (numericString) => {
  let remainder = numericString;
  while (remainder.length > 2) {
    const block = remainder.substring(0, 9);
    remainder = (parseInt(block, 10) % 97).toString() + remainder.substring(9);
  }
  return parseInt(remainder, 10) % 97;
};

// Ana validasyon fonksiyonu
export const validateIBAN = (iban, selectedCountry = null) => {
  const clean = iban.replace(/\s/g, '').toUpperCase();
  
  // Boş ise validasyon yapma
  if (!clean) {
    return { valid: false, error: null, message: '' };
  }
  
  // Minimum 2 karakter (ülke kodu)
  if (clean.length < 2) {
    return { valid: false, error: 'short', message: 'IBAN çok kısa' };
  }
  
  // Ülke kodu al
  const countryCode = clean.substring(0, 2);
  
  // Harf kontrolü
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    return { valid: false, error: 'country', message: 'IBAN ülke koduyla başlamalı (örn: TR, AE)' };
  }
  
  // Seçili ülke ile eşleşme kontrolü
  if (selectedCountry && !NON_IBAN_COUNTRIES.includes(selectedCountry)) {
    const expectedPrefix = selectedCountry;
    if (countryCode !== expectedPrefix) {
      // Get country name if exists in IBAN_SPECS
      const selectedCountryName = IBAN_SPECS[selectedCountry]?.name || selectedCountry;
      const detectedCountryName = IBAN_SPECS[countryCode]?.name || countryCode;
      
      return { 
        valid: false, 
        error: 'mismatch', 
        message: `Ülke uyuşmazlığı: Seçili ülke "${selectedCountryName}" (${selectedCountry}), IBAN "${detectedCountryName}" (${countryCode}) ile başlıyor`,
        detectedCountry: countryCode
      };
    }
  }
  
  // Spec bul
  const spec = IBAN_SPECS[countryCode];
  
  if (!spec) {
    // Bilinmeyen ülke - sadece format kontrolü yap
    if (clean.length >= 15 && clean.length <= 34 && /^[A-Z0-9]+$/.test(clean)) {
      return { valid: true, message: '✓ IBAN formatı geçerli', countryCode };
    }
    return { valid: false, error: 'unknown', message: `"${countryCode}" ülke kodu tanınmıyor` };
  }
  
  // Uzunluk kontrolü - eksik
  if (clean.length < spec.length) {
    const remaining = spec.length - clean.length;
    return { 
      valid: false, 
      error: 'incomplete', 
      message: `${remaining} karakter daha (${spec.name}: ${spec.length} karakter)`,
      format: spec.format
    };
  }
  
  // Uzunluk kontrolü - fazla
  if (clean.length > spec.length) {
    return { 
      valid: false, 
      error: 'long', 
      message: `Çok uzun. ${spec.name} için ${spec.length} karakter olmalı`
    };
  }
  
  // Alfanumerik kontrolü
  if (!/^[A-Z0-9]+$/.test(clean)) {
    return { valid: false, error: 'chars', message: 'Sadece harf ve rakam kullanın' };
  }
  
  // Kontrol haneleri
  if (!/^\d{2}$/.test(clean.substring(2, 4))) {
    return { valid: false, error: 'check', message: '3-4. karakterler rakam olmalı' };
  }
  
  // MOD-97 kontrolü
  const rearranged = clean.substring(4) + clean.substring(0, 4);
  let numericIBAN = '';
  for (const char of rearranged) {
    numericIBAN += /[A-Z]/.test(char) ? (char.charCodeAt(0) - 55).toString() : char;
  }
  
  if (mod97(numericIBAN) !== 1) {
    return { valid: false, error: 'checksum', message: 'Geçersiz IBAN - kontrol hatası' };
  }
  
  return { 
    valid: true, 
    message: `✓ Geçerli ${spec.name} IBAN`,
    countryCode,
    countryName: spec.name,
    formatted: formatIBAN(clean)
  };
};

// Placeholder al
export const getIBANPlaceholder = (countryCode) => {
  return IBAN_SPECS[countryCode]?.format || 'Örn: TR12 3456 7890 1234 5678 9012 34';
};

// Max uzunluk (boşluklar dahil)
export const getIBANMaxLength = (countryCode) => {
  const spec = IBAN_SPECS[countryCode];
  return spec ? spec.length + Math.floor(spec.length / 4) : 42;
};
