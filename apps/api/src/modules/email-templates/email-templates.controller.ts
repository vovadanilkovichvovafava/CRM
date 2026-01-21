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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import {
  EmailTemplatesService,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto,
} from './email-templates.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('email-templates')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('email-templates')
export class EmailTemplatesController {
  constructor(private readonly emailTemplatesService: EmailTemplatesService) {}

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
}
