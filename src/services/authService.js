import { apiService } from './apiService';

class AuthService {
  constructor() {
    this.storageKey = 'likafood_user';
  }

  async loginOrRegister(phoneNumber, businessName = null, ownerName = null) {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      const requestData = {
        phoneNumber: this.formatPhoneNumber(phoneNumber)
      };

      // Add business details if provided (for new registration)
      if (businessName && ownerName) {
        if (!businessName.trim()) {
          throw new Error('Business name is required');
        }
        if (!ownerName.trim()) {
          throw new Error('Owner name is required');
        }
        requestData.businessName = businessName.trim();
        requestData.ownerName = ownerName.trim();
      }

      const response = await apiService.post('/auth/login-or-register', requestData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Authentication failed');
    }
  }

  async requestOTP(phoneNumber, businessName, ownerName) {
    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      if (!businessName?.trim()) {
        throw new Error('Business name is required');
      }

      if (!ownerName?.trim()) {
        throw new Error('Owner name is required');
      }

      const response = await apiService.post('/auth/register', {
        phoneNumber: this.formatPhoneNumber(phoneNumber),
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        type: 'restaurant'
      });

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send OTP');
    }
  }

  async register(phoneNumber, businessName, ownerName) {
    // This method now calls requestOTP for consistency
    return this.requestOTP(phoneNumber, businessName, ownerName);
  }

  async login(phoneNumber, otp) {
    try {
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      if (!this.isValidOTP(otp)) {
        throw new Error('Invalid OTP format');
      }

      const response = await apiService.post('/auth/verify-otp', {
        phoneNumber: this.formatPhoneNumber(phoneNumber),
        code: otp.trim(),
        type: 'login'
      });

      const userData = response.data;
      this.setCurrentUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async verifyOTP(phoneNumber, otp, type = 'registration') {
    try {
      if (!this.isValidPhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format');
      }

      if (!this.isValidOTP(otp)) {
        throw new Error('Invalid OTP format');
      }

      const response = await apiService.post('/auth/verify-otp', {
        phoneNumber: this.formatPhoneNumber(phoneNumber),
        code: otp.trim(),
        type: type
      });

      const userData = response.data;
      this.setCurrentUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'OTP verification failed');
    }
  }

  logout() {
    localStorage.removeItem(this.storageKey);
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem(this.storageKey);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.logout();
      return null;
    }
  }

  setCurrentUser(userData) {
    localStorage.setItem(this.storageKey, JSON.stringify(userData));
  }

  isValidPhoneNumber(phoneNumber) {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s+/g, ''));
  }

  isValidOTP(otp) {
    // OTP should be 4-6 digits
    const otpRegex = /^\d{4,6}$/;
    return otpRegex.test(otp.trim());
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all spaces and ensure it starts with +
    let formatted = phoneNumber.replace(/\s+/g, '');
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    return formatted;
  }
}

export const authService = new AuthService();