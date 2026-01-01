/**
 * Format amount as Indian Rupees with Lakhs/Crores notation
 * @param {number} amount - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency string with ₹ symbol
 */
export const formatCurrency = (amount, decimals = 2) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `₹0.${'0'.repeat(decimals)}`
  }
  
  const numAmount = parseFloat(amount)
  const absAmount = Math.abs(numAmount)
  
  // Format in Crores (>= 1 Crore = 1,00,00,000)
  if (absAmount >= 10000000) {
    const crores = numAmount / 10000000
    return `₹${crores.toFixed(decimals)} Cr`
  }
  
  // Format in Lakhs (>= 1 Lakh = 1,00,000)
  if (absAmount >= 100000) {
    const lakhs = numAmount / 100000
    return `₹${lakhs.toFixed(decimals)} L`
  }
  
  // Format in Thousands (>= 1,000)
  if (absAmount >= 1000) {
    const thousands = numAmount / 1000
    return `₹${thousands.toFixed(decimals)} K`
  }
  
  // For amounts less than 1000, show full amount
  return `₹${numAmount.toFixed(decimals)}`
}

/**
 * Format amount for display in tooltips and charts (with full detail)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrencyTooltip = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00'
  }
  
  const numAmount = parseFloat(amount)
  const absAmount = Math.abs(numAmount)
  
  // For tooltips, show in Lakhs/Crores but also include full amount
  if (absAmount >= 10000000) {
    const crores = numAmount / 10000000
    return `₹${crores.toFixed(2)} Cr (₹${numAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`
  }
  
  if (absAmount >= 100000) {
    const lakhs = numAmount / 100000
    return `₹${lakhs.toFixed(2)} L (₹${numAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`
  }
  
  if (absAmount >= 1000) {
    const thousands = numAmount / 1000
    return `₹${thousands.toFixed(2)} K (₹${numAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })})`
  }
  
  return `₹${numAmount.toFixed(2)}`
}

/**
 * Format amount with Indian number formatting (commas)
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string with Indian number system
 */
export const formatCurrencyFull = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0.00'
  }
  return `₹${parseFloat(amount).toLocaleString('en-IN', { 
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })}`
}

