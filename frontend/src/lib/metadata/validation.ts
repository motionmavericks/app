export interface ValidationRule {
  field: string;
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number | RegExp;
  message: string;
  validator?: (value: string | number | boolean | string[]) => boolean;
}

export interface CustomFieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect' | 'textarea' | 'url' | 'email';
  label: string;
  description?: string;
  required?: boolean;
  options?: string[]; // For select/multiselect types
  validation?: ValidationRule[];
  defaultValue?: string | number | boolean | string[];
  placeholder?: string;
}

export interface MetadataSchema {
  id: string;
  name: string;
  description?: string;
  fields: CustomFieldDefinition[];
  standards: 'dublin-core' | 'exif' | 'iptc' | 'custom' | 'mixed';
  version: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: string | number | boolean | string[];
}

// Dublin Core metadata fields
export const DUBLIN_CORE_FIELDS: CustomFieldDefinition[] = [
  {
    id: 'dc_title',
    name: 'dc:title',
    type: 'text',
    label: 'Title',
    required: true,
    description: 'The name of the resource'
  },
  {
    id: 'dc_creator',
    name: 'dc:creator',
    type: 'text',
    label: 'Creator',
    description: 'The entity responsible for creating the resource'
  },
  {
    id: 'dc_subject',
    name: 'dc:subject',
    type: 'multiselect',
    label: 'Subject/Keywords',
    description: 'The topic or keywords describing the resource'
  },
  {
    id: 'dc_description',
    name: 'dc:description',
    type: 'textarea',
    label: 'Description',
    description: 'An account of the resource content'
  },
  {
    id: 'dc_publisher',
    name: 'dc:publisher',
    type: 'text',
    label: 'Publisher',
    description: 'The entity responsible for making the resource available'
  },
  {
    id: 'dc_contributor',
    name: 'dc:contributor',
    type: 'text',
    label: 'Contributor',
    description: 'An entity responsible for making contributions to the resource'
  },
  {
    id: 'dc_date',
    name: 'dc:date',
    type: 'date',
    label: 'Date',
    description: 'A point or period of time associated with the resource'
  },
  {
    id: 'dc_type',
    name: 'dc:type',
    type: 'select',
    label: 'Resource Type',
    options: ['Collection', 'Dataset', 'Event', 'Image', 'InteractiveResource', 'MovingImage', 'PhysicalObject', 'Service', 'Software', 'Sound', 'StillImage', 'Text'],
    description: 'The nature or genre of the resource'
  },
  {
    id: 'dc_format',
    name: 'dc:format',
    type: 'text',
    label: 'Format',
    description: 'The file format, physical medium, or dimensions of the resource'
  },
  {
    id: 'dc_identifier',
    name: 'dc:identifier',
    type: 'text',
    label: 'Identifier',
    description: 'An unambiguous reference to the resource'
  },
  {
    id: 'dc_source',
    name: 'dc:source',
    type: 'text',
    label: 'Source',
    description: 'A related resource from which the described resource is derived'
  },
  {
    id: 'dc_language',
    name: 'dc:language',
    type: 'select',
    label: 'Language',
    options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'hi', 'ru'],
    description: 'A language of the resource'
  },
  {
    id: 'dc_relation',
    name: 'dc:relation',
    type: 'text',
    label: 'Relation',
    description: 'A related resource'
  },
  {
    id: 'dc_coverage',
    name: 'dc:coverage',
    type: 'text',
    label: 'Coverage',
    description: 'The spatial or temporal topic of the resource'
  },
  {
    id: 'dc_rights',
    name: 'dc:rights',
    type: 'textarea',
    label: 'Rights',
    description: 'Information about rights held in and over the resource'
  }
];

// Common validation rules
export const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  title: [
    { field: 'title', type: 'required', message: 'Title is required' },
    { field: 'title', type: 'minLength', value: 1, message: 'Title must not be empty' },
    { field: 'title', type: 'maxLength', value: 200, message: 'Title must be less than 200 characters' }
  ],
  email: [
    { field: 'email', type: 'pattern', value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Must be a valid email address' }
  ],
  url: [
    { field: 'url', type: 'pattern', value: /^https?:\/\/.+/, message: 'Must be a valid URL starting with http:// or https://' }
  ],
  tags: [
    { field: 'tags', type: 'custom', message: 'Tags must contain only alphanumeric characters and spaces', 
      validator: (value: string | number | boolean | string[]) => 
        Array.isArray(value) && value.every(tag => typeof tag === 'string' && /^[a-zA-Z0-9\s-_]+$/.test(tag)) }
  ]
};

export class MetadataValidator {
  private schema: MetadataSchema | null = null;
  private customRules: ValidationRule[] = [];

