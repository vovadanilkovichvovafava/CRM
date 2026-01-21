import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { SystemSettingsService, SystemSettingsDto } from './system-settings.service';

@ApiTags('System Settings')
@ApiBearerAuth()
@Controller('system-settings')
@UseGuards(AuthGuard)
export class SystemSettingsController {
  constructor(private readonly settingsService: SystemSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings retrieved' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async getSettings(@CurrentUser() user: AuthUser): Promise<SystemSettingsDto> {
    return this.settingsService.getAll(user.role);
  }

  @Patch()
  @ApiOperation({ summary: 'Update system settings (Admin only)' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async updateSettings(
    @CurrentUser() user: AuthUser,
    @Body() data: Partial<SystemSettingsDto>,
  ): Promise<{ updated: string[] }> {
    return this.settingsService.update(data, user.id, user.role);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get integration status' })
  async getStatus(): Promise<{
    email: boolean;
    telegram: boolean;
  }> {
    // Anyone can check status
    const [email, telegram] = await Promise.all([
      this.settingsService.isEmailConfigured(),
      this.settingsService.isTelegramConfigured(),
    ]);
    return { email, telegram };
  }
}
