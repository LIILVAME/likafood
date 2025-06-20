const validator = require('validator');
const DOMPurify = require('isomorphic-dompurify');

/**
 * Validate French phone number
 * @param {string} phoneNumber - Phone number to validate
 * @param {boolean} normalize - Whether to return normalized format
 * @returns {boolean|string} - Validation result or normalized number
 */
function validatePhoneNumber(phoneNumber, normalize = false) {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  // Remove all spaces and special characters except + and digits
  const cleaned = phoneNumber.replace(/[^+\d]/g, '');
  
  // French phone number patterns
  const patterns = [
    /^\+33[1-9]\d{8}$/, // +33xxxxxxxxx
    /^0[1-9]\d{8}$/ // 0xxxxxxxxx
  ];

  const isValid = patterns.some(pattern => pattern.test(cleaned));
  
  if (!isValid) {
    return false;
  }

  if (normalize) {
    // Convert to international format
    if (cleaned.startsWith('0')) {
      return '+33' + cleaned.substring(1);
    }
    return cleaned;
  }

  return true;
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Validation result
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  return validator.isEmail(email) && email.length <= 254;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with errors
 */
function validatePassword(password) {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate business name
 * @param {string} businessName - Business name to validate
 * @returns {boolean} - Validation result
 */
function validateBusinessName(businessName) {
  if (!businessName || typeof businessName !== 'string') {
    return false;
  }

  const trimmed = businessName.trim();
  
  // Must be between 2 and 100 characters
  if (trimmed.length < 2 || trimmed.length > 100) {
    return false;
  }

  // Must contain at least one letter
  if (!/[a-zA-ZÀ-ÿ]/.test(trimmed)) {
    return false;
  }

  // Cannot be only numbers or special characters
  if (/^[\d\s\W]+$/.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Validate OTP code
 * @param {string} otp - OTP code to validate
 * @returns {boolean} - Validation result
 */
function validateOTP(otp) {
  if (!otp || typeof otp !== 'string') {
    return false;
  }

  // Must be exactly 6 digits
  return /^\d{6}$/.test(otp);
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 * @param {string} input - Input to sanitize
 * @returns {string} - Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove dangerous protocols
  let sanitized = input.replace(/javascript:/gi, '')
                      .replace(/data:/gi, '')
                      .replace(/vbscript:/gi, '');

  // Use DOMPurify to clean HTML
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });

  return sanitized.trim();
}

/**
 * Validate price range
 * @param {number} price - Price to validate
 * @param {number} min - Minimum price (default: 0.01)
 * @param {number} max - Maximum price (default: 999.99)
 * @returns {boolean} - Validation result
 */
function validatePriceRange(price, min = 0.01, max = 999.99) {
  if (typeof price !== 'number' || isNaN(price)) {
    return false;
  }

  return price >= min && price <= max;
}

/**
 * Validate dish category
 * @param {string} category - Category to validate
 * @returns {boolean} - Validation result
 */
function validateDishCategory(category) {
  const validCategories = [
    'Entrées',
    'Plats principaux',
    'Desserts',
    'Boissons',
    'Accompagnements',
    'Spécialités',
    'Menu enfant'
  ];

  return validCategories.includes(category);
}

/**
 * Validate coordinates (latitude, longitude)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - Validation result
 */
function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return false;
  }

  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Validate French postal code
 * @param {string} postalCode - Postal code to validate
 * @returns {boolean} - Validation result
 */
function validatePostalCode(postalCode) {
  if (!postalCode || typeof postalCode !== 'string') {
    return false;
  }

  // French postal code: 5 digits
  return /^\d{5}$/.test(postalCode);
}

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} - Validation result
 */
function validateURL(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    new URL(url);
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true
    });
  } catch {
    return false;
  }
}

module.exports = {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateBusinessName,
  validateOTP,
  sanitizeInput,
  validatePriceRange,
  validateDishCategory,
  validateCoordinates,
  validatePostalCode,
  validateURL
};