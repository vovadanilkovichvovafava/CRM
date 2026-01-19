// Object Types
export type ObjectType = 'SYSTEM' | 'CUSTOM';

export interface CrmObject {
  id: string;
  name: string;
  displayName: string;
  type: ObjectType;
  icon?: string;
  color?: string;
  schema: Record<string, unknown>;
  settings: Record<string, unknown>;
  position: number;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  fields?: Field[];
  _count?: {
    fields: number;
    records: number;
  };
}

// Field Types
export type FieldType =
  | 'TEXT'
  | 'LONG_TEXT'
  | 'NUMBER'
  | 'DECIMAL'
  | 'EMAIL'
  | 'PHONE'
  | 'URL'
  | 'DATE'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'SELECT'
  | 'MULTI_SELECT'
  | 'RELATION'
  | 'FORMULA'
  | 'FILE'
  | 'CURRENCY'
  | 'PERCENT'
  | 'RATING'
  | 'USER';

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

export interface FieldConfig {
  options?: SelectOption[];
  relatedObjectId?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  currency?: string;
  formula?: string;
  placeholder?: string;
  helpText?: string;
}

export interface Field {
  id: string;
  objectId: string;
  name: string;
  displayName: string;
  type: FieldType;
  config: FieldConfig;
  isRequired: boolean;
  isUnique: boolean;
  defaultValue?: string;
  position: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Record Types
export interface Record {
  id: string;
  objectId: string;
  data: Record<string, unknown>;
  ownerId: string;
  score?: number;
  stage?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  object?: CrmObject;
  _count?: {
    activities: number;
    comments: number;
    files: number;
    tasks: number;
  };
}

// Project Types
export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type Priority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  recordId?: string;
  ownerId: string;
  teamIds: string[];
  progress: number;
  budget?: number;
  timeEstimate?: number;
  timeSpent: number;
  color?: string;
  emoji?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    members: number;
  };
}

// Task Types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'DONE' | 'CANCELLED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  projectId?: string;
  parentId?: string;
  assigneeId?: string;
  recordId?: string;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  timeEstimate?: number;
  timeSpent: number;
  position: number;
  labels: string[];
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  project?: { id: string; name: string; color?: string };
  _count?: {
    subtasks: number;
    comments: number;
    files: number;
    checklist: number;
  };
}

// Pipeline Types
export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  probability?: number;
}

export interface Pipeline {
  id: string;
  name: string;
  objectId: string;
  stages: PipelineStage[];
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

// User Types
export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  role: UserRole;
  timezone: string;
  locale: string;
  preferences: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
