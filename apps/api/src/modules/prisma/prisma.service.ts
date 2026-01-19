import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _isConnected = false;

  constructor() {
    super({
      log: [
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      this.logger.warn('DATABASE_URL not set - running in demo mode without database');
      return;
    }

    try {
      await this.$connect();
      this._isConnected = true;
      this.logger.log('Database connection established');
    } catch (error) {
      this.logger.warn('Failed to connect to database - running in demo mode');
      this.logger.warn(error instanceof Error ? error.message : String(error));
    }
  }

  async onModuleDestroy() {
    if (this._isConnected) {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    }
  }
}
