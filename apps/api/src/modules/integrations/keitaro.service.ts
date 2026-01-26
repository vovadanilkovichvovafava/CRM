import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Keitaro API Response Types
 */
export interface KeitaroCampaign {
  id: number;
  alias: string;
  name: string;
  group_id: number;
  type: string;
  cookies_ttl: number;
  state: string;
  cost_type: string;
  cost_value: string;
  cost_currency: string;
  cost_auto: boolean;
  token: string;
  position: number;
  parameters: Record<string, unknown>;
}

export interface KeitaroOffer {
  id: number;
  name: string;
  group_id: number;
  action_type: string;
  action_payload: string;
  action_options: Record<string, unknown>;
  payout_value: string;
  payout_currency: string;
  payout_type: string;
  payout_auto: boolean;
  state: string;
  affiliate_network_id: number;
  payout_upsell: string;
  archive: boolean;
  local_path: string;
  preview_path: string;
}

export interface KeitaroLanding {
  id: number;
  name: string;
  group_id: number;
  action_type: string;
  action_payload: string;
  action_options: Record<string, unknown>;
  state: string;
  offer_id: number;
  archive: boolean;
  local_path: string;
}

export interface KeitaroClickLog {
  sub_id: string;
  campaign_id: number;
  datetime: string;
  ip: string;
  country: string;
  region: string;
  city: string;
  operator: string;
  isp: string;
  connection_type: string;
  device_type: string;
  device_model: string;
  os: string;
  os_version: string;
  browser: string;
  browser_version: string;
  language: string;
  user_agent: string;
  referer: string;
  landing_id: number;
  offer_id: number;
  sub_id_1: string;
  sub_id_2: string;
  sub_id_3: string;
  sub_id_4: string;
  sub_id_5: string;
  revenue: string;
  cost: string;
  profit: string;
  is_sale: boolean;
  is_lead: boolean;
  is_rejected: boolean;
}

export interface KeitaroStats {
  campaign_id?: number;
  campaign_name?: string;
  offer_id?: number;
  offer_name?: string;
  landing_id?: number;
  landing_name?: string;
  date?: string;
  clicks: number;
  unique_clicks: number;
  conversions: number;
  sales: number;
  rejected: number;
  revenue: string;
  cost: string;
  profit: string;
  roi: string;
  cr: string;
  epc: string;
  cpc: string;
}

export interface KeitaroApiConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Keitaro API Service
 * Handles all communication with Keitaro Tracker API
 */
