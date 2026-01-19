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
import { ObjectsService } from './objects.service';
import { CreateObjectDto, UpdateObjectDto, QueryObjectsDto } from './dto';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('objects')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('objects')
export class ObjectsController {
  constructor(private readonly objectsService: ObjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new custom object' })
  @ApiResponse({ status: 201, description: 'Object created successfully' })
  @ApiResponse({ status: 409, description: 'Object with this name already exists' })
  create(@Body() dto: CreateObjectDto) {
    return this.objectsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all objects' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of objects' })
  findAll(@Query() query: QueryObjectsDto) {
    return this.objectsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get object by ID' })
  @ApiParam({ name: 'id', description: 'Object ID' })
  @ApiResponse({ status: 200, description: 'Returns the object with fields' })
  @ApiResponse({ status: 404, description: 'Object not found' })
  findOne(@Param('id') id: string) {
    return this.objectsService.findOne(id);
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get object by name' })
  @ApiParam({ name: 'name', description: 'Object system name' })
  @ApiResponse({ status: 200, description: 'Returns the object' })
  findByName(@Param('name') name: string) {
    return this.objectsService.findByName(name);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update object' })
  @ApiParam({ name: 'id', description: 'Object ID' })
  @ApiResponse({ status: 200, description: 'Object updated successfully' })
  @ApiResponse({ status: 404, description: 'Object not found' })
  update(@Param('id') id: string, @Body() dto: UpdateObjectDto) {
    return this.objectsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (archive) object' })
  @ApiParam({ name: 'id', description: 'Object ID' })
  @ApiResponse({ status: 204, description: 'Object archived successfully' })
  @ApiResponse({ status: 404, description: 'Object not found' })
  remove(@Param('id') id: string, @Query('hard') hard?: boolean) {
    return this.objectsService.remove(id, hard);
  }

  @Post('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Reorder objects' })
  @ApiBody({ schema: { type: 'array', items: { type: 'string' } } })
  @ApiResponse({ status: 204, description: 'Objects reordered successfully' })
  reorder(@Body() orderedIds: string[]) {
    return this.objectsService.reorder(orderedIds);
  }

  @Post('seed-system')
  @ApiOperation({ summary: 'Create default system objects' })
  @ApiResponse({ status: 201, description: 'System objects created' })
  seedSystem() {
    return this.objectsService.createSystemObjects();
  }
}
