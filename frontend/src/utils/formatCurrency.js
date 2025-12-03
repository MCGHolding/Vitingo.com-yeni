/**
 * Get currency symbol for any currency code
 * @param {string} currencyCode - Currency code
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'TRY': '₺', 'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CHF': 'Fr',
    'AED': 'د.إ', 'SAR': '﷼', 'KWD': 'د.ك', 'QAR': '﷼', 'BHD': '.د.ب',
    'OMR': '﷼', 'JOD': 'د.ا', 'CNY': '¥', 'INR': '₹', 'RUB': '₽',
    'BRL': 'R$', 'MXN': '$', 'CAD': 'C$', 'AUD': 'A$', 'NZD': 'NZ$',
    'SGD': 'S$', 'HKD': 'HK$', 'KRW': '₩', 'SEK': 'kr', 'NOK': 'kr',
    'DKK': 'kr', 'PLN': 'zł', 'CZK': 'Kč', 'HUF': 'Ft', 'RON': 'lei',
    'BGN': 'лв', 'HRK': 'kn', 'ILS': '₪', 'ZAR': 'R', 'THB': '฿',
    'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱', 'VND': '₫', 'PKR': '₨',
    'BDT': '৳', 'LKR': '₨', 'NPR': '₨', 'AFN': '؋', 'IRR': '﷼',
    'IQD': 'ع.د', 'SYP': '£', 'LBP': 'ل.ل', 'EGP': '£', 'MAD': 'د.م.',
    'TND': 'د.ت', 'DZD': 'د.ج', 'LYD': 'ل.د', 'ALL': 'L', 'ANG': 'ƒ', 'AWG': 'ƒ'
  };
  return symbols[currencyCode] || currencyCode;
};

/**
 * Safely format currency values
 * @param {number|string|null|undefined} amount - Amount to format
 * @param {string} currency - Currency code (supports 50+ currencies)
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  // Handle null, undefined, or invalid amounts
  const numAmount = Number(amount) || 0;
  const formatted = numAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 });
  return `${formatted} ${getCurrencySymbol(currency)}`;
};

/**
 * Format date to Turkish locale
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('tr-TR');
};
