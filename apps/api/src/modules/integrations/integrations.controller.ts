import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { IntegrationsService, CreateIntegrationDto, UpdateIntegrationDto } from './integrations.service';

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  @ApiOperation({ summary: 'List all integrations' })
  @ApiResponse({ status: 200, description: 'Returns list of integrations' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.integrationsService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get integration by ID' })
  @ApiResponse({ status: 200, description: 'Returns integration details' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  findOne(@Param('id') id: string) {
    return this.integrationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new integration' })
  @ApiResponse({ status: 201, description: 'Integration created' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  create(@Body() dto: CreateIntegrationDto, @CurrentUser() user: AuthUser) {
    return this.integrationsService.create(dto, user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update integration' })
  @ApiResponse({ status: 200, description: 'Integration updated' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationDto) {
    return this.integrationsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete integration' })
  @ApiResponse({ status: 204, description: 'Integration deleted' })
  @ApiResponse({ status: 404, description: 'Integration not found' })
  remove(@Param('id') id: string) {
    return this.integrationsService.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test integration connection' })
  @ApiResponse({ status: 200, description: 'Returns connection status' })
  async testConnection(@Param('id') id: string) {
    const connected = await this.integrationsService.testConnection(id);
    return { connected };
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync data from integration' })
  @ApiResponse({ status: 200, description: 'Returns sync result' })
  sync(@Param('id') id: string) {
    return this.integrationsService.sync(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get integration statistics' })
  @ApiResponse({ status: 200, description: 'Returns integration stats' })
  getStats(@Param('id') id: string) {
    return this.integrationsService.getStats(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get sync logs' })
  @ApiResponse({ status: 200, description: 'Returns sync logs' })
  getSyncLogs(@Param('id') id: string) {
    return this.integrationsService.getSyncLogs(id);
  }
}
