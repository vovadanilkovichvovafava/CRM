import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  contacts: { total: number; change: number };
  companies: { total: number; change: number };
  deals: { total: number; value: number; change: number };
  tasks: { total: number; completed: number; due: number };
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string | null;
  recordId: string | null;
  occurredAt: Date;
}

export interface UpcomingTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  project: { id: string; name: string } | null;
}

export interface AnalyticsOverview {
  totalRecords: number;
  totalDealsValue: number;
  conversionRate: number;
  avgDealValue: number;
  recordsByObject: Array<{ name: string; count: number; color: string }>;
  dealsByStage: Array<{ stage: string; count: number; value: number }>;
  recordsOverTime: Array<{ date: string; count: number }>;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get dashboard statistics
   */
  async getStats(): Promise<DashboardStats> {
    // Get date ranges for comparison
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Get objects by name to find their IDs
    const objects = await this.prisma.object.findMany({
      where: {
        name: { in: ['contacts', 'companies', 'deals'] },
      },
      select: { id: true, name: true },
    });

    const objectIdMap = objects.reduce(
      (acc, obj) => {
        acc[obj.name] = obj.id;
        return acc;
      },
      {} as Record<string, string>,
    );

    // Get contact stats
    const [contactsTotal, contactsLastMonth] = await Promise.all([
      this.prisma.record.count({
        where: { objectId: objectIdMap['contacts'], isArchived: false },
      }),
      this.prisma.record.count({
        where: {
          objectId: objectIdMap['contacts'],
          isArchived: false,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const contactsPrevMonth = await this.prisma.record.count({
      where: {
        objectId: objectIdMap['contacts'],
        isArchived: false,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    // Get company stats
    const [companiesTotal, companiesLastMonth] = await Promise.all([
      this.prisma.record.count({
        where: { objectId: objectIdMap['companies'], isArchived: false },
      }),
      this.prisma.record.count({
        where: {
          objectId: objectIdMap['companies'],
          isArchived: false,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    const companiesPrevMonth = await this.prisma.record.count({
      where: {
        objectId: objectIdMap['companies'],
        isArchived: false,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    });

    // Get deal stats
    const deals = await this.prisma.record.findMany({
      where: { objectId: objectIdMap['deals'], isArchived: false },
      select: { data: true, createdAt: true },
    });

    const dealsTotal = deals.length;
    const dealsValue = deals.reduce((sum, deal) => {
      const data = deal.data as Record<string, unknown>;
      const value = typeof data?.value === 'number' ? data.value : 0;
      return sum + value;
    }, 0);

    const dealsLastMonth = deals.filter((d) => d.createdAt >= thirtyDaysAgo).length;
    const dealsPrevMonth = deals.filter(
      (d) => d.createdAt >= sixtyDaysAgo && d.createdAt < thirtyDaysAgo,
    ).length;

    // Get task stats
    const [tasksTotal, tasksCompleted, tasksDue] = await Promise.all([
      this.prisma.task.count({ where: { isArchived: false } }),
      this.prisma.task.count({ where: { status: 'DONE', isArchived: false } }),
      this.prisma.task.count({
        where: {
          isArchived: false,
          status: { not: 'DONE' },
          dueDate: { lte: now },
        },
      }),
    ]);

    // Calculate percentage changes
    const calcChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      contacts: {
        total: contactsTotal,
        change: calcChange(contactsLastMonth, contactsPrevMonth),
      },
      companies: {
        total: companiesTotal,
        change: calcChange(companiesLastMonth, companiesPrevMonth),
      },
      deals: {
        total: dealsTotal,
        value: dealsValue,
        change: calcChange(dealsLastMonth, dealsPrevMonth),
      },
      tasks: {
        total: tasksTotal,
        completed: tasksCompleted,
        due: tasksDue,
      },
    };
  }

  /**
   * Get recent activities for dashboard
   */
  async getRecentActivities(limit = 10): Promise<RecentActivity[]> {
    const activities = await this.prisma.activity.findMany({
      orderBy: { occurredAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        recordId: true,
        occurredAt: true,
      },
    });

    return activities;
  }

  /**
   * Get upcoming tasks for dashboard
   */
  async getUpcomingTasks(limit = 5): Promise<UpcomingTask[]> {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        isArchived: false,
        status: { not: 'DONE' },
        OR: [
          { dueDate: { lte: sevenDaysFromNow } },
          { dueDate: null, priority: { in: ['HIGH', 'URGENT'] } },
        ],
      },
      orderBy: [{ dueDate: { sort: 'asc', nulls: 'last' } }, { priority: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return tasks;
  }

  /**
   * Get analytics overview data
   */
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    // Get all objects
    const objects = await this.prisma.object.findMany({
      where: { isArchived: false },
      select: { id: true, name: true, displayName: true, color: true },
    });

    const objectColors: Record<string, string> = {
      contacts: '#3b82f6',
      companies: '#10b981',
      deals: '#f59e0b',
      webmasters: '#8b5cf6',
      partners: '#ec4899',
    };

    // Get record counts by object
    const recordsByObject = await Promise.all(
      objects.map(async (obj) => {
        const count = await this.prisma.record.count({
          where: { objectId: obj.id, isArchived: false },
        });
        return {
          name: obj.displayName || obj.name,
          count,
          color: obj.color || objectColors[obj.name] || '#6b7280',
        };
      }),
    );

    // Get total records
    const totalRecords = recordsByObject.reduce((sum, obj) => sum + obj.count, 0);

    // Get deals object
    const dealsObject = objects.find((o) => o.name === 'deals');
    let totalDealsValue = 0;
    let avgDealValue = 0;
    let conversionRate = 0;
    const dealsByStage: Array<{ stage: string; count: number; value: number }> = [];

    if (dealsObject) {
      const deals = await this.prisma.record.findMany({
        where: { objectId: dealsObject.id, isArchived: false },
        select: { data: true, stage: true },
      });

      // Calculate total value
      deals.forEach((deal) => {
        const data = deal.data as Record<string, unknown>;
        const value = typeof data?.value === 'number' ? data.value : 0;
        totalDealsValue += value;
      });

      avgDealValue = deals.length > 0 ? totalDealsValue / deals.length : 0;

      // Get deals by stage
      const pipeline = await this.prisma.pipeline.findFirst({
        where: { objectId: dealsObject.id, isDefault: true },
      });

      if (pipeline && pipeline.stages) {
        // stages is a JSON array in the format: [{ name: string, order: number, color?: string }]
        const stages = pipeline.stages as Array<{ name: string; order: number; color?: string }>;
        const sortedStages = [...stages].sort((a, b) => a.order - b.order);

        for (const stage of sortedStages) {
          const stageDeals = deals.filter((d) => d.stage === stage.name);
          const stageValue = stageDeals.reduce((sum, d) => {
            const data = d.data as Record<string, unknown>;
            return sum + (typeof data?.value === 'number' ? data.value : 0);
          }, 0);

          dealsByStage.push({
            stage: stage.name,
            count: stageDeals.length,
            value: stageValue,
          });
        }

        // Calculate conversion rate (closed won / total)
        const closedWonStage = sortedStages.find((s) =>
          s.name.toLowerCase().includes('won') || s.name.toLowerCase().includes('closed'),
        );
        if (closedWonStage) {
          const closedDeals = deals.filter((d) => d.stage === closedWonStage.name);
          conversionRate = deals.length > 0 ? (closedDeals.length / deals.length) * 100 : 0;
        }
      }
    }

    // Get records over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await this.prisma.record.findMany({
      where: {
        isArchived: false,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const recordsOverTime: Array<{ date: string; count: number }> = [];
    const dateMap = new Map<string, number>();

    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const dateStr = date.toISOString().split('T')[0];
      dateMap.set(dateStr, 0);
    }

    recentRecords.forEach((record) => {
      const dateStr = record.createdAt.toISOString().split('T')[0];
      if (dateMap.has(dateStr)) {
        dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      }
    });

    dateMap.forEach((count, date) => {
      recordsOverTime.push({ date, count });
    });

    return {
      totalRecords,
      totalDealsValue,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgDealValue: Math.round(avgDealValue),
      recordsByObject: recordsByObject.filter((r) => r.count > 0),
      dealsByStage,
      recordsOverTime,
    };
  }
}
