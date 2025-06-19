const twilio = require('twilio');

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'mock'; // 'twilio', 'aws-sns', 'mock'
    this.isDevelopment = process.env.NODE_ENV === 'development';
    
    // Initialize Twilio client if configured
    if (this.provider === 'twilio' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      this.twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
    }
  }

  /**
   * Send OTP via SMS
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} code - OTP code
   * @param {String} type - OTP type (registration, login, etc.)
   * @returns {Promise<Object>} Send result
   */
  async sendOTP(phoneNumber, code, type = 'verification') {
    const message = this.formatOTPMessage(code, type);
    
    try {
      switch (this.provider) {
        case 'twilio':
          return await this.sendViaTwilio(phoneNumber, message);
        case 'aws-sns':
          return await this.sendViaAWSSNS(phoneNumber, message);
        case 'mock':
        default:
          return await this.sendViaMock(phoneNumber, message, code);
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error('Failed to send SMS');
    }
  }

  /**
   * Format OTP message
   * @param {String} code - OTP code
   * @param {String} type - Message type
   * @returns {String} Formatted message
   */
  formatOTPMessage(code, type) {
    const messages = {
      registration: `Bienvenue sur LikaFood! Votre code de vérification est: ${code}. Ce code expire dans 10 minutes.`,
      login: `Votre code de connexion LikaFood: ${code}. Ce code expire dans 10 minutes.`,
      password_reset: `Code de réinitialisation LikaFood: ${code}. Ce code expire dans 10 minutes.`,
      verification: `Votre code de vérification LikaFood: ${code}. Ce code expire dans 10 minutes.`
    };
    
    return messages[type] || messages.verification;
  }

  /**
   * Send SMS via Twilio
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - Message content
   * @returns {Promise<Object>} Twilio response
   */
  async sendViaTwilio(phoneNumber, message) {
    if (!this.twilioClient) {
      throw new Error('Twilio client not configured');
    }

    const result = await this.twilioClient.messages.create({
      body: message,
      from: this.twilioFromNumber,
      to: phoneNumber
    });

    return {
      success: true,
      provider: 'twilio',
      messageId: result.sid,
      status: result.status,
      to: phoneNumber
    };
  }

  /**
   * Send SMS via AWS SNS
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - Message content
   * @returns {Promise<Object>} AWS SNS response
   */
  async sendViaAWSSNS(phoneNumber, message) {
    // AWS SNS implementation would go here
    // For now, return mock response
    console.log('AWS SNS not implemented yet, using mock');
    return this.sendViaMock(phoneNumber, message);
  }

  /**
   * Mock SMS sending for development
   * @param {String} phoneNumber - Recipient phone number
   * @param {String} message - Message content
   * @param {String} code - OTP code for logging
   * @returns {Promise<Object>} Mock response
   */
  async sendViaMock(phoneNumber, message, code) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Log the OTP for development
    console.log('\n📱 MOCK SMS SERVICE');
    console.log('═══════════════════');
    console.log(`📞 To: ${phoneNumber}`);
    console.log(`💬 Message: ${message}`);
    if (code) {
      console.log(`🔑 OTP Code: ${code}`);
    }
    console.log('═══════════════════\n');
    
    // Simulate occasional failures in development
    if (this.isDevelopment && Math.random() < 0.05) { // 5% failure rate
      throw new Error('Mock SMS service simulated failure');
    }
    
    return {
      success: true,
      provider: 'mock',
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'delivered',
      to: phoneNumber,
      isDevelopment: true
    };
  }

  /**
   * Validate phone number format
   * @param {String} phoneNumber - Phone number to validate
   * @returns {Boolean} True if valid
   */
  validatePhoneNumber(phoneNumber) {
    // Basic international phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * Format phone number to international format
   * @param {String} phoneNumber - Phone number to format
   * @param {String} defaultCountryCode - Default country code (e.g., '+225' for CI)
   * @returns {String} Formatted phone number
   */
  formatPhoneNumber(phoneNumber, defaultCountryCode = '+225') {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it doesn't start with country code, add default
    if (!phoneNumber.startsWith('+')) {
      // Remove leading zero if present (common in local formats)
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      return `${defaultCountryCode}${cleaned}`;
    }
    
    return phoneNumber;
  }

  /**
   * Get SMS delivery status (for providers that support it)
   * @param {String} messageId - Message ID from send response
   * @returns {Promise<Object>} Delivery status
   */
  async getDeliveryStatus(messageId) {
    if (this.provider === 'twilio' && this.twilioClient) {
      try {
        const message = await this.twilioClient.messages(messageId).fetch();
        return {
          messageId,
          status: message.status,
          errorCode: message.errorCode,
          errorMessage: message.errorMessage
        };
      } catch (error) {
        return {
          messageId,
          status: 'unknown',
          error: error.message
        };
      }
    }
    
    // Mock status for development
    return {
      messageId,
      status: 'delivered',
      provider: this.provider
    };
  }
}

// Create singleton instance
const smsService = new SMSService();

module.exports = smsService;