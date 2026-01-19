import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ViewsService, CreateViewDto, UpdateViewDto } from './views.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('views')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('views')
export class ViewsController {
  constructor(private readonly viewsService: ViewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new view' })
  @ApiResponse({ status: 201, description: 'View created successfully' })
  create(@Body() dto: CreateViewDto, @CurrentUser() user: AuthUser) {
    return this.viewsService.create(dto, user.id);
  }

  @Get('object/:objectId')
  @ApiOperation({ summary: 'Get all views for an object' })
  @ApiParam({ name: 'objectId', description: 'Object ID' })
  findByObject(@Param('objectId') objectId: string, @CurrentUser() user: AuthUser) {
    return this.viewsService.findByObject(objectId, user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get view by ID' })
  @ApiParam({ name: 'id', description: 'View ID' })
  findOne(@Param('id') id: string) {
    return this.viewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update view' })
  @ApiParam({ name: 'id', description: 'View ID' })
  update(@Param('id') id: string, @Body() dto: UpdateViewDto) {
    return this.viewsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete view' })
  @ApiParam({ name: 'id', description: 'View ID' })
  remove(@Param('id') id: string) {
    return this.viewsService.remove(id);
  }
}
