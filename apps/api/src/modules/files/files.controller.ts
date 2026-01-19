import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('files')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        recordId: { type: 'string' },
        taskId: { type: 'string' },
        projectId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { recordId?: string; taskId?: string; projectId?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.filesService.upload(
      {
        buffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        recordId: body.recordId,
        taskId: body.taskId,
        projectId: body.projectId,
      },
      user.id,
    );
  }

  @Get('record/:recordId')
  @ApiOperation({ summary: 'Get files for record' })
  findByRecord(@Param('recordId') recordId: string) {
    return this.filesService.findByRecord(recordId);
  }

  @Get('task/:taskId')
  @ApiOperation({ summary: 'Get files for task' })
  findByTask(@Param('taskId') taskId: string) {
    return this.filesService.findByTask(taskId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file info' })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Get download URL' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const url = await this.filesService.getDownloadUrl(id);
    res.redirect(url);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file' })
  remove(@Param('id') id: string) {
    return this.filesService.remove(id);
  }
}
