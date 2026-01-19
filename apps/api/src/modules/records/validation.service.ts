import { Injectable, BadRequestException } from '@nestjs/common';
import { Field, FieldType } from '../../../generated/prisma';

interface FieldConfig {
  options?: Array<{ value: string; label: string }>;
  relatedObjectId?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  maxRating?: number;
  allowedTypes?: string[];
  maxSize?: number;
}

@Injectable()
export class ValidationService {
  /**
   * Validate record data against field definitions
   */
  validateData(data: Record<string, unknown>, fields: Field[]): void {
    const errors: string[] = [];

    for (const field of fields) {
      const value = data[field.name];
      const config = field.config as FieldConfig;

      // Check required fields
      if (field.isRequired && (value === undefined || value === null || value === '')) {
        errors.push(`Field "${field.displayName}" is required`);
        continue;
      }

      // Skip validation if value is empty and not required
      if (value === undefined || value === null || value === '') {
        continue;
      }

      // Type-specific validation
      const error = this.validateFieldValue(field.type, value, config, field.displayName);
      if (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
  }

  /**
   * Validate a single field value
   */
  private validateFieldValue(
    type: FieldType,
    value: unknown,
    config: FieldConfig,
    displayName: string,
  ): string | null {
    switch (type) {
      case FieldType.TEXT:
      case FieldType.LONG_TEXT:
        return this.validateText(value, config, displayName);

      case FieldType.EMAIL:
        return this.validateEmail(value, displayName);

      case FieldType.PHONE:
        return this.validatePhone(value, displayName);

      case FieldType.URL:
        return this.validateUrl(value, displayName);

      case FieldType.NUMBER:
      case FieldType.DECIMAL:
      case FieldType.CURRENCY:
      case FieldType.PERCENT:
        return this.validateNumber(value, config, displayName);

      case FieldType.DATE:
      case FieldType.DATETIME:
        return this.validateDate(value, displayName);

      case FieldType.BOOLEAN:
        return this.validateBoolean(value, displayName);

      case FieldType.SELECT:
        return this.validateSelect(value, config, displayName);

      case FieldType.MULTI_SELECT:
        return this.validateMultiSelect(value, config, displayName);

      case FieldType.RATING:
        return this.validateRating(value, config, displayName);

      case FieldType.RELATION:
      case FieldType.USER:
        return this.validateRelation(value, displayName);

      default:
        return null;
    }
  }

  private validateText(
    value: unknown,
    config: FieldConfig,
    displayName: string,
  ): string | null {
    if (typeof value !== 'string') {
      return `${displayName} must be a string`;
    }

    if (config.minLength && value.length < config.minLength) {
      return `${displayName} must be at least ${config.minLength} characters`;
    }

    if (config.maxLength && value.length > config.maxLength) {
      return `${displayName} must be at most ${config.maxLength} characters`;
    }

    if (config.pattern) {
      const regex = new RegExp(config.pattern);
      if (!regex.test(value)) {
        return `${displayName} has invalid format`;
      }
    }

    return null;
  }

  private validateEmail(value: unknown, displayName: string): string | null {
    if (typeof value !== 'string') {
      return `${displayName} must be a string`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `${displayName} must be a valid email address`;
    }

    return null;
  }

  private validatePhone(value: unknown, displayName: string): string | null {
    if (typeof value !== 'string') {
      return `${displayName} must be a string`;
    }

    // Basic phone validation - allows various formats
    const phoneRegex = /^[+]?[\d\s\-().]{7,20}$/;
    if (!phoneRegex.test(value)) {
      return `${displayName} must be a valid phone number`;
    }

    return null;
  }

  private validateUrl(value: unknown, displayName: string): string | null {
    if (typeof value !== 'string') {
      return `${displayName} must be a string`;
    }

    try {
      new URL(value);
      return null;
    } catch {
      return `${displayName} must be a valid URL`;
    }
  }

  private validateNumber(
    value: unknown,
    config: FieldConfig,
    displayName: string,
  ): string | null {
    if (typeof value !== 'number' || isNaN(value)) {
      return `${displayName} must be a number`;
    }

    if (config.min !== undefined && value < config.min) {
      return `${displayName} must be at least ${config.min}`;
    }

    if (config.max !== undefined && value > config.max) {
      return `${displayName} must be at most ${config.max}`;
    }

    return null;
  }

  private validateDate(value: unknown, displayName: string): string | null {
    if (typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return `${displayName} must be a valid date`;
      }
      return null;
    }

    if (value instanceof Date && !isNaN(value.getTime())) {
      return null;
    }

    return `${displayName} must be a valid date`;
  }

  private validateBoolean(value: unknown, displayName: string): string | null {
    if (typeof value !== 'boolean') {
      return `${displayName} must be a boolean`;
    }
    return null;
  }

  private validateSelect(
    value: unknown,
    config: FieldConfig,
    displayName: string,
  ): string | null {
    if (typeof value !== 'string') {
      return `${displayName} must be a string`;
    }

    if (config.options) {
      const validValues = config.options.map((o) => o.value);
      if (!validValues.includes(value)) {
        return `${displayName} must be one of: ${validValues.join(', ')}`;
      }
    }

    return null;
  }

  private validateMultiSelect(
    value: unknown,
    config: FieldConfig,
    displayName: string,
  ): string | null {
    if (!Array.isArray(value)) {
      return `${displayName} must be an array`;
    }

    if (config.options) {
      const validValues = config.options.map((o) => o.value);
      for (const item of value) {
        if (typeof item !== 'string' || !validValues.includes(item)) {
          return `${displayName} contains invalid value: ${item}`;
        }
      }
    }

    return null;
  }

  private validateRating(
    value: unknown,
    config: FieldConfig,
    displayName: string,
  ): string | null {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      return `${displayName} must be an integer`;
    }

    const maxRating = config.maxRating || 5;
    if (value < 1 || value > maxRating) {
      return `${displayName} must be between 1 and ${maxRating}`;
    }

    return null;
  }

  private validateRelation(value: unknown, displayName: string): string | null {
    if (typeof value !== 'string' && !Array.isArray(value)) {
      return `${displayName} must be a string ID or array of IDs`;
    }

    if (Array.isArray(value)) {
      for (const id of value) {
        if (typeof id !== 'string') {
          return `${displayName} contains invalid ID`;
        }
      }
    }

    return null;
  }
}
