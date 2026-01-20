import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = this.config.get<number>('SMTP_PORT', 587);
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');

    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      this.logger.log('Mail transporter configured');
    } else {
      this.logger.warn('SMTP not configured. Emails will be logged to console.');
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const subject = 'Your Janus CRM verification code';
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #818cf8; font-size: 28px; margin: 0;">Janus CRM</h1>
          <p style="color: #666; margin-top: 8px;">See everything. Miss nothing.</p>
        </div>

        <div style="background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%); border-radius: 16px; padding: 40px; text-align: center;">
          <p style="color: #999; margin: 0 0 24px;">Your verification code is:</p>
          <div style="background: #2a2a4a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #fff;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px; margin: 0;">
            This code will expire in 10 minutes.
          </p>
        </div>

        <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
          <p>If you didn't request this code, you can safely ignore this email.</p>
          <p style="margin-top: 16px;">&copy; 2026 Janus CRM</p>
        </div>
      </div>
    `;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.config.get<string>('SMTP_FROM', 'noreply@janus.crm'),
          to: email,
          subject,
          html,
        });
        this.logger.log('Verification email sent', { email });
      } catch (error) {
        this.logger.error('Failed to send verification email', {
          email,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    } else {
      // Development mode - log to console
      this.logger.log('='.repeat(50));
      this.logger.log(`VERIFICATION CODE for ${email}: ${code}`);
      this.logger.log('='.repeat(50));
    }
  }
}
