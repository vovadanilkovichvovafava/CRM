import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { EmailStatus, Prisma } from '../../../generated/prisma';

export interface SendEmailDto {
  templateId?: string;
  recordId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachmentIds?: string[];
}

export interface EmailLogQuery {
  templateId?: string;
  recordId?: string;
  status?: EmailStatus;
  page?: number;
  limit?: number;
}

export interface EmailStats {
  total: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  failed: number;
}

@Injectable()
export class EmailSendingService {
  private readonly logger = new Logger(EmailSendingService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    this.fromEmail = this.config.get<string>('EMAIL_FROM') || 'noreply@example.com';

    if (apiKey && apiKey !== 'xxx' && apiKey !== 're_xxx') {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.resend = null;
      this.logger.warn('Resend API key not configured - emails will be simulated');
    }
  }

  async send(dto: SendEmailDto, userId: string): Promise<{ id: string; messageId?: string }> {
    if (!dto.to || dto.to.length === 0) {
      throw new BadRequestException('At least one recipient is required');
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of dto.to) {
      if (!emailRegex.test(email)) {
        throw new BadRequestException(`Invalid email address: ${email}`);
      }
    }

    // Get attachments if specified
    let attachments: Array<{ filename: string; content: Buffer }> = [];
    if (dto.attachmentIds && dto.attachmentIds.length > 0) {
      const templateAttachments = await this.prisma.emailTemplateAttachment.findMany({
        where: { id: { in: dto.attachmentIds } },
      });

      // Fetch attachment contents
      for (const att of templateAttachments) {
        try {
          const response = await fetch(att.url);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            attachments.push({
              filename: att.originalName,
              content: buffer,
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch attachment: ${att.name}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    // Create email log entry
    const emailLog = await this.prisma.emailLog.create({
      data: {
        templateId: dto.templateId,
        recordId: dto.recordId,
        from: this.fromEmail,
        to: dto.to,
        cc: dto.cc || [],
        bcc: dto.bcc || [],
        subject: dto.subject,
        body: dto.body,
        status: EmailStatus.PENDING,
        sentBy: userId,
      },
    });

    try {
      let messageId: string | undefined;

      if (this.resend) {
        // Send real email via Resend
        const result = await this.resend.emails.send({
          from: this.fromEmail,
          to: dto.to,
          cc: dto.cc,
          bcc: dto.bcc,
          subject: dto.subject,
          html: dto.body,
          attachments: attachments.length > 0 ? attachments : undefined,
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        messageId = result.data?.id;
      } else {
        // Simulate email sending for development
        this.logger.log('Simulating email send', {
          to: dto.to,
          subject: dto.subject,
          attachments: attachments.map((a) => a.filename),
        });
        messageId = `simulated-${Date.now()}`;
      }

      // Update status to sent
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.SENT,
          messageId,
          sentAt: new Date(),
        },
      });

      this.logger.log('Email sent successfully', {
        emailLogId: emailLog.id,
        to: dto.to,
        subject: dto.subject,
      });

      return { id: emailLog.id, messageId };
    } catch (error) {
      // Update status to failed
      await this.prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: EmailStatus.FAILED,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      this.logger.error('Failed to send email', {
        emailLogId: emailLog.id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw new BadRequestException('Failed to send email: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async sendFromTemplate(
    templateId: string,
    to: string[],
    data: Record<string, string>,
    userId: string,
    options?: { cc?: string[]; bcc?: string[]; recordId?: string },
  ): Promise<{ id: string; messageId?: string }> {
    // Get template with attachments
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id: templateId },
      include: { attachments: true },
    });

    if (!template) {
      throw new BadRequestException('Template not found');
    }

    // Render subject and body with data
    const subject = this.renderTemplate(template.subject, data);
    const body = this.renderTemplate(template.body, data);

    return this.send(
      {
        templateId,
        recordId: options?.recordId,
        to,
        cc: options?.cc,
        bcc: options?.bcc,
        subject,
        body,
        attachmentIds: template.attachments.map((a) => a.id),
      },
      userId,
    );
  }

  private renderTemplate(template: string, data: Record<string, string>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(data)) {
      rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }
    return rendered;
  }

  async getEmailLogs(query: EmailLogQuery, userId: string) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailLogWhereInput = {
      sentBy: userId,
    };

    if (query.templateId) {
      where.templateId = query.templateId;
    }

    if (query.recordId) {
      where.recordId = query.recordId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          template: {
            select: { name: true },
          },
        },
      }),
      this.prisma.emailLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmailStats(userId: string): Promise<EmailStats> {
    const baseWhere = { sentBy: userId };

    const [total, sent, delivered, opened, clicked, bounced, failed] = await Promise.all([
      this.prisma.emailLog.count({ where: baseWhere }),
      this.prisma.emailLog.count({ where: { ...baseWhere, status: EmailStatus.SENT } }),
      this.prisma.emailLog.count({ where: { ...baseWhere, status: EmailStatus.DELIVERED } }),
      this.prisma.emailLog.count({ where: { ...baseWhere, status: EmailStatus.OPENED } }),
      this.prisma.emailLog.count({ where: { ...baseWhere, status: EmailStatus.CLICKED } }),
      this.prisma.emailLog.count({ where: { ...baseWhere, status: EmailStatus.BOUNCED } }),
      this.prisma.emailLog.count({ where: { ...baseWhere, status: EmailStatus.FAILED } }),
    ]);

    return { total, sent, delivered, opened, clicked, bounced, failed };
  }

  async getEmailLog(id: string, userId: string) {
    const log = await this.prisma.emailLog.findUnique({
      where: { id },
      include: {
        template: {
          select: { name: true },
        },
      },
    });

    if (!log || log.sentBy !== userId) {
      throw new BadRequestException('Email log not found');
    }

    return log;
  }
}
