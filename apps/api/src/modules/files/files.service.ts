import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async upload(dto: CreateFileDto, userId: string): Promise<File> {
    const { name, url } = await this.storage.upload(dto.buffer, dto.originalName, dto.mimeType);

    const file = await this.prisma.file.create({
      data: {
        name,
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        url,
        recordId: dto.recordId,
        taskId: dto.taskId,
        projectId: dto.projectId,
        uploadedBy: userId,
      },
    });

    this.logger.log('File uploaded', { fileId: file.id, userId });

    return file;
  }

  async findByRecord(recordId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByTask(taskId: string): Promise<File[]> {
    return this.prisma.file.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<File> {
    const file = await this.prisma.file.findUnique({ where: { id } });

    if (!file) {
      throw new NotFoundException(`File with ID "${id}" not found`);
    }

    return file;
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
