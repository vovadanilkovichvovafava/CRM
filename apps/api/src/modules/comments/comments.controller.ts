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
import { CommentsService, CreateCommentDto, UpdateCommentDto } from './comments.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create comment' })
  create(@Body() dto: CreateCommentDto, @CurrentUser() user: AuthUser) {
    return this.commentsService.create(dto, user.id);
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Get comments for record' })
  findByRecord(@Param('recordId') recordId: string) {
    return this.commentsService.findByRecord(recordId);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get comments for task' })
  findByTask(@Param('taskId') taskId: string) {
    return this.commentsService.findByTask(taskId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get comments for project' })
  findByProject(@Param('projectId') projectId: string) {
    return this.commentsService.findByProject(projectId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update comment' })
  update(@Param('id') id: string, @Body() dto: UpdateCommentDto, @CurrentUser() user: AuthUser) {
    return this.commentsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete comment' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.commentsService.remove(id, user.id);
  }
}
