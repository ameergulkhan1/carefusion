/**
 * Currency Formatter Utility
 * Formats amounts to Pakistan Rupees (PKR)
 */

// Format amount to PKR currency
export const formatPKR = (amount) => {
  if (!amount && amount !== 0) return 'Rs. 0';
  
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format amount with PKR symbol prefix (Rs. 1,234)
export const formatPKRSimple = (amount) => {
  if (!amount && amount !== 0) return 'Rs. 0';
  
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  return `Rs. ${formatted}`;
};

// Format amount with PKR symbol inline
export const formatPKRInline = (amount) => {
  if (!amount && amount !== 0) return '₨0';
  
  const formatted = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
  
  return `₨${formatted}`;
};

// Get just the PKR symbol
export const PKR_SYMBOL = '₨';

// Get PKR code
export const PKR_CODE = 'PKR';

// Format price for display (default: Rs. 1,234)
export const formatPrice = (amount) => formatPKRSimple(amount);

// Format amount with comma separator (1,234)
export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return '0';
  
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
