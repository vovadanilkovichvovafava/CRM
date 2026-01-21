import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';
import { FieldType, Prisma } from '../../../generated/prisma';

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: 'none' | 'lowercase' | 'uppercase' | 'trim';
}

export interface ImportPreview {
  totalRows: number;
  headers: string[];
  sampleData: Record<string, string>[];
  suggestedMappings: ColumnMapping[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx';
  fields?: string[];
  filters?: Record<string, unknown>;
}

@Injectable()
export class ImportExportService {
  private readonly logger = new Logger(ImportExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse uploaded file and return preview data
   */
  async parseFile(
    buffer: Buffer,
    filename: string,
  ): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    const extension = filename.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      return this.parseCsv(buffer);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return this.parseExcel(buffer);
    } else {
      throw new BadRequestException(
        'Unsupported file format. Please upload CSV or Excel file.',
      );
    }
  }

  private parseCsv(buffer: Buffer): { headers: string[]; rows: Record<string, string>[] } {
    try {
      const content = buffer.toString('utf-8');
      const records = parse(content, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      }) as Record<string, string>[];

      if (records.length === 0) {
        throw new BadRequestException('CSV file is empty or has no data rows');
      }

      const headers = Object.keys(records[0]);
      return { headers, rows: records };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to parse CSV', { error });
      throw new BadRequestException('Failed to parse CSV file. Check file format.');
    }
  }

  private async parseExcel(buffer: Buffer): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    try {
      const workbook = new ExcelJS.Workbook();
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      await workbook.xlsx.read(stream);

      const worksheet = workbook.worksheets[0];
      if (!worksheet || worksheet.rowCount < 2) {
        throw new BadRequestException('Excel file is empty or has no data rows');
      }

      const headers: string[] = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || `Column${colNumber}`);
      });

      const rows: Record<string, string>[] = [];
      for (let i = 2; i <= worksheet.rowCount; i++) {
        const row = worksheet.getRow(i);
        const record: Record<string, string> = {};
        let hasData = false;

        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber - 1];
          if (header) {
            const value = cell.value;
            record[header] = value !== null && value !== undefined ? String(value) : '';
            if (record[header]) hasData = true;
          }
        });

        // Only add rows with data
        if (hasData) {
          // Fill missing headers with empty strings
          headers.forEach((h) => {
            if (!(h in record)) record[h] = '';
          });
          rows.push(record);
        }
      }

      return { headers, rows };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Failed to parse Excel', { error });
      throw new BadRequestException('Failed to parse Excel file. Check file format.');
    }
  }

  /**
   * Get preview for import with suggested field mappings
   */
  async getImportPreview(
    objectId: string,
    buffer: Buffer,
    filename: string,
  ): Promise<ImportPreview> {
    // Get object and its fields
    const object = await this.prisma.object.findUnique({
      where: { id: objectId },
      include: { fields: { orderBy: { position: 'asc' } } },
    });

    if (!object) {
      throw new NotFoundException('Object not found');
    }

    // Parse file
    const { headers, rows } = await this.parseFile(buffer, filename);

    // Suggest mappings based on header names
    const suggestedMappings = this.suggestMappings(headers, object.fields);

    // Return preview with sample data
    return {
      totalRows: rows.length,
      headers,
      sampleData: rows.slice(0, 5),
      suggestedMappings,
    };
  }

  /**
   * Suggest field mappings based on column names
   */
  private suggestMappings(
    headers: string[],
    fields: Array<{ name: string; displayName: string; type: FieldType }>,
  ): ColumnMapping[] {
    return headers.map((header) => {
      const normalizedHeader = header.toLowerCase().replace(/[_\s-]+/g, '');

      // Try to find matching field
      const matchedField = fields.find((f) => {
        const normalizedName = f.name.toLowerCase().replace(/[_\s-]+/g, '');
        const normalizedDisplay = f.displayName.toLowerCase().replace(/[_\s-]+/g, '');
        return (
          normalizedName === normalizedHeader ||
          normalizedDisplay === normalizedHeader ||
          normalizedName.includes(normalizedHeader) ||
          normalizedHeader.includes(normalizedName)
        );
      });

      return {
        sourceColumn: header,
        targetField: matchedField?.name || '',
        transform: 'trim' as const,
      };
    });
  }

  /**
   * Import records from parsed data
   */
  async importRecords(
    objectId: string,
    rows: Record<string, string>[],
    mappings: ColumnMapping[],
    userId: string,
    options: { skipDuplicates?: boolean; updateExisting?: boolean } = {},
  ): Promise<ImportResult> {
    // Get object and its fields
    const object = await this.prisma.object.findUnique({
      where: { id: objectId },
      include: { fields: true },
    });

    if (!object) {
      throw new NotFoundException('Object not found');
    }

    const fieldMap = new Map(object.fields.map((f) => [f.name, f]));
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    // Find unique fields for duplicate detection
    const uniqueFields = object.fields.filter((f) => f.isUnique);
    const mappedUniqueFields = mappings.filter(
      (m) => m.targetField && uniqueFields.some((f) => f.name === m.targetField),
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // Account for header row

      try {
        // Build record data
        const data: Record<string, Prisma.InputJsonValue | null> = {};

        for (const mapping of mappings) {
          if (!mapping.targetField) continue;

          const field = fieldMap.get(mapping.targetField);
          if (!field) continue;

          let value: unknown = row[mapping.sourceColumn] || '';

          // Apply transform
          if (typeof value === 'string') {
            switch (mapping.transform) {
              case 'lowercase':
                value = value.toLowerCase();
                break;
              case 'uppercase':
                value = value.toUpperCase();
                break;
              case 'trim':
                value = value.trim();
                break;
            }
          }

          // Convert value based on field type
          const convertedValue = this.convertValue(value as string, field.type);

          // Validate required fields
          if (field.isRequired && (convertedValue === null || convertedValue === undefined || convertedValue === '')) {
            throw new Error(`Field "${field.displayName}" is required`);
          }

          data[mapping.targetField] = convertedValue as Prisma.InputJsonValue | null;
        }

        // Check for duplicates if we have unique fields mapped
        if (mappedUniqueFields.length > 0 && (options.skipDuplicates || options.updateExisting)) {
          const whereConditions = mappedUniqueFields.map((m) => ({
            data: {
              path: [m.targetField],
              equals: data[m.targetField] as Prisma.InputJsonValue,
            },
          }));

          const existing = await this.prisma.record.findFirst({
            where: {
              objectId,
              OR: whereConditions,
            },
          });

          if (existing) {
            if (options.skipDuplicates) {
              result.failed++;
              result.errors.push({ row: rowNumber, error: 'Duplicate record, skipped' });
              continue;
            }

            if (options.updateExisting) {
              const existingData = existing.data as Record<string, Prisma.InputJsonValue>;
              const mergedData = { ...existingData, ...data } as Prisma.InputJsonValue;
              await this.prisma.record.update({
                where: { id: existing.id },
                data: { data: mergedData },
              });
              result.success++;
              continue;
            }
          }
        }

        // Create record
        await this.prisma.record.create({
          data: {
            objectId,
            data: data as Prisma.InputJsonValue,
            ownerId: userId,
            createdBy: userId,
            updatedBy: userId,
          },
        });

        result.success++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : String(error),
        });

        // Stop if too many errors
        if (result.errors.length >= 100) {
          this.logger.warn('Import stopped due to too many errors', {
            objectId,
            errors: result.errors.length,
          });
          break;
        }
      }
    }

    this.logger.log('Import completed', {
      objectId,
      success: result.success,
      failed: result.failed,
    });

    return result;
  }

  /**
   * Convert string value to appropriate type
   */
  private convertValue(value: string, fieldType: FieldType): unknown {
    if (!value) return null;

    switch (fieldType) {
      case 'NUMBER':
        const num = parseInt(value, 10);
        return isNaN(num) ? null : num;

      case 'DECIMAL':
      case 'CURRENCY':
      case 'PERCENT':
        const dec = parseFloat(value.replace(/[,$%]/g, ''));
        return isNaN(dec) ? null : dec;

      case 'BOOLEAN':
        const lower = value.toLowerCase();
        return ['true', 'yes', '1', 'да'].includes(lower);

      case 'DATE':
      case 'DATETIME':
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();

      case 'MULTI_SELECT':
        return value.split(/[,;]/).map((v) => v.trim()).filter(Boolean);

      case 'RATING':
        const rating = parseInt(value, 10);
        return isNaN(rating) ? null : Math.min(Math.max(rating, 0), 5);

      default:
        return value;
    }
  }

  /**
   * Export records to CSV or Excel
   */
  async exportRecords(
    objectId: string,
    options: ExportOptions,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    // Get object and fields
    const object = await this.prisma.object.findUnique({
      where: { id: objectId },
      include: { fields: { orderBy: { position: 'asc' } } },
    });

    if (!object) {
      throw new NotFoundException('Object not found');
    }

    // Build field list
    let fieldsToExport = object.fields;
    if (options.fields && options.fields.length > 0) {
      fieldsToExport = object.fields.filter((f) => options.fields!.includes(f.name));
    }

    // Fetch records
    const records = await this.prisma.record.findMany({
      where: {
        objectId,
        isArchived: false,
        ...(options.filters || {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 10000, // Limit to 10k records
    });

    // Prepare data for export
    const rows = records.map((record) => {
      const row: Record<string, string> = { id: record.id };
      const data = record.data as Record<string, unknown>;

      for (const field of fieldsToExport) {
        const value = data[field.name];
        row[field.displayName] = this.formatExportValue(value, field.type);
      }

      row['Created At'] = record.createdAt.toISOString();
      return row;
    });

    // Generate file
    if (options.format === 'xlsx') {
      return this.generateExcel(rows, object.displayName);
    } else {
      return this.generateCsv(rows, object.displayName);
    }
  }

  /**
   * Format value for export
   */
  private formatExportValue(value: unknown, fieldType: FieldType): string {
    if (value === null || value === undefined) return '';

    switch (fieldType) {
      case 'BOOLEAN':
        return value ? 'Yes' : 'No';

      case 'MULTI_SELECT':
        return Array.isArray(value) ? value.join(', ') : String(value);

      case 'DATE':
      case 'DATETIME':
        if (typeof value === 'string') {
          const date = new Date(value);
          return isNaN(date.getTime()) ? value : date.toISOString().split('T')[0];
        }
        return String(value);

      case 'CURRENCY':
        return typeof value === 'number' ? value.toFixed(2) : String(value);

      case 'PERCENT':
        return typeof value === 'number' ? `${value}%` : String(value);

      default:
        return String(value);
    }
  }

  private generateCsv(
    rows: Record<string, string>[],
    objectName: string,
  ): { buffer: Buffer; filename: string; mimeType: string } {
    if (rows.length === 0) {
      throw new BadRequestException('No records to export');
    }

    const csv = stringify(rows, {
      header: true,
      quoted_string: true,
    });

    const timestamp = new Date().toISOString().split('T')[0];
    return {
      buffer: Buffer.from(csv, 'utf-8'),
      filename: `${objectName}-export-${timestamp}.csv`,
      mimeType: 'text/csv',
    };
  }

  private async generateExcel(
    rows: Record<string, string>[],
    objectName: string,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    if (rows.length === 0) {
      throw new BadRequestException('No records to export');
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CRM Export';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet(objectName);

    // Add headers
    const headers = Object.keys(rows[0]);
    worksheet.columns = headers.map((h) => ({
      header: h,
      key: h,
      width: Math.max(15, h.length + 2),
    }));

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    rows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const timestamp = new Date().toISOString().split('T')[0];

    return {
      buffer: Buffer.from(buffer),
      filename: `${objectName}-export-${timestamp}.xlsx`,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }

  /**
   * Get available objects for import/export
   */
  async getAvailableObjects() {
    const objects = await this.prisma.object.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        name: true,
        displayName: true,
        icon: true,
        _count: { select: { records: true } },
      },
      orderBy: { position: 'asc' },
    });

    return objects.map((o) => ({
      id: o.id,
      name: o.name,
      displayName: o.displayName,
      icon: o.icon,
      recordCount: o._count.records,
    }));
  }

  /**
   * Get fields for an object (for mapping UI)
   */
  async getObjectFields(objectId: string) {
    const object = await this.prisma.object.findUnique({
      where: { id: objectId },
      include: {
        fields: {
          orderBy: { position: 'asc' },
          select: {
            name: true,
            displayName: true,
            type: true,
            isRequired: true,
            isUnique: true,
          },
        },
      },
    });

    if (!object) {
      throw new NotFoundException('Object not found');
    }

    return object.fields;
  }
}
