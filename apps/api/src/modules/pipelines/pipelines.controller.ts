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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PipelinesService, CreatePipelineDto, UpdatePipelineDto } from './pipelines.service';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('pipelines')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('pipelines')
export class PipelinesController {
  constructor(private readonly pipelinesService: PipelinesService) {}

  @Post()
  @ApiOperation({ summary: 'Create pipeline' })
  create(@Body() dto: CreatePipelineDto) {
    return this.pipelinesService.create(dto);
  }

  @Get('object/:objectId')
  @ApiOperation({ summary: 'Get pipelines for object' })
  findByObject(@Param('objectId') objectId: string) {
    return this.pipelinesService.findByObject(objectId);
  }

  @Get('object/:objectId/default')
  @ApiOperation({ summary: 'Get default pipeline for object' })
  getDefault(@Param('objectId') objectId: string) {
    return this.pipelinesService.getDefault(objectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pipeline by ID' })
  findOne(@Param('id') id: string) {
    return this.pipelinesService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get pipeline stage statistics' })
  getStats(@Param('id') id: string) {
    return this.pipelinesService.getStageStats(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update pipeline' })
  update(@Param('id') id: string, @Body() dto: UpdatePipelineDto) {
    return this.pipelinesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete pipeline' })
  remove(@Param('id') id: string) {
    return this.pipelinesService.remove(id);
  }
}
