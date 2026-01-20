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
}
