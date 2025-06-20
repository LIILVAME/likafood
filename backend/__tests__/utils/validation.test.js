const {
  validatePhoneNumber,
  validateEmail,
  validatePassword,
  validateBusinessName,
  validateOTP,
  sanitizeInput,
  validatePriceRange
} = require('../../utils/validation');

describe('Validation Utils', () => {
  describe('validatePhoneNumber', () => {
    it('should validate correct French phone numbers', () => {
      const validNumbers = [
        '+33123456789',
        '+33 1 23 45 67 89',
        '0123456789',
        '01 23 45 67 89',
        '+33612345678' // Mobile
      ];

      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '123456789', // Too short
        '+331234567890', // Too long
        'abc123456789', // Contains letters
        '+44123456789', // Wrong country code
        '', // Empty
        null,
        undefined
      ];

      invalidNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(false);
      });
    });

    it('should normalize phone numbers', () => {
      expect(validatePhoneNumber('+33 1 23 45 67 89', true)).toBe('+33123456789');
      expect(validatePhoneNumber('01 23 45 67 89', true)).toBe('+33123456789');
      expect(validatePhoneNumber('0123456789', true)).toBe('+33123456789');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@company.fr'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        '',
        null,
        undefined
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'StrongPass123!',
        'MySecure@Pass2023',
        'Complex#Password1'
      ];

      validPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak', // Too short
        'password', // No uppercase, numbers, special chars
         'PASSWORD', // No lowercase, numbers, special chars
        '12345678', // No letters, special chars
        'Password1', // No special chars
        'Password!', // No numbers
        'password123!' // No uppercase
      ];

      weakPasswords.forEach(password => {
        const result = validatePassword(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide specific error messages', () => {
      const result = validatePassword('weak');
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('validateBusinessName', () => {
    it('should validate correct business names', () => {
      const validNames = [
        'Restaurant Le Petit Bistro',
        'Café de la Paix',
        'Boulangerie Marie & Co',
        'Pizza Express 2023'
      ];

      validNames.forEach(name => {
        expect(validateBusinessName(name)).toBe(true);
      });
    });

    it('should reject invalid business names', () => {
      const invalidNames = [
        '', // Empty
        'A', // Too short
        'A'.repeat(101), // Too long
        '123', // Only numbers
        '!!!', // Only special chars
        null,
        undefined
      ];

      invalidNames.forEach(name => {
        expect(validateBusinessName(name)).toBe(false);
      });
    });
  });

  describe('validateOTP', () => {
    it('should validate correct OTP codes', () => {
      const validOTPs = [
        '123456',
        '000000',
        '999999'
      ];

      validOTPs.forEach(otp => {
        expect(validateOTP(otp)).toBe(true);
      });
    });

    it('should reject invalid OTP codes', () => {
      const invalidOTPs = [
        '12345', // Too short
        '1234567', // Too long
         'abcdef', // Contains letters
        '12345a', // Mixed
        '',
        null,
        undefined
      ];

      invalidOTPs.forEach(otp => {
        expect(validateOTP(otp)).toBe(false);
      });
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        'SELECT * FROM users;',
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>'
      ];

      dangerousInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toContain('data:');
      });
    });

    it('should preserve safe content', () => {
      const safeInputs = [
        'Restaurant Le Petit Bistro',
        'Plat du jour: Coq au vin',
        'Prix: 15,50€',
        'Adresse: 123 rue de la Paix, 75001 Paris'
      ];

      safeInputs.forEach(input => {
        const sanitized = sanitizeInput(input);
        expect(sanitized).toBe(input);
      });
    });

    it('should handle null and undefined inputs', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
      expect(sanitizeInput('')).toBe('');
    });
  });

  describe('validatePriceRange', () => {
    it('should validate reasonable prices', () => {
      const validPrices = [
        0.50,
        15.99,
        25.00,
        99.99
      ];

      validPrices.forEach(price => {
        expect(validatePriceRange(price)).toBe(true);
      });
    });

    it('should reject invalid prices', () => {
      const invalidPrices = [
        -1, // Negative
        0, // Zero
        1000, // Too high
        'abc', // Not a number
        null,
        undefined
      ];

      invalidPrices.forEach(price => {
        expect(validatePriceRange(price)).toBe(false);
      });
    });

    it('should validate with custom range', () => {
      expect(validatePriceRange(5, 1, 10)).toBe(true);
      expect(validatePriceRange(15, 1, 10)).toBe(false);
      expect(validatePriceRange(0.5, 1, 10)).toBe(false);
    });
  });
});