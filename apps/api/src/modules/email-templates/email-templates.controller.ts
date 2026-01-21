import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import {
  EmailTemplatesService,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
} from './email-templates.service';
import { EmailSendingService, SendEmailDto } from './email-sending.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { EmailStatus } from '../../../generated/prisma';

@ApiTags('email-templates')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(
    private readonly emailTemplatesService: EmailTemplatesService,
    private readonly emailSendingService: EmailSendingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create email template' })
  create(@Body() dto: CreateEmailTemplateDto, @CurrentUser() user: AuthUser) {
    return this.emailTemplatesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all email templates' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeShared', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('includeShared') includeShared?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.emailTemplatesService.findAll(
      {
        category,
        search,
        includeShared: includeShared !== 'false',
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user.id,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get template categories' })
  getCategories(@CurrentUser() user: AuthUser) {
    return this.emailTemplatesService.getCategories(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get email template by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.emailTemplatesService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update email template' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEmailTemplateDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.emailTemplatesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete email template' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.emailTemplatesService.remove(id, user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate email template' })
  duplicate(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.emailTemplatesService.duplicate(id, user.id);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Preview template with sample data' })
  preview(@Body() body: { template: string; data: Record<string, string> }) {
    return {
      html: this.emailTemplatesService.renderPreview(body.template, body.data),
    };
  }

  // Attachment endpoints
  @Get(':id/attachments')
  @ApiOperation({ summary: 'Get template attachments' })
  getAttachments(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.emailTemplatesService.getAttachments(id, user.id);
  }

  @Post(':id/attachments')
  @ApiOperation({ summary: 'Upload attachment to template' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB max
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ) {
    return this.emailTemplatesService.addAttachment(
      id,
      {
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
      },
      user.id,
    );
  }

  @Delete('attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete attachment' })
  removeAttachment(
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.emailTemplatesService.removeAttachment(attachmentId, user.id);
  }

  // Email sending endpoints
  @Post('send')
  @ApiOperation({ summary: 'Send email' })
  sendEmail(@Body() dto: SendEmailDto, @CurrentUser() user: AuthUser) {
    return this.emailSendingService.send(dto, user.id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send email using template' })
  sendFromTemplate(
    @Param('id') templateId: string,
    @Body() body: {
      to: string[];
      data: Record<string, string>;
      cc?: string[];
      bcc?: string[];
      recordId?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.emailSendingService.sendFromTemplate(
      templateId,
      body.to,
      body.data,
      user.id,
      { cc: body.cc, bcc: body.bcc, recordId: body.recordId },
    );
  }

  // Email logs endpoints
  @Get('logs')
  @ApiOperation({ summary: 'Get email logs' })
  @ApiQuery({ name: 'templateId', required: false })
  @ApiQuery({ name: 'recordId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: EmailStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getEmailLogs(
    @CurrentUser() user: AuthUser,
    @Query('templateId') templateId?: string,
    @Query('recordId') recordId?: string,
    @Query('status') status?: EmailStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.emailSendingService.getEmailLogs(
      {
        templateId,
        recordId,
        status,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
      },
      user.id,
    );
  }

  @Get('logs/stats')
  @ApiOperation({ summary: 'Get email sending stats' })
  getEmailStats(@CurrentUser() user: AuthUser) {
    return this.emailSendingService.getEmailStats(user.id);
  }

  @Get('logs/:logId')
  @ApiOperation({ summary: 'Get email log by ID' })
  getEmailLog(@Param('logId') logId: string, @CurrentUser() user: AuthUser) {
    return this.emailSendingService.getEmailLog(logId, user.id);
  }
}
