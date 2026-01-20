import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
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
} from '@nestjs/swagger';
import { RelationsService } from './relations.service';
import { CreateRelationDto, QueryRelationsDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('relations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('relations')
export class RelationsController {
  constructor(private readonly relationsService: RelationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new relation between records' })
  @ApiResponse({ status: 201, description: 'Relation created successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @ApiResponse({ status: 409, description: 'Relation already exists' })
  create(@Body() dto: CreateRelationDto) {
    return this.relationsService.create(dto);
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Get all relations for a record' })
  @ApiParam({ name: 'recordId', description: 'Record ID' })
  @ApiResponse({ status: 200, description: 'Returns list of relations' })
  findByRecord(
    @Param('recordId') recordId: string,
    @Query() query: QueryRelationsDto,
  ) {
    return this.relationsService.findByRecord(recordId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get relation by ID' })
  @ApiParam({ name: 'id', description: 'Relation ID' })
  @ApiResponse({ status: 200, description: 'Returns the relation' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  findOne(@Param('id') id: string) {
    return this.relationsService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a relation' })
  @ApiParam({ name: 'id', description: 'Relation ID' })
  @ApiResponse({ status: 204, description: 'Relation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Relation not found' })
  remove(@Param('id') id: string) {
    return this.relationsService.remove(id);
  }
}