  constructor(schema?: MetadataSchema, customRules?: ValidationRule[]) {
    this.schema = schema || null;
    this.customRules = customRules || [];
  }

  setSchema(schema: MetadataSchema) {
    this.schema = schema;
  }

  addCustomRule(rule: ValidationRule) {
    this.customRules.push(rule);
  }

  validate(data: Record<string, string | number | boolean | string[]>): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate against schema if available
    if (this.schema) {
      for (const field of this.schema.fields) {
        const value = data[field.name] || data[field.id];
        const fieldErrors = this.validateField(field, value);
        errors.push(...fieldErrors);
      }
    }

    // Apply custom rules
    for (const rule of this.customRules) {
      const value = data[rule.field];
      const error = this.applyRule(rule, value);
      if (error) {
        errors.push(error);
      }
    }

    // Apply common validation rules
    for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
      if (data.hasOwnProperty(field)) {
        for (const rule of rules) {
          const error = this.applyRule(rule, data[field]);
          if (error) {
            errors.push(error);
          }
        }
      }
    }

    return errors;
  }

  private validateField(field: CustomFieldDefinition, value: string | number | boolean | string[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required validation
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`,
        value
      });
      return errors; // Don't continue if required field is missing
    }

    // Skip further validation if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return errors;
    }

    // Type-specific validation
    switch (field.type) {
      case 'email':
        const emailRegex = VALIDATION_RULES.email[0].value as RegExp;
        if (typeof value === 'string' && !emailRegex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid email address`,
            value
          });
        }
        break;
      case 'url':
        const urlRegex = VALIDATION_RULES.url[0].value as RegExp;
        if (typeof value === 'string' && !urlRegex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid URL`,
            value
          });
        }
        break;
      case 'number':
        if (isNaN(Number(value))) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid number`,
            value
          });
        }
        break;
      case 'date':
        if (typeof value === 'string' && isNaN(Date.parse(value))) {
          errors.push({
            field: field.name,
            message: `${field.label} must be a valid date`,
            value
          });
        }
        break;
      case 'select':
        if (field.options && typeof value === 'string' && !field.options.includes(value)) {
          errors.push({
            field: field.name,
            message: `${field.label} must be one of: ${field.options.join(', ')}`,
            value
          });
        }
        break;
      case 'multiselect':
        if (Array.isArray(value) && field.options) {
          const invalidOptions = value.filter(v => typeof v === 'string' && !field.options!.includes(v));
          if (invalidOptions.length > 0) {
            errors.push({
              field: field.name,
              message: `${field.label} contains invalid options: ${invalidOptions.join(', ')}`,
              value
            });
          }
        }
        break;
    }

    // Apply field-specific validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        const error = this.applyRule({ ...rule, field: field.name }, value);
        if (error) {
          errors.push(error);
        }
      }
    }

    return errors;
  }

  private applyRule(rule: ValidationRule, value: string | number | boolean | string[]): ValidationError | null {
    switch (rule.type) {
      case 'required':
        if (value === undefined || value === null || value === '') {
          return { field: rule.field, message: rule.message, value };
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return { field: rule.field, message: rule.message, value };
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return { field: rule.field, message: rule.message, value };
        }
        break;
      case 'pattern':
        if (typeof value === 'string' && !(rule.value as RegExp).test(value)) {
          return { field: rule.field, message: rule.message, value };
        }
        break;
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return { field: rule.field, message: rule.message, value };
        }
        break;
    }
    return null;
  }
}

// Utility functions for metadata standards
export function createDublinCoreSchema(): MetadataSchema {
  return {
    id: 'dublin-core-v1',
    name: 'Dublin Core Metadata Element Set',
    description: 'The Dublin Core Metadata Element Set is a vocabulary of fifteen properties for use in resource description.',
    fields: DUBLIN_CORE_FIELDS,
    standards: 'dublin-core',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export function validateMetadataStandards(metadata: Record<string, string | number | boolean | string[]>, standard: string): ValidationError[] {
  const validator = new MetadataValidator();
  
  switch (standard) {
    case 'dublin-core':
      validator.setSchema(createDublinCoreSchema());
      break;
    default:
      return [];
  }
  
  return validator.validate(metadata);
}

export function sanitizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

export function suggestTags(text: string, existingTags: string[] = []): string[] {
  // Simple tag suggestion based on text analysis
  const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
  
  const candidates = words
    .filter(word => !stopWords.has(word))
    .filter(word => word.length >= 3)
    .filter(word => !existingTags.includes(word))
    .slice(0, 10);
    
  return [...new Set(candidates)];
}