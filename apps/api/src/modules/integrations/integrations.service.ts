import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { KeitaroService, KeitaroApiConfig } from './keitaro.service';
import { Prisma, Integration, IntegrationType, IntegrationStatus, Campaign, Conversion } from '../../../generated/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreateIntegrationDto {
  type: IntegrationType;
  name: string;
  config: {
    apiUrl: string;
    apiKey: string;
    syncInterval?: number; // minutes
    autoSync?: boolean;
  };
}

export interface UpdateIntegrationDto {
  name?: string;
  config?: Record<string, unknown>;
  status?: IntegrationStatus;
}

export interface SyncResult {
  success: boolean;
  campaignsCount: number;
  conversionsCount: number;
  error?: string;
  duration: number;
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly keitaroService: KeitaroService,
  ) {}

  /**
   * List all integrations
   */
  async findAll(userId?: string): Promise<Integration[]> {
    return this.prisma.integration.findMany({
      where: userId ? { createdBy: userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get integration by ID
   */
  async findOne(id: string): Promise<Integration> {
    const integration = await this.prisma.integration.findUnique({
      where: { id },
    });

    if (!integration) {
      throw new NotFoundException(`Integration with ID "${id}" not found`);
    }

    return integration;
  }

  /**
   * Create new integration
   */
  async create(dto: CreateIntegrationDto, userId: string): Promise<Integration> {
    // Validate config based on type
    if (dto.type === 'KEITARO') {
      if (!dto.config.apiUrl || !dto.config.apiKey) {
        throw new BadRequestException('Keitaro integration requires apiUrl and apiKey');
      }

      // Test connection
      const isConnected = await this.keitaroService.testConnection({
        baseUrl: dto.config.apiUrl,
        apiKey: dto.config.apiKey,
      });

      if (!isConnected) {
        throw new BadRequestException('Failed to connect to Keitaro. Check your API URL and key.');
      }
    }

    return this.prisma.integration.create({
      data: {
        type: dto.type,
        name: dto.name,
        config: dto.config as Prisma.JsonObject,
        status: 'ACTIVE',
        createdBy: userId,
      },
    });
  }

  /**
   * Update integration
   */
  async update(id: string, dto: UpdateIntegrationDto): Promise<Integration> {
    await this.findOne(id); // Verify exists

    return this.prisma.integration.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.config && { config: dto.config as Prisma.JsonObject }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }

  /**
   * Delete integration
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify exists
    await this.prisma.integration.delete({ where: { id } });
  }

  /**
   * Test integration connection
   */
  async testConnection(id: string): Promise<boolean> {
    const integration = await this.findOne(id);
    const config = integration.config as Record<string, string>;

    if (integration.type === 'KEITARO') {
      return this.keitaroService.testConnection({
        baseUrl: config.apiUrl,
        apiKey: config.apiKey,
      });
    }

    return false;
  }

  /**
   * Sync data from integration
   */
  async sync(id: string): Promise<SyncResult> {
    const startTime = Date.now();
    const integration = await this.findOne(id);

    // Update status to syncing
    await this.prisma.integration.update({
      where: { id },
      data: { status: 'SYNCING' },
    });

    try {
      let result: SyncResult;

      if (integration.type === 'KEITARO') {
        result = await this.syncKeitaro(integration);
      } else {
        throw new BadRequestException(`Sync not supported for ${integration.type}`);
      }

      // Update last sync time and status
      await this.prisma.integration.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          lastSyncAt: new Date(),
          syncError: null,
        },
      });

      // Log sync
      await this.prisma.integrationSyncLog.create({
        data: {
          integrationId: id,
          syncType: 'full',
          status: 'success',
          recordsCount: result.campaignsCount + result.conversionsCount,
          duration: result.duration,
        },
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Update status to error
      await this.prisma.integration.update({
        where: { id },
        data: {
          status: 'ERROR',
          syncError: errorMessage,
        },
      });

      // Log sync error
      await this.prisma.integrationSyncLog.create({
        data: {
          integrationId: id,
          syncType: 'full',
          status: 'error',
          error: errorMessage,
          duration: Date.now() - startTime,
        },
      });

      return {
        success: false,
        campaignsCount: 0,
        conversionsCount: 0,
        error: errorMessage,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync Keitaro data
   */
  private async syncKeitaro(integration: Integration): Promise<SyncResult> {
    const startTime = Date.now();
    const config = integration.config as Record<string, string>;
    const keitaroConfig: KeitaroApiConfig = {
      baseUrl: config.apiUrl,
      apiKey: config.apiKey,
    };

    // Get date range for sync (last 30 days)
    const dateTo = new Date().toISOString().split('T')[0];
    const dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Sync campaigns
    const keitaroCampaigns = await this.keitaroService.getCampaigns(keitaroConfig);
    const campaignStats = await this.keitaroService.getStats(keitaroConfig, {
      dateFrom,
      dateTo,
      groupBy: ['campaign'],
    });

    // Create stats lookup
    const statsMap = new Map<number, typeof campaignStats[0]>();
    for (const stat of campaignStats) {
      if (stat.campaign_id) {
        statsMap.set(stat.campaign_id, stat);
      }
    }

    // Upsert campaigns
    for (const kCampaign of keitaroCampaigns) {
      const stats = statsMap.get(kCampaign.id);

      await this.prisma.campaign.upsert({
        where: {
          integrationId_externalId: {
            integrationId: integration.id,
            externalId: String(kCampaign.id),
          },
        },
        create: {
          integrationId: integration.id,
          externalId: String(kCampaign.id),
          name: kCampaign.name,
          status: kCampaign.state === 'active' ? 'ACTIVE' : 'PAUSED',
          clicks: stats?.clicks || 0,
          uniqueClicks: stats?.unique_clicks || 0,
          conversions: stats?.conversions || 0,
          revenue: new Decimal(stats?.revenue || '0'),
          cost: new Decimal(stats?.cost || '0'),
          profit: new Decimal(stats?.profit || '0'),
          roi: new Decimal(stats?.roi || '0'),
          cr: new Decimal(stats?.cr || '0'),
          epc: new Decimal(stats?.epc || '0'),
          cpc: new Decimal(stats?.cpc || '0'),
          lastSyncAt: new Date(),
          metadata: kCampaign.parameters as Prisma.JsonObject,
        },
        update: {
          name: kCampaign.name,
          status: kCampaign.state === 'active' ? 'ACTIVE' : 'PAUSED',
          clicks: stats?.clicks || 0,
          uniqueClicks: stats?.unique_clicks || 0,
          conversions: stats?.conversions || 0,
          revenue: new Decimal(stats?.revenue || '0'),
          cost: new Decimal(stats?.cost || '0'),
          profit: new Decimal(stats?.profit || '0'),
          roi: new Decimal(stats?.roi || '0'),
          cr: new Decimal(stats?.cr || '0'),
          epc: new Decimal(stats?.epc || '0'),
          cpc: new Decimal(stats?.cpc || '0'),
          lastSyncAt: new Date(),
          metadata: kCampaign.parameters as Prisma.JsonObject,
        },
      });
    }

    // Sync conversions (last 7 days to avoid huge data)
    const convDateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const clicks = await this.keitaroService.getClickLog(keitaroConfig, {
      dateFrom: convDateFrom,
      dateTo,
      onlyConversions: true,
      limit: 5000,
    });

    // Get campaign lookup
    const campaigns = await this.prisma.campaign.findMany({
      where: { integrationId: integration.id },
      select: { id: true, externalId: true },
    });
    const campaignLookup = new Map(campaigns.map(c => [c.externalId, c.id]));

    // Upsert conversions
    let conversionsCount = 0;
    for (const click of clicks) {
      if (!click.is_sale && !click.is_lead) continue;

      const campaignId = campaignLookup.get(String(click.campaign_id));

      await this.prisma.conversion.upsert({
        where: {
          integrationId_externalId: {
            integrationId: integration.id,
            externalId: click.sub_id,
          },
        },
        create: {
          externalId: click.sub_id,
          integrationId: integration.id,
          campaignId,
          status: click.is_rejected ? 'REJECTED' : 'APPROVED',
          type: click.is_sale ? 'FTD' : 'LEAD',
          revenue: new Decimal(click.revenue || '0'),
          payout: new Decimal(click.revenue || '0'),
          ip: click.ip,
          userAgent: click.user_agent,
          country: click.country,
          city: click.city,
          region: click.region,
          device: click.device_type,
          os: click.os,
          browser: click.browser,
          subId1: click.sub_id_1,
          subId2: click.sub_id_2,
          subId3: click.sub_id_3,
          subId4: click.sub_id_4,
          subId5: click.sub_id_5,
          referer: click.referer,
          convertedAt: new Date(click.datetime),
        },
        update: {
          status: click.is_rejected ? 'REJECTED' : 'APPROVED',
          revenue: new Decimal(click.revenue || '0'),
        },
      });
      conversionsCount++;
    }

    this.logger.log(`Keitaro sync completed`, {
      integrationId: integration.id,
      campaigns: keitaroCampaigns.length,
      conversions: conversionsCount,
    });

    return {
      success: true,
      campaignsCount: keitaroCampaigns.length,
      conversionsCount,
      duration: Date.now() - startTime,
    };
  }

  /**
   * Get integration statistics
   */
  async getStats(id: string): Promise<{
    campaigns: number;
    conversions: number;
    revenue: number;
    profit: number;
    lastSync: Date | null;
  }> {
    const integration = await this.findOne(id);

    const [campaignsCount, conversionsAgg] = await Promise.all([
      this.prisma.campaign.count({ where: { integrationId: id } }),
      this.prisma.conversion.aggregate({
        where: { integrationId: id },
        _count: true,
        _sum: {
          revenue: true,
          payout: true,
        },
      }),
    ]);

    const revenue = conversionsAgg._sum.revenue?.toNumber() || 0;
    const payout = conversionsAgg._sum.payout?.toNumber() || 0;

    return {
      campaigns: campaignsCount,
      conversions: conversionsAgg._count,
      revenue,
      profit: revenue - payout,
      lastSync: integration.lastSyncAt,
    };
  }

  /**
   * Get sync logs
   */
  async getSyncLogs(id: string, limit = 20) {
    return this.prisma.integrationSyncLog.findMany({
      where: { integrationId: id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
