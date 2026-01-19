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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FieldsService } from './fields.service';
import { CreateFieldDto, UpdateFieldDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('fields')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('fields')
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new field' })
  @ApiResponse({ status: 201, description: 'Field created successfully' })
  @ApiResponse({ status: 409, description: 'Field with this name already exists' })
  create(@Body() dto: CreateFieldDto) {
    return this.fieldsService.create(dto);
  }

  @Get('object/:objectId')
  @ApiOperation({ summary: 'Get all fields for an object' })
  @ApiParam({ name: 'objectId', description: 'Object ID' })
  @ApiResponse({ status: 200, description: 'Returns list of fields' })
  findByObject(@Param('objectId') objectId: string) {
    return this.fieldsService.findByObject(objectId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field by ID' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({ status: 200, description: 'Returns the field' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  findOne(@Param('id') id: string) {
    return this.fieldsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update field' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({ status: 200, description: 'Field updated successfully' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  update(@Param('id') id: string, @Body() dto: UpdateFieldDto) {
    return this.fieldsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete field' })
  @ApiParam({ name: 'id', description: 'Field ID' })
  @ApiResponse({ status: 204, description: 'Field deleted successfully' })
  @ApiResponse({ status: 404, description: 'Field not found' })
  remove(@Param('id') id: string) {
    return this.fieldsService.remove(id);
  }

  @Post('reorder/:objectId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder fields' })
  @ApiParam({ name: 'objectId', description: 'Object ID' })
  @ApiBody({ schema: { type: 'array', items: { type: 'string' } } })
  @ApiResponse({ status: 204, description: 'Fields reordered successfully' })
  reorder(@Param('objectId') objectId: string, @Body() orderedIds: string[]) {
    return this.fieldsService.reorder(objectId, orderedIds);
  }
}
