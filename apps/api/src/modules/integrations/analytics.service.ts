import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsSummary {
  revenue: number;
  cost: number;
  profit: number;
  roi: number;
  clicks: number;
  conversions: number;
  cr: number;
  epc: number;
  cpa: number;
  approvedConversions: number;
  rejectedConversions: number;
  holdConversions: number;
  approveRate: number;
}

export interface TrendData {
  date: string;
  revenue: number;
  cost: number;
  profit: number;
  clicks: number;
  conversions: number;
}

export interface TopItem {
  id: string;
  name: string;
  revenue: number;
  profit: number;
  roi: number;
  conversions: number;
}

export interface GeoStats {
  country: string;
  conversions: number;
  revenue: number;
  percentage: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get overall summary statistics
   */
  async getSummary(dateRange?: DateRange): Promise<AnalyticsSummary> {
    const where: Prisma.ConversionWhereInput = {};
    if (dateRange) {
      where.convertedAt = {
        gte: dateRange.from,
        lte: dateRange.to,
      };
    }

    // Get conversion stats
    const [conversions, campaigns] = await Promise.all([
      this.prisma.conversion.groupBy({
        by: ['status'],
        where,
        _count: true,
        _sum: {
          revenue: true,
          payout: true,
        },
      }),
      this.prisma.campaign.aggregate({
        _sum: {
          clicks: true,
          cost: true,
        },
      }),
    ]);

    // Calculate totals
    let totalRevenue = 0;
    let totalConversions = 0;
    let approvedConversions = 0;
    let rejectedConversions = 0;
    let holdConversions = 0;

    for (const conv of conversions) {
      totalRevenue += conv._sum.revenue?.toNumber() || 0;
      totalConversions += conv._count;

      switch (conv.status) {
        case 'APPROVED':
          approvedConversions = conv._count;
          break;
        case 'REJECTED':
          rejectedConversions = conv._count;
          break;
        case 'HOLD':
          holdConversions = conv._count;
          break;
      }
    }

    const totalClicks = campaigns._sum.clicks || 0;
    const totalCost = campaigns._sum.cost?.toNumber() || 0;
    const profit = totalRevenue - totalCost;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    const cr = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const epc = totalClicks > 0 ? totalRevenue / totalClicks : 0;
    const cpa = totalConversions > 0 ? totalCost / totalConversions : 0;
    const approveRate = totalConversions > 0
      ? (approvedConversions / totalConversions) * 100
      : 0;

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit,
      roi,
      clicks: totalClicks,
      conversions: totalConversions,
      cr,
      epc,
      cpa,
      approvedConversions,
      rejectedConversions,
      holdConversions,
      approveRate,
    };
  }

  /**
   * Get daily trend data
   */
  async getTrend(days: number = 30): Promise<TrendData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get daily stats from campaigns
    const dailyStats = await this.prisma.campaignDailyStat.groupBy({
      by: ['date'],
      where: {
        date: { gte: startDate },
      },
      _sum: {
        clicks: true,
        conversions: true,
        revenue: true,
        cost: true,
        profit: true,
      },
      orderBy: { date: 'asc' },
    });

    return dailyStats.map(stat => ({
      date: stat.date.toISOString().split('T')[0],
      revenue: stat._sum.revenue?.toNumber() || 0,
      cost: stat._sum.cost?.toNumber() || 0,
      profit: stat._sum.profit?.toNumber() || 0,
      clicks: stat._sum.clicks || 0,
      conversions: stat._sum.conversions || 0,
    }));
  }

  /**
   * Get top campaigns by profit
   */
  async getTopCampaigns(limit: number = 10): Promise<TopItem[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { profit: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        revenue: true,
        cost: true,
        profit: true,
        roi: true,
        conversions: true,
      },
    });

    return campaigns.map(c => ({
      id: c.id,
      name: c.name,
      revenue: c.revenue.toNumber(),
      profit: c.profit.toNumber(),
      roi: c.roi.toNumber(),
      conversions: c.conversions,
    }));
  }

  /**
   * Get top offers by profit
   */
  async getTopOffers(limit: number = 10): Promise<TopItem[]> {
    const offers = await this.prisma.offer.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { approvedLeads: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        approvedLeads: true,
        avgPayout: true,
        approveRate: true,
        epc: true,
      },
    });

    return offers.map(o => ({
      id: o.id,
      name: o.name,
      revenue: o.avgPayout.toNumber() * o.approvedLeads,
      profit: o.avgPayout.toNumber() * o.approvedLeads, // Simplified
      roi: 0, // Would need cost data
      conversions: o.approvedLeads,
    }));
  }

  /**
   * Get top traffic sources by ROI
   */
  async getTopSources(limit: number = 10): Promise<TopItem[]> {
    const sources = await this.prisma.trafficSource.findMany({
      where: { isActive: true },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        totalSpent: true,
        totalLeads: true,
        avgCpl: true,
      },
    });

    return sources.map(s => ({
      id: s.id,
      name: s.name,
      revenue: 0, // Would need to calculate from conversions
      profit: 0,
      roi: 0,
      conversions: s.totalLeads,
    }));
  }

  /**
   * Get conversion distribution by country
   */
  async getGeoDistribution(limit: number = 10): Promise<GeoStats[]> {
    const geoStats = await this.prisma.conversion.groupBy({
      by: ['country'],
      where: {
        country: { not: null },
      },
      _count: true,
      _sum: {
        revenue: true,
      },
      orderBy: {
        _count: { country: 'desc' },
      },
      take: limit,
    });

    const totalConversions = geoStats.reduce((sum, g) => sum + g._count, 0);

    return geoStats.map(g => ({
      country: g.country || 'Unknown',
      conversions: g._count,
      revenue: g._sum.revenue?.toNumber() || 0,
      percentage: totalConversions > 0 ? (g._count / totalConversions) * 100 : 0,
    }));
  }

  /**
   * Get conversion status distribution
   */
  async getStatusDistribution(): Promise<{ status: string; count: number; percentage: number }[]> {
    const stats = await this.prisma.conversion.groupBy({
      by: ['status'],
      _count: true,
    });

    const total = stats.reduce((sum, s) => sum + s._count, 0);

    return stats.map(s => ({
      status: s.status,
      count: s._count,
      percentage: total > 0 ? (s._count / total) * 100 : 0,
    }));
  }

  /**
   * Get webmaster performance
   */
  async getWebmasterStats(limit: number = 20): Promise<{
    webmasterId: string;
    conversions: number;
    revenue: number;
    approveRate: number;
  }[]> {
    const stats = await this.prisma.conversion.groupBy({
      by: ['webmasterId'],
      where: {
        webmasterId: { not: null },
      },
      _count: true,
      _sum: {
        revenue: true,
      },
      orderBy: {
        _sum: { revenue: 'desc' },
      },
      take: limit,
    });

    // Get approved counts
    const approvedStats = await this.prisma.conversion.groupBy({
      by: ['webmasterId'],
      where: {
        webmasterId: { not: null },
        status: 'APPROVED',
      },
      _count: true,
    });

    const approvedMap = new Map(approvedStats.map(s => [s.webmasterId, s._count]));

    return stats.map(s => ({
      webmasterId: s.webmasterId!,
      conversions: s._count,
      revenue: s._sum.revenue?.toNumber() || 0,
      approveRate: s._count > 0
        ? ((approvedMap.get(s.webmasterId) || 0) / s._count) * 100
        : 0,
    }));
  }

  /**
   * Get hourly distribution for today
   */
  async getHourlyDistribution(): Promise<{ hour: number; conversions: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const conversions = await this.prisma.conversion.findMany({
      where: {
        convertedAt: { gte: today },
      },
      select: {
        convertedAt: true,
      },
    });

    const hourlyMap = new Map<number, number>();
    for (let i = 0; i < 24; i++) {
      hourlyMap.set(i, 0);
    }

    for (const conv of conversions) {
      const hour = conv.convertedAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
    }

    return Array.from(hourlyMap.entries()).map(([hour, count]) => ({
      hour,
      conversions: count,
    }));
  }

  /**
   * Compare two date ranges
   */
  async compareRanges(
    range1: DateRange,
    range2: DateRange,
  ): Promise<{
    current: AnalyticsSummary;
    previous: AnalyticsSummary;
    changes: {
      revenue: number;
      profit: number;
      conversions: number;
      roi: number;
    };
  }> {
    const [current, previous] = await Promise.all([
      this.getSummary(range1),
      this.getSummary(range2),
    ]);

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? ((curr - prev) / prev) * 100 : 0;

    return {
      current,
      previous,
      changes: {
        revenue: calcChange(current.revenue, previous.revenue),
        profit: calcChange(current.profit, previous.profit),
        conversions: calcChange(current.conversions, previous.conversions),
        roi: current.roi - previous.roi,
      },
    };
  }
}
