import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.service';
import { File } from '../../../generated/prisma';

export interface CreateFileDto {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  recordId?: string;
  taskId?: string;
  projectId?: string;
}

export interface FileWithUrl extends File {
  url: string;
}

@Injectable()
export class FilesService implements OnModuleInit {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Migrate file URLs from absolute localhost URLs to relative paths
   * This runs once on application startup
   */
  async onModuleInit(): Promise<void> {
    await this.migrateFileUrls();
  }

  /**
   * Update all file URLs that contain localhost to relative paths
   */
  private async migrateFileUrls(): Promise<void> {
    try {
      // Find all files with absolute localhost URLs
      const result = await this.prisma.$executeRaw`
        UPDATE "File"
        SET url = REPLACE(url, 'http://localhost:3001/api/files/local/', '/api/files/local/')
        WHERE url LIKE 'http://localhost:3001/api/files/local/%'
      `;

      if (result > 0) {
        this.logger.log(`Migrated ${result} file URLs from localhost to relative paths`);
      }
    } catch (error) {
      this.logger.error('Failed to migrate file URLs', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Generate current URL for a file (handles both stored URLs and dynamic generation)
   */
  private async getFileUrl(file: File): Promise<string> {
    // Always generate fresh URL to handle environment changes (localhost vs production)
    return this.storage.getUrl(file.name);
  }

  /**
   * Add dynamic URL to file object
   */
  private async addUrlToFile(file: File): Promise<FileWithUrl> {
    const url = await this.getFileUrl(file);
    return { ...file, url };
  }

  /**
   * Add dynamic URLs to array of files
   */
  private async addUrlsToFiles(files: File[]): Promise<FileWithUrl[]> {
    return Promise.all(files.map((file) => this.addUrlToFile(file)));
  }

  async upload(dto: CreateFileDto, userId: string): Promise<FileWithUrl> {
    const { name, url } = await this.storage.upload(dto.buffer, dto.originalName, dto.mimeType);

    const file = await this.prisma.file.create({
      data: {
        name,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        url, // Store URL for backwards compatibility
        recordId: dto.recordId,
        taskId: dto.taskId,
        projectId: dto.projectId,
        uploadedBy: userId,
      },
    });

    this.logger.log('File uploaded', { fileId: file.id, userId });

    // Return with dynamically generated URL
    return this.addUrlToFile(file);
  }

  async findByRecord(recordId: string): Promise<FileWithUrl[]> {
    const files = await this.prisma.file.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
    });
    return this.addUrlsToFiles(files);
  }

  async findByTask(taskId: string): Promise<FileWithUrl[]> {
    const files = await this.prisma.file.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    return this.addUrlsToFiles(files);
  }

  async findOne(id: string): Promise<FileWithUrl> {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    return this.addUrlToFile(file);
  }

  async getDownloadUrl(id: string): Promise<string> {
    const file = await this.findOne(id);
    return this.storage.getUrl(file.name);
  }

  async remove(id: string): Promise<void> {
    const file = await this.findOne(id);

    await this.storage.delete(file.name);
    await this.prisma.file.delete({ where: { id } });

    this.logger.log('File deleted', { fileId: id });
  }
}
