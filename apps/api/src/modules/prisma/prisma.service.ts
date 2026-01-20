import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _isConnected = false;
  private _connectionAttempted = false;

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
    this.logger.log('PrismaService created (lazy connection mode)');
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Lazy connect - only connects when actually needed
   */
  async ensureConnection(): Promise<boolean> {
    if (this._isConnected) return true;
    if (this._connectionAttempted) return false;

    this._connectionAttempted = true;

    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL not set - database operations will fail');
      return false;
    }

    try {
      this.logger.log('Connecting to database...');
      await this.$connect();
      this._isConnected = true;
      this.logger.log('Database connected successfully');
      return true;
    } catch (error) {
      this.logger.error('Database connection failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }

  async onModuleDestroy() {
    if (this._isConnected) {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    }
  }
}
