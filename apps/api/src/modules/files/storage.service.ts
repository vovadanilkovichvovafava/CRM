import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: Minio.Client | null;
  private readonly bucket: string;
  private readonly useLocalStorage: boolean;
  private readonly localStoragePath: string;
  private readonly apiBaseUrl: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('MINIO_ENDPOINT');
    const port = this.config.get<number>('MINIO_PORT') || 9000;
    const accessKey = this.config.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.config.get<string>('MINIO_SECRET_KEY');
    this.bucket = this.config.get<string>('MINIO_BUCKET') || 'crm-files';
    this.apiBaseUrl = this.config.get<string>('API_BASE_URL') || 'http://localhost:3001';

    // Local storage fallback path
    this.localStoragePath = path.join(process.cwd(), 'uploads');

    if (!endpoint || !accessKey || !secretKey) {
      this.logger.warn('MinIO not configured, using local file storage');
      this.client = null;
      this.useLocalStorage = true;
      this.initializeLocalStorage();
      return;
    }

    this.useLocalStorage = false;
    this.client = new Minio.Client({
      endPoint: endpoint,
      port,
      useSSL: false,
      accessKey,
      secretKey,
    });

    this.initializeBucket();
  }

  private initializeLocalStorage(): void {
    try {
      if (!fs.existsSync(this.localStoragePath)) {
        fs.mkdirSync(this.localStoragePath, { recursive: true });
        this.logger.log(`Local storage directory created: ${this.localStoragePath}`);
      }
    } catch (error) {
      this.logger.error('Failed to create local storage directory', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
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
    const ext = originalName.split('.').pop() || '';
    const name = `${uuid()}.${ext}`;

    if (this.useLocalStorage) {
      return this.uploadLocal(buffer, name, mimeType);
    }

    if (!this.client) {
      throw new Error('Storage not configured');
    }

    await this.client.putObject(this.bucket, name, buffer, buffer.length, {
      'Content-Type': mimeType,
    });

    const url = await this.getUrl(name);

    return { name, url };
  }

  private async uploadLocal(
    buffer: Buffer,
    name: string,
    mimeType: string,
  ): Promise<{ name: string; url: string }> {
    const filePath = path.join(this.localStoragePath, name);

    await fs.promises.writeFile(filePath, buffer);

    // Store mime type in a sidecar file for later retrieval
    const metaPath = `${filePath}.meta`;
    await fs.promises.writeFile(metaPath, JSON.stringify({ mimeType }));

    this.logger.log(`File saved locally: ${name}`);

    const url = `${this.apiBaseUrl}/api/files/local/${name}`;
    return { name, url };
  }

  async getUrl(name: string): Promise<string> {
    if (this.useLocalStorage) {
      return `${this.apiBaseUrl}/api/files/local/${name}`;
    }

    if (!this.client) {
      throw new Error('Storage not configured');
    }

    // Generate presigned URL valid for 7 days
    return this.client.presignedGetObject(this.bucket, name, 7 * 24 * 60 * 60);
  }

  async getLocalFile(name: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    if (!this.useLocalStorage) {
      return null;
    }

    const filePath = path.join(this.localStoragePath, name);
    const metaPath = `${filePath}.meta`;

    try {
      const buffer = await fs.promises.readFile(filePath);
      let mimeType = 'application/octet-stream';

      try {
        const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf-8'));
        mimeType = meta.mimeType || mimeType;
      } catch {
        // Meta file might not exist for older files
      }

      return { buffer, mimeType };
    } catch {
      return null;
    }
  }

  isLocalStorage(): boolean {
    return this.useLocalStorage;
  }

  async delete(name: string): Promise<void> {
    if (this.useLocalStorage) {
      const filePath = path.join(this.localStoragePath, name);
      const metaPath = `${filePath}.meta`;

      try {
        await fs.promises.unlink(filePath);
        await fs.promises.unlink(metaPath).catch(() => {});
        this.logger.log(`Local file deleted: ${name}`);
      } catch (error) {
        this.logger.error('Failed to delete local file', {
          name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }

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
