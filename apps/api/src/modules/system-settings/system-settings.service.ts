import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// Settings that are allowed to be read/written
const ALLOWED_SETTINGS = [
  'resend_api_key',
  'email_from',
  'telegram_bot_token',
  'telegram_chat_id',
  'webhook_secret',
] as const;

// Settings that should be encrypted
const ENCRYPTED_SETTINGS = ['resend_api_key', 'telegram_bot_token', 'webhook_secret'];

// Settings that should be masked when returned
const MASKED_SETTINGS = ['resend_api_key', 'telegram_bot_token', 'webhook_secret'];

type SettingKey = (typeof ALLOWED_SETTINGS)[number];

export interface SystemSettingsDto {
  resend_api_key?: string;
  email_from?: string;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  webhook_secret?: string;
}

@Injectable()
export class SystemSettingsService {
  private readonly logger = new Logger(SystemSettingsService.name);
  private readonly encryptionKey: Buffer;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    // Use JWT secret as encryption key (or generate one)
    const secret = this.config.get<string>('JWT_SECRET') || 'default-encryption-key-change-me';
    this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    try {
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return '';
    }
  }

  private maskValue(value: string): string {
    if (!value || value.length < 8) return '••••••••';
    return value.slice(0, 4) + '••••••••' + value.slice(-4);
  }

  async getAll(userRole: string): Promise<SystemSettingsDto> {
    // Only admins can view settings
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can view system settings');
    }

    const settings = await this.prisma.systemSetting.findMany({
      where: { key: { in: ALLOWED_SETTINGS as unknown as string[] } },
    });

    const result: SystemSettingsDto = {};

    for (const setting of settings) {
      const key = setting.key as SettingKey;
      let value = setting.value;

      // Decrypt if needed
      if (setting.encrypted) {
        value = this.decrypt(value);
      }

      // Mask sensitive values
      if (MASKED_SETTINGS.includes(key)) {
        value = this.maskValue(value);
      }

      result[key] = value;
    }

    // Also include env variables as fallback (masked)
    if (!result.resend_api_key) {
      const envValue = this.config.get<string>('RESEND_API_KEY');
      if (envValue && envValue !== 'xxx' && envValue !== 're_xxx') {
        result.resend_api_key = this.maskValue(envValue) + ' (env)';
      }
    }

    if (!result.email_from) {
      const envValue = this.config.get<string>('EMAIL_FROM');
      if (envValue) {
        result.email_from = envValue + ' (env)';
      }
    }

    return result;
  }

  async update(
    data: Partial<SystemSettingsDto>,
    userId: string,
    userRole: string,
  ): Promise<{ updated: string[] }> {
    // Only admins can update settings
    if (userRole !== 'ADMIN') {
      throw new ForbiddenException('Only administrators can update system settings');
    }

    const updated: string[] = [];

    for (const [key, value] of Object.entries(data)) {
      if (!ALLOWED_SETTINGS.includes(key as SettingKey)) {
        continue;
      }

      // Skip empty values (don't overwrite with empty)
      if (!value || value.trim() === '') {
        continue;
      }

      // Skip masked values (they haven't changed)
      if (value.includes('••••')) {
        continue;
      }

      const shouldEncrypt = ENCRYPTED_SETTINGS.includes(key);
      const storedValue = shouldEncrypt ? this.encrypt(value) : value;

      await this.prisma.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: storedValue,
          encrypted: shouldEncrypt,
          updatedBy: userId,
        },
        update: {
          value: storedValue,
          encrypted: shouldEncrypt,
          updatedBy: userId,
        },
      });

      updated.push(key);
      this.logger.log(`Setting "${key}" updated by user ${userId}`);
    }

    return { updated };
  }

  // Get raw value for internal use (email service, etc.)
  async getValue(key: SettingKey): Promise<string | null> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      // Fall back to environment variable
      const envKey = key.toUpperCase();
      return this.config.get<string>(envKey) || null;
    }

    if (setting.encrypted) {
      return this.decrypt(setting.value);
    }

    return setting.value;
  }

  // Check if email is configured
  async isEmailConfigured(): Promise<boolean> {
    const apiKey = await this.getValue('resend_api_key');
    return !!apiKey && apiKey !== 'xxx' && apiKey !== 're_xxx';
  }

  // Check if Telegram is configured
  async isTelegramConfigured(): Promise<boolean> {
    const token = await this.getValue('telegram_bot_token');
    const chatId = await this.getValue('telegram_chat_id');
    return !!token && !!chatId;
  }
}
