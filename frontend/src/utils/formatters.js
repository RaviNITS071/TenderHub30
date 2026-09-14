/**
 * @file src/utils/formatters.js
 * @description Standardized enterprise formatting utilities for currency and dates.
 */

/**
 * Formats raw numeric values into standard Indian Rupee notation (e.g. ₹3 Lakh, ₹4.5 Cr).
 * Smartly handles missing data or Rate Contracts where value is 0.
 * 
 * @param {number|string} amount - Numerical value to format.
 * @returns {string} Formatted Indian Rupee string or contextual fallback.
 */
export const formatCurrencyINR = (amount) => {
  // Catch null, undefined, or empty strings
  if (amount === undefined || amount === null || amount === '') {
    return 'Not Specified';
  }
  
  const numericVal = Number(amount);
  
  // Catch strings that couldn't be converted to numbers (e.g., "NA")
  if (isNaN(numericVal)) {
    return 'Not Specified';
  }

  // Government portals often use 0 to indicate a Rate Contract or BOQ-dependent value
  if (numericVal === 0) {
    return 'Refer BOQ / Rate Contract';
  }
  
  if (numericVal >= 10000000) {
    return `₹${(numericVal / 10000000).toFixed(2)} Cr`;
  }
  if (numericVal >= 100000) {
    return `₹${(numericVal / 100000).toFixed(2)} Lakh`;
  }
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(numericVal);
};

/**
 * Formats ISO date string or MongoDB date objects into DD MMM YYYY display format.
 * 
 * @param {string|Date|Object} dateValue - Date object or ISO string.
 * @returns {string} Formatted readable date.
 */
export const formatDateDisplay = (dateValue) => {
  if (!dateValue || dateValue === 'NA' || dateValue === 'N/A') return 'N/A';
  
  const dateStr = typeof dateValue === 'object' && dateValue.$date ? dateValue.$date : dateValue;
  const parsed = new Date(dateStr);
  
  if (isNaN(parsed.getTime())) return 'N/A';
  
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};