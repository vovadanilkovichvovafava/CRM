import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Comment, Prisma } from '../../../generated/prisma';

export interface CreateCommentDto {
  content: string;
  recordId?: string;
  taskId?: string;
  projectId?: string;
  mentions?: string[];
}

export interface UpdateCommentDto {
  content?: string;
  mentions?: string[];
}

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCommentDto, userId: string): Promise<Comment> {
    // Extract mentions from content if not provided
    const mentions = dto.mentions || this.extractMentions(dto.content);

    return this.prisma.comment.create({
      data: {
        content: dto.content,
        recordId: dto.recordId,
        taskId: dto.taskId,
        projectId: dto.projectId,
        authorId: userId,
        mentions,
      },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async findByRecord(recordId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async findByTask(taskId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });
  }

  async findByProject(projectId: string): Promise<Comment[]> {
    return this.prisma.comment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true, avatar: true } },
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
