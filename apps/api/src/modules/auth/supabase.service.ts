import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly client: SupabaseClient;

  constructor(private readonly config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const supabaseKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured');
      // Create a dummy client for development without Supabase
      this.client = null as unknown as SupabaseClient;
      return;
    }

    this.client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Verify JWT token and get user
   */
  async verifyToken(token: string): Promise<SupabaseUser | null> {
    if (!this.client) {
      this.logger.warn('Supabase not configured, skipping token verification');
      return null;
    }

    try {
      const { data, error } = await this.client.auth.getUser(token);

      if (error) {
        this.logger.error('Token verification failed', { error: error.message });
        return null;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Token verification error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<SupabaseUser | null> {
    if (!this.client) {
      return null;
    }

    try {
      const { data, error } = await this.client.auth.admin.getUserById(userId);

      if (error) {
        this.logger.error('Get user failed', { error: error.message, userId });
        return null;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Get user error', {
        error: error instanceof Error ? error.message : String(error),
        userId,
      });
      return null;
    }
  }

  /**
   * Get Supabase client for direct operations
   */
  getClient(): SupabaseClient | null {
    return this.client;
  }
}
