import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/auth.service';
import { ImportExportService } from './import-export.service';
import {
  ImportDataDto,
  ExportOptionsDto,
  ImportPreviewResponse,
  ImportResultResponse,
  AvailableObjectResponse,
  ObjectFieldResponse,
} from './dto/import-export.dto';

@ApiTags('Import/Export')
@ApiBearerAuth()
@Controller('import-export')
@UseGuards(AuthGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get('objects')
  @ApiOperation({ summary: 'Get available objects for import/export' })
  @ApiResponse({ status: 200, description: 'List of available objects' })
  async getAvailableObjects(): Promise<AvailableObjectResponse[]> {
    return this.importExportService.getAvailableObjects();
  }

  @Get('objects/:objectId/fields')
  @ApiOperation({ summary: 'Get fields for an object' })
  @ApiResponse({ status: 200, description: 'List of object fields' })
  async getObjectFields(
    @Param('objectId') objectId: string,
  ): Promise<ObjectFieldResponse[]> {
    return this.importExportService.getObjectFields(objectId);
  }

  @Post('preview/:objectId')
  @ApiOperation({ summary: 'Upload file and get import preview with suggested mappings' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV or Excel file',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Import preview with suggested mappings' })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const allowedExts = ['.csv', '.xls', '.xlsx'];
        const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));

        if (allowedMimes.includes(file.mimetype) || allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only CSV and Excel files are allowed'), false);
        }
      },
    }),
  )
  async getImportPreview(
    @Param('objectId') objectId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportPreviewResponse> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.importExportService.getImportPreview(
      objectId,
      file.buffer,
      file.originalname,
    );
  }

  @Post('import')
  @ApiOperation({ summary: 'Import records from parsed data with mappings' })
  @ApiResponse({ status: 200, description: 'Import result with success/failure counts' })
  async importRecords(
    @Body() dto: ImportDataDto,
    @CurrentUser() user: AuthUser,
  ): Promise<ImportResultResponse> {
    return this.importExportService.importRecords(
      dto.objectId,
      dto.rows,
      dto.mappings,
      user.id,
      dto.options,
    );
  }

  @Post('export/:objectId')
  @ApiOperation({ summary: 'Export records to CSV or Excel' })
  @ApiResponse({
    status: 200,
    description: 'Returns file download',
    content: {
      'text/csv': {},
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {},
    },
  })
  async exportRecords(
    @Param('objectId') objectId: string,
    @Body() options: ExportOptionsDto,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename, mimeType } = await this.importExportService.exportRecords(
      objectId,
      options,
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('export/:objectId')
  @ApiOperation({ summary: 'Quick export to CSV (GET endpoint)' })
  async quickExport(
    @Param('objectId') objectId: string,
    @Query('format') format: 'csv' | 'xlsx' = 'csv',
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename, mimeType } = await this.importExportService.exportRecords(
      objectId,
      { format },
    );

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
