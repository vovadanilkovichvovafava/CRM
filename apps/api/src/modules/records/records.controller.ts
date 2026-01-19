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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { RecordsService } from './records.service';
import { CreateRecordDto, UpdateRecordDto, QueryRecordsDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('records')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new record' })
  @ApiResponse({ status: 201, description: 'Record created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateRecordDto, @CurrentUser() user: AuthUser) {
    return this.recordsService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all records with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of records' })
  findAll(@Query() query: QueryRecordsDto) {
    return this.recordsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get record by ID' })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Returns the record with related data' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  findOne(@Param('id') id: string, @Query('include') include?: string) {
    const includeArray = include ? include.split(',') : undefined;
    return this.recordsService.findOne(id, includeArray);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update record' })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Record updated successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRecordDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.recordsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (archive) record' })
  @ApiParam({ name: 'id', description: 'Record ID' })
  @ApiResponse({ status: 204, description: 'Record archived successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  remove(@Param('id') id: string, @Query('hard') hard?: boolean) {
    return this.recordsService.remove(id, hard);
  }

  @Post('bulk/update')
  @ApiOperation({ summary: 'Bulk update records' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        data: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Records updated successfully' })
  bulkUpdate(
    @Body() body: { ids: string[]; data: Record<string, unknown> },
    @CurrentUser() user: AuthUser,
  ) {
    return this.recordsService.bulkUpdate(body.ids, body.data, user.id);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete records' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        hard: { type: 'boolean', default: false },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Records deleted successfully' })
  bulkDelete(@Body() body: { ids: string[]; hard?: boolean }) {
    return this.recordsService.bulkDelete(body.ids, body.hard);
  }
}
