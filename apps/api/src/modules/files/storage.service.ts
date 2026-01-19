import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuid } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client | null;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT');
    const port = this.config.get<number>('MINIO_PORT') || 9000;
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    this.bucket = this.config.get<string>('MINIO_BUCKET') || 'crm-files';

    if (!endpoint || !accessKey || !secretKey) {
      this.logger.warn('MinIO not configured, file storage disabled');
      this.client = null;
      return;
    }

    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL: false,
      accessKey,
      secretKey,
    });

    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    if (!this.client) return;

    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket);
        this.logger.log(`Bucket "${this.bucket}" created`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize bucket', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ name: string; url: string }> {
    if (!this.client) {
      throw new Error('Storage not configured');
    }

    const ext = originalName.split('.').pop() || '';
    const name = `${uuid()}.${ext}`;

    await this.client.putObject(this.bucket, name, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    const url = await this.getUrl(name);

    return { name, url };
  }

  async getUrl(name: string): Promise<string> {
    if (!this.client) {
      throw new Error('Storage not configured');
    }

    // Generate presigned URL valid for 7 days
    return this.client.presignedGetObject(this.bucket, name, 7 * 24 * 60 * 60);
  }

  async delete(name: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.removeObject(this.bucket, name);
    } catch (error) {
      this.logger.error('Failed to delete file', {
        name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
