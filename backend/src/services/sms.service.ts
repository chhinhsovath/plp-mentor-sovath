import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as twilio from 'twilio';

interface SmsOptions {
  to: string;
  message: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: twilio.Twilio;
  private fromNumber: string;
  private enabled: boolean;

  constructor(private configService: ConfigService) {
    this.enabled = this.configService.get('SMS_ENABLED', 'false') === 'true';
    
    if (this.enabled) {
      const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
      this.fromNumber = this.configService.get('TWILIO_FROM_NUMBER', '+1234567890');
      
      if (accountSid && authToken) {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('SMS service initialized');
      } else {
        this.logger.warn('SMS service disabled: missing Twilio credentials');
        this.enabled = false;
      }
    } else {
      this.logger.log('SMS service disabled by configuration');
    }
  }

  async sendSms(options: SmsOptions): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`SMS not sent (service disabled): ${options.to}`);
      return;
    }

    try {
      // Format phone number for Cambodia (+855)
      let phoneNumber = options.to;
      if (!phoneNumber.startsWith('+')) {
        // Remove leading zero if present
        phoneNumber = phoneNumber.replace(/^0/, '');
        // Add Cambodia country code
        phoneNumber = `+855${phoneNumber}`;
      }

      const message = await this.twilioClient.messages.create({
        body: options.message,
        from: this.fromNumber,
        to: phoneNumber,
      });

      this.logger.log(`SMS sent to ${phoneNumber}: ${message.sid}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${options.to}`, error);
      // Don't throw error to prevent notification failure
    }
  }

  async sendBulkSms(recipients: string[], message: string): Promise<void> {
    const promises = recipients.map((to) => this.sendSms({ to, message }));
    await Promise.allSettled(promises);
  }

  isPhoneNumberValid(phoneNumber: string): boolean {
    // Cambodia phone number validation
    // Format: 0XX XXX XXX or +855 XX XXX XXX
    const cambodiaRegex = /^(?:\+855|0)?(?:1[2-9]|2[3-8]|3[2-9]|6[0-9]|7[0-9]|8[1-9]|9[0-9])\d{6,7}$/;
    return cambodiaRegex.test(phoneNumber.replace(/\s/g, ''));
  }
}