@Injectable()
export class KeitaroService {
  private readonly logger = new Logger(KeitaroService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Make authenticated request to Keitaro API
   */
  private async request<T>(
    config: KeitaroApiConfig,
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${config.baseUrl}/admin_api/v1${endpoint}`;

    const headers: HeadersInit = {
      'Api-Key': config.apiKey,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Keitaro API error: ${response.status} - ${errorText}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      this.logger.error(`Keitaro API request failed: ${endpoint}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Test connection to Keitaro instance
   */
  async testConnection(config: KeitaroApiConfig): Promise<boolean> {
    try {
      await this.request<KeitaroCampaign[]>(config, '/campaigns');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all campaigns
   */
  async getCampaigns(config: KeitaroApiConfig): Promise<KeitaroCampaign[]> {
    return this.request<KeitaroCampaign[]>(config, '/campaigns');
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(config: KeitaroApiConfig, id: number): Promise<KeitaroCampaign> {
    return this.request<KeitaroCampaign>(config, `/campaigns/${id}`);
  }

  /**
   * Get all offers
   */
  async getOffers(config: KeitaroApiConfig): Promise<KeitaroOffer[]> {
    return this.request<KeitaroOffer[]>(config, '/offers');
  }

  /**
   * Get all landings
   */
  async getLandings(config: KeitaroApiConfig): Promise<KeitaroLanding[]> {
    return this.request<KeitaroLanding[]>(config, '/landing_pages');
  }

  /**
   * Get statistics with grouping and filtering
   */
  async getStats(
    config: KeitaroApiConfig,
    options: {
      dateFrom: string;  // YYYY-MM-DD
      dateTo: string;    // YYYY-MM-DD
      groupBy?: string[];   // campaign, offer, landing, day, country, etc.
      campaignId?: number;
      offerId?: number;
      timezone?: string;
    },
  ): Promise<KeitaroStats[]> {
    const body: Record<string, unknown> = {
      range: {
        from: options.dateFrom,
        to: options.dateTo,
        timezone: options.timezone || 'UTC',
      },
      columns: [],
      metrics: [
        'clicks',
        'unique_clicks',
        'conversions',
        'sales',
        'rejected',
        'revenue',
        'cost',
        'profit',
        'roi',
        'cr',
        'epc',
        'cpc',
      ],
      grouping: options.groupBy || ['campaign'],
      filters: [],
      sort: [{ name: 'clicks', order: 'desc' }],
      summary: true,
    };

    if (options.campaignId) {
      (body.filters as Array<Record<string, unknown>>).push({
        name: 'campaign_id',
        operator: 'EQUALS',
        expression: options.campaignId,
      });
    }

    if (options.offerId) {
      (body.filters as Array<Record<string, unknown>>).push({
        name: 'offer_id',
        operator: 'EQUALS',
        expression: options.offerId,
      });
    }

    const response = await this.request<{ rows: KeitaroStats[] }>(
      config,
      '/report/build',
      'POST',
      body,
    );

    return response.rows || [];
  }

  /**
   * Get click log (conversions)
   */
  async getClickLog(
    config: KeitaroApiConfig,
    options: {
      dateFrom: string;
      dateTo: string;
      campaignId?: number;
      limit?: number;
      offset?: number;
      onlyConversions?: boolean;
    },
  ): Promise<KeitaroClickLog[]> {
    const body: Record<string, unknown> = {
      range: {
        from: options.dateFrom,
        to: options.dateTo,
        timezone: 'UTC',
      },
      columns: [
        'sub_id',
        'campaign_id',
        'datetime',
        'ip',
        'country',
        'region',
        'city',
        'device_type',
        'os',
        'browser',
        'user_agent',
        'referer',
        'landing_id',
        'offer_id',
        'sub_id_1',
        'sub_id_2',
        'sub_id_3',
        'sub_id_4',
        'sub_id_5',
        'revenue',
        'cost',
        'profit',
        'is_sale',
        'is_lead',
        'is_rejected',
      ],
      filters: [],
      limit: options.limit || 1000,
      offset: options.offset || 0,
    };

    if (options.campaignId) {
      (body.filters as Array<Record<string, unknown>>).push({
        name: 'campaign_id',
        operator: 'EQUALS',
        expression: options.campaignId,
      });
    }

    if (options.onlyConversions) {
      (body.filters as Array<Record<string, unknown>>).push({
        name: 'is_sale',
        operator: 'EQUALS',
        expression: true,
      });
    }

    const response = await this.request<{ rows: KeitaroClickLog[] }>(
      config,
      '/clicks/log',
      'POST',
      body,
    );

    return response.rows || [];
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(config: KeitaroApiConfig, id: number): Promise<void> {
    await this.request(config, `/campaigns/${id}`, 'PUT', { state: 'disabled' });
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(config: KeitaroApiConfig, id: number): Promise<void> {
    await this.request(config, `/campaigns/${id}`, 'PUT', { state: 'active' });
  }

  /**
   * Get today's statistics summary
   */
  async getTodayStats(config: KeitaroApiConfig): Promise<{
    clicks: number;
    conversions: number;
    revenue: number;
    cost: number;
    profit: number;
    roi: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const stats = await this.getStats(config, {
      dateFrom: today,
      dateTo: today,
      groupBy: [],
    });

    if (stats.length === 0) {
      return { clicks: 0, conversions: 0, revenue: 0, cost: 0, profit: 0, roi: 0 };
    }

    const summary = stats[0];
    return {
      clicks: summary.clicks || 0,
      conversions: summary.conversions || 0,
      revenue: parseFloat(summary.revenue) || 0,
      cost: parseFloat(summary.cost) || 0,
      profit: parseFloat(summary.profit) || 0,
      roi: parseFloat(summary.roi) || 0,
    };
  }
}
