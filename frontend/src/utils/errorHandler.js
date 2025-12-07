/**
 * Centralized error handling utility
 * Provides user-friendly error messages for common API errors
 */

import { logger } from './logger';

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export const getUserFriendlyMessage = (error) => {
  // Network errors
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
  }
  
  // Authentication errors
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    return 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.';
  }
  
  // Permission errors
  if (error.message.includes('403') || error.message.includes('Forbidden')) {
    return 'Bu işlem için yetkiniz bulunmuyor.';
  }
  
  // Not found errors
  if (error.message.includes('404') || error.message.includes('Not Found')) {
    return 'Aranan kayıt bulunamadı.';
  }
  
  // Server errors
  if (error.message.includes('500') || error.message.includes('Internal Server Error')) {
    return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  }
  
  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('Timeout')) {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }
  
  // Default: return original message or generic message
  return error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
};

/**
 * Handle error with logging and user notification
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {Function} notifyUser - Optional function to notify user (e.g., toast)
 */
export const handleError = (error, context = '', notifyUser = null) => {
  // Log error for debugging
  logger.error(`Error in ${context}:`, error);
  
  // Get user-friendly message
  const userMessage = getUserFriendlyMessage(error);
  
  // Notify user if function provided
  if (notifyUser && typeof notifyUser === 'function') {
    notifyUser(userMessage, 'error');
  }
  
  return userMessage;
};

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error logging
 * @returns {Function} Wrapped function
 */
export const withErrorHandling = (fn, context = '') => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const message = handleError(error, context);
      throw new Error(message);
    }
  };
};

export default {
  getUserFriendlyMessage,
  handleError,
  withErrorHandling
};
