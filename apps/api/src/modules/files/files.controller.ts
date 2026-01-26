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
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { FilesService } from './files.service';
import { StorageService } from './storage.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
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
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get files for record' })
  findByRecord(@Param('recordId') recordId: string) {
    return this.filesService.findByRecord(recordId);
  }

  @Get('task/:taskId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get files for task' })
  findByTask(@Param('taskId') taskId: string) {
    return this.filesService.findByTask(taskId);
  }

  // Serve local files without auth (files have unique UUIDs)
  @Get('local/:filename')
  @ApiOperation({ summary: 'Get local file content' })
  async getLocalFile(@Param('filename') filename: string, @Res() res: Response) {
    const file = await this.storageService.getLocalFile(filename);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(file.buffer);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get file info' })
  findOne(@Param('id') id: string) {
    return this.filesService.findOne(id);
  }

  @Get(':id/download')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get download URL' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const url = await this.filesService.getDownloadUrl(id);
    res.redirect(url);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete file' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.filesService.remove(id, user.id);
  }
}
