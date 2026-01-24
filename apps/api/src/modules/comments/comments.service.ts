import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Comment } from '../../../generated/prisma';

export interface CreateCommentDto {
  content: string;
  recordId?: string;
  taskId?: string;
  projectId?: string;
  parentId?: string;
  mentions?: string[];
}

export interface UpdateCommentDto {
  content?: string;
  mentions?: string[];
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateCommentDto, userId: string): Promise<Comment> {
    // Extract mentions from content if not provided
    const mentions = dto.mentions || this.extractMentions(dto.content);

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        recordId: dto.recordId,
        taskId: dto.taskId,
        projectId: dto.projectId,
        parentId: dto.parentId,
        authorId: userId,
        mentions,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        parent: {
          select: {
            id: true,
            content: true,
            authorId: true,
            author: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    this.logger.log('Comment created', {
      commentId: comment.id,
      taskId: dto.taskId,
      recordId: dto.recordId,
      parentId: dto.parentId,
      isReply: !!dto.parentId,
    });

    // Send notifications
    await this.sendCommentNotifications(comment, dto, userId, mentions);

    return comment;
  }

  /**
   * Send notifications when a comment is created
   */
  private async sendCommentNotifications(
    comment: Comment & { author?: { name?: string | null; email: string }; parent?: { authorId: string } | null },
    dto: CreateCommentDto,
    userId: string,
    mentions: string[],
  ): Promise<void> {
    const authorName = comment.author?.name || comment.author?.email || 'Someone';

    // If this is a reply, notify the parent comment author
    if (dto.parentId && comment.parent && comment.parent.authorId !== userId) {
      await this.notificationsService.create({
        userId: comment.parent.authorId,
        type: 'comment_reply',
        title: 'New reply to your comment',
        message: `${authorName} replied to your comment`,
        data: {
          commentId: comment.id,
          parentId: dto.parentId,
          taskId: dto.taskId,
          recordId: dto.recordId,
          authorName,
        },
      });
    }

    // Notify mentioned users
    for (const mentionedUserId of mentions) {
      if (mentionedUserId !== userId) {
        await this.notificationsService.create({
          userId: mentionedUserId,
          type: 'comment_mention',
          title: 'You were mentioned',
          message: `${authorName} mentioned you in a comment`,
          data: {
            commentId: comment.id,
            taskId: dto.taskId,
            recordId: dto.recordId,
            authorName,
          },
        });
      }
    }

    // Notify task creator and assignee about new comments (excluding reply author)
    if (dto.taskId && !dto.parentId) {
      const task = await this.prisma.task.findUnique({
        where: { id: dto.taskId },
        select: { id: true, title: true, createdBy: true, assigneeId: true },
      });

      if (task) {
        const notifyUsers = new Set<string>();

        // Notify creator if not the comment author
        if (task.createdBy !== userId) {
          notifyUsers.add(task.createdBy);
        }

        // Notify assignee if exists and not the comment author
        if (task.assigneeId && task.assigneeId !== userId) {
          notifyUsers.add(task.assigneeId);
        }

        // Remove mentioned users (they already got a mention notification)
        mentions.forEach((m) => notifyUsers.delete(m));

        for (const notifyUserId of notifyUsers) {
          await this.notificationsService.create({
            userId: notifyUserId,
            type: 'comment_added',
            title: 'New comment on task',
            message: `${authorName} commented on "${task.title}"`,
            data: {
              commentId: comment.id,
              taskId: task.id,
              taskTitle: task.title,
              authorName,
            },
          });
        }
      }
    }
  }

  async findByRecord(recordId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { recordId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });
  }

  async findByTask(taskId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { taskId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });
  }

  async findByProject(projectId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { projectId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, name: true, email: true, avatar: true } },
          },
        },
      },
    });
  }

  async update(id: string, dto: UpdateCommentDto, userId: string): Promise<Comment> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    if (comment.authorId !== userId) {
      throw new NotFoundException('You can only edit your own comments');
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        content: dto.content,
        mentions: dto.mentions || (dto.content ? this.extractMentions(dto.content) : undefined),
      },
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    if (!comment) {
      throw new NotFoundException(`Comment with ID "${id}" not found`);
    }

    if (comment.authorId !== userId) {
      throw new NotFoundException('You can only delete your own comments');
    }

    await this.prisma.comment.delete({ where: { id } });
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // User ID is in the parentheses
    }

    return mentions;
  }
}
