import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Notification, Prisma } from '../../../generated/prisma';

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        data: dto.data as Prisma.InputJsonValue,
      },
    });

    this.logger.log('Notification created', {
      notificationId: notification.id,
      userId: dto.userId,
      type: dto.type,
    });

    return notification;
  }

  async findByUser(
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]> {
    const where: Prisma.NotificationWhereInput = { userId };

    if (options?.unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    return { count: result.count };
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteAll(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.deleteMany({
      where: { userId },
    });

    return { count: result.count };
  }

  // Helper method to create common notification types
  async notifyRecordCreated(
    userId: string,
    objectName: string,
    recordName: string,
    recordId: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: 'record_created',
      title: `New ${objectName} created`,
      message: `${recordName} has been added to ${objectName}`,
      data: { objectName, recordId, recordName },
    });
  }

  async notifyTaskAssigned(
    userId: string,
    taskTitle: string,
    taskId: string,
    assignedBy: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: 'task_assigned',
      title: 'Task assigned to you',
      message: `You have been assigned: ${taskTitle}`,
      data: { taskId, taskTitle, assignedBy },
    });
  }

  async notifyTaskDueSoon(
    userId: string,
    taskTitle: string,
    taskId: string,
    dueDate: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: 'task_due_soon',
      title: 'Task due soon',
      message: `${taskTitle} is due ${dueDate}`,
      data: { taskId, taskTitle, dueDate },
    });
  }

  async notifyCommentMention(
    userId: string,
    mentionedBy: string,
    recordName: string,
    recordId: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: 'comment_mention',
      title: 'You were mentioned',
      message: `${mentionedBy} mentioned you in ${recordName}`,
      data: { recordId, recordName, mentionedBy },
    });
  }
}
