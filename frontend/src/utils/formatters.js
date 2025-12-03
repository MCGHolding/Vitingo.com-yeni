// Utility functions for formatting data across the application

/**
 * Format advance number to show only last 4 digits with ellipsis
 * @param {string} advanceNumber - Full advance number (e.g., "AVS-2025-10-00001")
 * @returns {string} - Formatted number (e.g., "...0001")
 */
export const formatAdvanceNumber = (advanceNumber) => {
  if (!advanceNumber) return '';
  
  // Get last 4 characters
  const lastFour = advanceNumber.slice(-4);
  return `...${lastFour}`;
};

/**
 * Format currency with Turkish locale
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency symbol (default: '₺')
 * @returns {string} - Formatted currency
 */
export const formatCurrency = (amount, currency = '₺') => {
  const numAmount = Number(amount) || 0;
  return numAmount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + ` ${currency}`;
};

/**
 * Format date to Turkish locale
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export const formatDate = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  } catch (error) {
    return '-';
  }
};

/**
 * Create advance number component with tooltip
 * @param {string} fullNumber - Full advance number
 * @param {string} className - Additional CSS classes
 * @returns {object} - React component props
 */
export const createAdvanceNumberComponent = (fullNumber, className = '') => {
  return {
    text: formatAdvanceNumber(fullNumber),
    title: fullNumber, // For tooltip
    className: `font-mono cursor-help ${className}` // Monospace font + cursor hint
  };
};

// Tooltip component should be imported and used in individual components