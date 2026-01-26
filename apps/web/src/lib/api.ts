// Relative URL - frontend and API served from same origin
const API_URL = '';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  let url = `${API_URL}/api${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }

  // Get token from zustand persisted storage
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('janus-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        token = parsed?.state?.token || null;
      }
    } catch (e) {
      console.error('Error reading auth token from localStorage:', e);
    }
  }

  // Debug: log token status
  if (!token) {
    console.warn(`API request to ${endpoint}: No auth token found`);
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    console.error(`API Error ${response.status} for ${endpoint}:`, data);
    throw new ApiError(response.status, response.statusText, data);
  }

  // Handle no content
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

// API Client
export const api = {
  // Auth
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ user: { id: string; email: string; name: string | null; role: string }; token: string }>(
        '/auth/login',
        { method: 'POST', body: JSON.stringify(data) },
      ),
    register: (data: { email: string; password: string; name?: string }) =>
      request<{ user: { id: string; email: string; name: string | null; role: string }; token: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(data) },
      ),
    getDevToken: () =>
      request<{ user: { id: string; email: string; name: string | null; role: string }; token: string }>(
        '/auth/dev-token',
        { method: 'POST' },
      ),
    me: () => request<{ id: string; email: string; name: string | null; role: string }>('/auth/me'),
  },

  // Objects
  objects: {
    list: (params?: { type?: string; includeArchived?: boolean }) =>
      request<{ data: unknown[]; meta: unknown }>('/objects', { params }),
    get: (id: string) => request<unknown>(`/objects/${id}`),
    getByName: (name: string) => request<unknown>(`/objects/by-name/${name}`),
    create: (data: unknown) => request<unknown>('/objects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/objects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/objects/${id}`, { method: 'DELETE' }),
    seedSystem: () => request<void>('/objects/seed-system', { method: 'POST' }),
  },

  // Fields
  fields: {
    listByObject: (objectId: string) => request<unknown[]>(`/fields/object/${objectId}`),
    get: (id: string) => request<unknown>(`/fields/${id}`),
    create: (data: unknown) => request<unknown>('/fields', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/fields/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/fields/${id}`, { method: 'DELETE' }),
  },

  // Records
  records: {
    list: (params?: {
      objectId?: string;
      ownerId?: string;
      stage?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => request<{ data: unknown[]; meta: unknown }>('/records', { params }),
    get: (id: string, include?: string[]) =>
      request<unknown>(`/records/${id}`, { params: { include: include?.join(',') } }),
    create: (data: unknown) => request<unknown>('/records', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/records/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/records/${id}`, { method: 'DELETE' }),
  },

  // Projects
  projects: {
    list: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
      request<{ data: unknown[]; meta: unknown }>('/projects', { params }),
    get: (id: string) => request<unknown>(`/projects/${id}`),
    create: (data: unknown) => request<unknown>('/projects', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
    // Project Members
    addMember: (projectId: string, userId: string, role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') =>
      request<{ id: string; projectId: string; userId: string; role: string }>(
        `/projects/${projectId}/members`,
        { method: 'POST', body: JSON.stringify({ userId, role }) }
      ),
    removeMember: (projectId: string, userId: string) =>
      request<void>(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),
  },

  // Tasks
  tasks: {
    list: (params?: {
      projectId?: string;
      assigneeId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    }) => request<{ data: unknown[]; meta: unknown }>('/tasks', { params }),
    get: (id: string) => request<unknown>(`/tasks/${id}`),
    create: (data: unknown) => request<unknown>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    move: (id: string, status: string, position: number) =>
      request<unknown>(`/tasks/${id}/move`, { method: 'POST', body: JSON.stringify({ status, position }) }),
    calendarEvents: (params: { start: string; end: string; projectId?: string }) =>
      request<Array<{
        id: string;
        title: string;
        startDate?: string;
        dueDate?: string;
        status: string;
        priority: string;
        project?: { id: string; name: string; color?: string };
      }>>('/tasks/calendar/events', { params }),
    addDependency: (id: string, dependsOnId: string, type: 'BLOCKS' | 'BLOCKED_BY' | 'RELATED' = 'BLOCKS') =>
      request<void>(`/tasks/${id}/dependencies`, { method: 'POST', body: JSON.stringify({ dependsOnId, type }) }),
    removeDependency: (id: string, dependsOnId: string) =>
      request<void>(`/tasks/${id}/dependencies/${dependsOnId}`, { method: 'DELETE' }),
  },

  // Pipelines
  pipelines: {
    listByObject: (objectId: string) => request<unknown[]>(`/pipelines/object/${objectId}`),
    get: (id: string) => request<unknown>(`/pipelines/${id}`),
    getStats: (id: string) => request<unknown[]>(`/pipelines/${id}/stats`),
    create: (data: unknown) => request<unknown>('/pipelines', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/pipelines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  // Users
  users: {
    list: () => request<unknown[]>('/users'),
    get: (id: string) => request<unknown>(`/users/${id}`),
    me: () => request<unknown>('/users/me'),
    updateMe: (data: unknown) =>
      request<unknown>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>('/users/me/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Comments
  comments: {
    listByRecord: (recordId: string) => request<unknown[]>(`/comments/record/${recordId}`),
    listByTask: (taskId: string) => request<unknown[]>(`/comments/task/${taskId}`),
    create: (data: unknown) => request<unknown>('/comments', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) =>
      request<unknown>(`/comments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/comments/${id}`, { method: 'DELETE' }),
  },

  // Activities
  activities: {
    getTimeline: (recordId: string, limit?: number) =>
      request<unknown[]>(`/activities/record/${recordId}/timeline`, { params: { limit } }),
  },

  // Relations
  relations: {
    listByRecord: (recordId: string, relationType?: string) =>
      request<Array<{
        id: string;
        fromRecordId: string;
        toRecordId: string;
        relationType: string;
        metadata: Record<string, unknown>;
        createdAt: string;
        fromRecord: {
          id: string;
          objectId: string;
          data: Record<string, unknown>;
          object: {
            id: string;
            name: string;
            displayName: string;
            icon: string | null;
            color: string | null;
          };
        };
        toRecord: {
          id: string;
          objectId: string;
          data: Record<string, unknown>;
          object: {
            id: string;
            name: string;
            displayName: string;
            icon: string | null;
            color: string | null;
          };
        };
      }>>(`/relations/record/${recordId}`, { params: relationType ? { relationType } : undefined }),
    create: (data: {
      fromRecordId: string;
      toRecordId: string;
      relationType: string;
      metadata?: Record<string, unknown>;
    }) => request<unknown>('/relations', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/relations/${id}`, { method: 'DELETE' }),
  },

  // Files
  files: {
    listByRecord: (recordId: string) =>
      request<Array<{
        id: string;
        name: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
        createdAt: string;
      }>>(`/files/record/${recordId}`),
    listByTask: (taskId: string) =>
      request<Array<{
        id: string;
        name: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
        createdAt: string;
      }>>(`/files/task/${taskId}`),
    upload: async (file: File, options: { recordId?: string; taskId?: string; projectId?: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      if (options.recordId) formData.append('recordId', options.recordId);
      if (options.taskId) formData.append('taskId', options.taskId);
      if (options.projectId) formData.append('projectId', options.projectId);

      let token: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('janus-auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            token = parsed?.state?.token || null;
          }
        } catch (e) {
          console.error('Error reading auth token:', e);
        }
      }

      const response = await fetch(`${API_URL}/api/files/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, data);
      }

      return response.json();
    },
    delete: (id: string) => request<void>(`/files/${id}`, { method: 'DELETE' }),
    getDownloadUrl: (id: string) => `${API_URL}/api/files/${id}/download`,
  },

  // Dashboard
  dashboard: {
    getStats: () =>
      request<{
        contacts: { total: number; change: number };
        companies: { total: number; change: number };
        deals: { total: number; value: number; change: number };
        tasks: { total: number; completed: number; due: number };
      }>('/dashboard/stats'),
    getRecentActivities: (limit?: number) =>
      request<Array<{
        id: string;
        type: string;
        title: string;
        description: string | null;
        recordId: string | null;
        occurredAt: string;
      }>>('/dashboard/activities', { params: { limit } }),
    getUpcomingTasks: (limit?: number) =>
      request<Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        priority: string;
        dueDate: string | null;
        project: { id: string; name: string } | null;
      }>>('/dashboard/upcoming-tasks', { params: { limit } }),
    getAnalytics: () =>
      request<{
        totalRecords: number;
        totalDealsValue: number;
        conversionRate: number;
        avgDealValue: number;
        recordsByObject: Array<{ name: string; count: number; color: string }>;
        dealsByStage: Array<{ stage: string; count: number; value: number }>;
        recordsOverTime: Array<{ date: string; count: number }>;
      }>('/dashboard/analytics'),
  },

  // Notifications
  notifications: {
    list: (params?: { unreadOnly?: boolean; limit?: number }) =>
      request<Array<{
        id: string;
        userId: string;
        type: string;
        title: string;
        message: string;
        data: Record<string, unknown> | null;
        isRead: boolean;
        createdAt: string;
      }>>('/notifications', { params }),
    getUnreadCount: () => request<{ count: number }>('/notifications/unread-count'),
    markAsRead: (id: string) =>
      request<unknown>(`/notifications/${id}/read`, { method: 'POST' }),
    markAllAsRead: () =>
      request<{ count: number }>('/notifications/read-all', { method: 'POST' }),
    delete: (id: string) => request<void>(`/notifications/${id}`, { method: 'DELETE' }),
    deleteAll: () => request<{ count: number }>('/notifications', { method: 'DELETE' }),
  },

  // Email Templates
  emailTemplates: {
    list: (params?: { category?: string; search?: string; page?: number; limit?: number }) =>
      request<{
        data: Array<{
          id: string;
          name: string;
          subject: string;
          body: string;
          category: string | null;
          isShared: boolean;
          ownerId: string;
          createdAt: string;
          updatedAt: string;
          attachments: Array<{
            id: string;
            name: string;
            originalName: string;
            mimeType: string;
            size: number;
            url: string;
          }>;
        }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>('/email-templates', { params }),
    get: (id: string) =>
      request<{
        id: string;
        name: string;
        subject: string;
        body: string;
        category: string | null;
        isShared: boolean;
        ownerId: string;
        createdAt: string;
        updatedAt: string;
        attachments: Array<{
          id: string;
          name: string;
          originalName: string;
          mimeType: string;
          size: number;
          url: string;
        }>;
      }>(`/email-templates/${id}`),
    create: (data: { name: string; subject: string; body: string; category?: string; isShared?: boolean }) =>
      request<unknown>('/email-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; subject?: string; body?: string; category?: string; isShared?: boolean }) =>
      request<unknown>(`/email-templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/email-templates/${id}`, { method: 'DELETE' }),
    duplicate: (id: string) =>
      request<unknown>(`/email-templates/${id}/duplicate`, { method: 'POST' }),
    getCategories: () => request<string[]>('/email-templates/categories'),
    preview: (template: string, data: Record<string, string>) =>
      request<{ html: string }>('/email-templates/preview', {
        method: 'POST',
        body: JSON.stringify({ template, data }),
      }),
    // Attachments
    getAttachments: (templateId: string) =>
      request<Array<{
        id: string;
        name: string;
        originalName: string;
        mimeType: string;
        size: number;
        url: string;
      }>>(`/email-templates/${templateId}/attachments`),
    uploadAttachment: async (templateId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      let token: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('janus-auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            token = parsed?.state?.token || null;
          }
        } catch (e) {
          console.error('Error reading auth token:', e);
        }
      }

      const response = await fetch(`${API_URL}/api/email-templates/${templateId}/attachments`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, data);
      }

      return response.json();
    },
    deleteAttachment: (attachmentId: string) =>
      request<void>(`/email-templates/attachments/${attachmentId}`, { method: 'DELETE' }),
    // Send emails
    send: (data: {
      templateId?: string;
      recordId?: string;
      to: string[];
      cc?: string[];
      bcc?: string[];
      subject: string;
      body: string;
      attachmentIds?: string[];
    }) => request<{ id: string; messageId?: string }>('/email-templates/send', { method: 'POST', body: JSON.stringify(data) }),
    sendFromTemplate: (templateId: string, data: {
      to: string[];
      data: Record<string, string>;
      cc?: string[];
      bcc?: string[];
      recordId?: string;
    }) => request<{ id: string; messageId?: string }>(`/email-templates/${templateId}/send`, { method: 'POST', body: JSON.stringify(data) }),
    // Email logs
    getLogs: (params?: { templateId?: string; recordId?: string; status?: string; page?: number; limit?: number }) =>
      request<{
        data: Array<{
          id: string;
          templateId: string | null;
          recordId: string | null;
          from: string;
          to: string[];
          cc: string[];
          bcc: string[];
          subject: string;
          body: string;
          status: string;
          error: string | null;
          messageId: string | null;
          sentAt: string | null;
          createdAt: string;
          template: { name: string } | null;
        }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>('/email-templates/logs', { params }),
    getLogStats: () =>
      request<{
        total: number;
        sent: number;
        delivered: number;
        opened: number;
        clicked: number;
        bounced: number;
        failed: number;
      }>('/email-templates/logs/stats'),
    getLog: (logId: string) =>
      request<{
        id: string;
        templateId: string | null;
        recordId: string | null;
        from: string;
        to: string[];
        cc: string[];
        bcc: string[];
        subject: string;
        body: string;
        status: string;
        error: string | null;
        messageId: string | null;
        sentAt: string | null;
        createdAt: string;
        template: { name: string } | null;
      }>(`/email-templates/logs/${logId}`),
  },

  // Time Entries
  timeEntries: {
    list: (params?: { taskId?: string; projectId?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
      request<{
        data: Array<{
          id: string;
          userId: string;
          taskId: string | null;
          projectId: string | null;
          recordId: string | null;
          description: string | null;
          duration: number;
          startTime: string;
          endTime: string | null;
          isBillable: boolean;
          hourlyRate: string | null;
          createdAt: string;
          task: { id: string; title: string } | null;
        }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>('/time-entries', { params }),
    get: (id: string) =>
      request<{
        id: string;
        userId: string;
        taskId: string | null;
        description: string | null;
        duration: number;
        startTime: string;
        endTime: string | null;
        isBillable: boolean;
        hourlyRate: string | null;
        task: { id: string; title: string } | null;
      }>(`/time-entries/${id}`),
    create: (data: {
      taskId?: string;
      projectId?: string;
      description?: string;
      duration: number;
      startTime: string;
      endTime?: string;
      isBillable?: boolean;
      hourlyRate?: number;
    }) => request<unknown>('/time-entries', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: {
      description?: string;
      duration?: number;
      startTime?: string;
      endTime?: string;
      isBillable?: boolean;
      hourlyRate?: number;
    }) => request<unknown>(`/time-entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/time-entries/${id}`, { method: 'DELETE' }),
    getStats: (params?: { startDate?: string; endDate?: string }) =>
      request<{
        totalMinutes: number;
        totalHours: number;
        billableMinutes: number;
        billableAmount: number;
        entriesCount: number;
      }>('/time-entries/stats', { params }),
    getActiveTimer: () =>
      request<{
        id: string;
        description: string | null;
        startTime: string;
        task: { id: string; title: string } | null;
      } | null>('/time-entries/active'),
    startTimer: (data: { taskId?: string; description?: string }) =>
      request<unknown>('/time-entries/start', { method: 'POST', body: JSON.stringify(data) }),
    stopTimer: (id: string) =>
      request<unknown>(`/time-entries/${id}/stop`, { method: 'POST' }),
  },

  // Workflows
  workflows: {
    list: (params?: { objectId?: string; isActive?: boolean; search?: string; page?: number; limit?: number }) =>
      request<{
        data: Array<{
          id: string;
          name: string;
          description: string | null;
          objectId: string;
          trigger: string;
          conditions: unknown[];
          actions: unknown[];
          isActive: boolean;
          createdBy: string;
          createdAt: string;
          updatedAt: string;
          object: { id: string; name: string; displayName: string; icon: string | null };
          _count: { executions: number };
        }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>('/workflows', { params }),
    get: (id: string) =>
      request<{
        id: string;
        name: string;
        description: string | null;
        objectId: string;
        trigger: string;
        conditions: unknown[];
        actions: unknown[];
        isActive: boolean;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        object: { id: string; name: string; displayName: string; icon: string | null };
        executions: Array<{
          id: string;
          status: string;
          result: unknown;
          error: string | null;
          executedAt: string;
        }>;
      }>(`/workflows/${id}`),
    create: (data: {
      name: string;
      description?: string;
      objectId: string;
      trigger: string;
      conditions: unknown[];
      actions: unknown[];
      isActive?: boolean;
    }) => request<unknown>('/workflows', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: {
      name?: string;
      description?: string;
      trigger?: string;
      conditions?: unknown[];
      actions?: unknown[];
      isActive?: boolean;
    }) => request<unknown>(`/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/workflows/${id}`, { method: 'DELETE' }),
    toggle: (id: string) =>
      request<unknown>(`/workflows/${id}/toggle`, { method: 'POST' }),
    duplicate: (id: string) =>
      request<unknown>(`/workflows/${id}/duplicate`, { method: 'POST' }),
    test: (id: string, recordId: string) =>
      request<{
        workflowId: string;
        status: string;
        actionsExecuted: number;
        results: Array<{
          actionId: string;
          actionType: string;
          success: boolean;
          result?: string;
          error?: string;
        }>;
      }>(`/workflows/${id}/test`, { method: 'POST', body: JSON.stringify({ recordId }) }),
    getExecutions: (id: string, params?: { page?: number; limit?: number }) =>
      request<{
        data: Array<{
          id: string;
          workflowId: string;
          recordId: string | null;
          status: string;
          result: unknown;
          error: string | null;
          executedAt: string;
        }>;
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/workflows/${id}/executions`, { params }),
    // Meta endpoints
    getTriggers: () =>
      request<Array<{
        value: string;
        label: string;
        description: string;
        icon: string;
      }>>('/workflows/meta/triggers'),
    getActions: () =>
      request<Array<{
        type: string;
        name: string;
        description: string;
        configSchema: Record<string, unknown>;
      }>>('/workflows/meta/actions'),
    getOperators: () =>
      request<Array<{
        value: string;
        label: string;
        types: string[];
      }>>('/workflows/meta/operators'),
    getVariables: (trigger: string) =>
      request<Array<{
        name: string;
        description: string;
        example: string;
      }>>(`/workflows/meta/variables/${trigger}`),
  },

  // System Settings
  systemSettings: {
    get: () =>
      request<{
        resend_api_key?: string;
        email_from?: string;
        telegram_bot_token?: string;
        telegram_chat_id?: string;
      }>('/system-settings'),
    update: (data: {
      resend_api_key?: string;
      email_from?: string;
      telegram_bot_token?: string;
      telegram_chat_id?: string;
    }) =>
      request<{ updated: string[] }>('/system-settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    getStatus: () =>
      request<{
        email: boolean;
        telegram: boolean;
      }>('/system-settings/status'),
  },

  // Import/Export
  importExport: {
    getObjects: () =>
      request<
        Array<{
          id: string;
          name: string;
          displayName: string;
          icon: string | null;
          recordCount: number;
        }>
      >('/import-export/objects'),

    getObjectFields: (objectId: string) =>
      request<
        Array<{
          name: string;
          displayName: string;
          type: string;
          isRequired: boolean;
          isUnique: boolean;
        }>
      >(`/import-export/objects/${objectId}/fields`),

    uploadPreview: async (objectId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Get token from zustand persisted storage
      let token: string | null = null;
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('janus-auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            token = parsed?.state?.token || null;
          }
        } catch (e) {
          console.error('Error reading auth token:', e);
        }
      }

      const response = await fetch(`/api/import-export/preview/${objectId}`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, response.statusText, data);
      }

      return response.json() as Promise<{
        totalRows: number;
        headers: string[];
        sampleData: Record<string, string>[];
        suggestedMappings: Array<{
          sourceColumn: string;
          targetField: string;
          transform?: string;
        }>;
      }>;
    },

    import: (data: {
      objectId: string;
      rows: Record<string, string>[];
      mappings: Array<{
        sourceColumn: string;
        targetField: string;
        transform?: string;
      }>;
      options?: {
        skipDuplicates?: boolean;
        updateExisting?: boolean;
      };
    }) =>
      request<{
        success: number;
        failed: number;
        errors: Array<{ row: number; error: string }>;
      }>('/import-export/import', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    exportUrl: (objectId: string, format: 'csv' | 'xlsx' = 'csv') =>
      `/api/import-export/export/${objectId}?format=${format}`,
  },

  // Lead Scoring
  leadScoring: {
    getRules: () =>
      request<
        Array<{
          id: string;
          name: string;
          category: string;
          field: string;
          operator: string;
          value: string | number | boolean | string[];
          score: number;
          maxScore: number;
        }>
      >('/lead-scoring/rules'),

    getScore: (recordId: string) =>
      request<{
        recordId: string;
        totalScore: number;
        grade: string;
        factors: {
          demographic: { score: number; maxScore: number; details: Array<{ rule: string; field: string; matched: boolean; score: number; reason?: string }> };
          firmographic: { score: number; maxScore: number; details: Array<{ rule: string; field: string; matched: boolean; score: number; reason?: string }> };
          behavioral: { score: number; maxScore: number; details: Array<{ rule: string; field: string; matched: boolean; score: number; reason?: string }> };
          engagement: { score: number; maxScore: number; details: Array<{ rule: string; field: string; matched: boolean; score: number; reason?: string }> };
          bant: { score: number; maxScore: number; details: Array<{ rule: string; field: string; matched: boolean; score: number; reason?: string }> };
        };
        calculatedAt: string;
      } | null>(`/lead-scoring/record/${recordId}`),

    calculateScore: (recordId: string) =>
      request<{
        recordId: string;
        totalScore: number;
        grade: string;
        calculatedAt: string;
      }>(`/lead-scoring/record/${recordId}/calculate`, { method: 'POST' }),

    recalculateAll: (objectId: string) =>
      request<{ processed: number; errors: number }>(
        `/lead-scoring/object/${objectId}/recalculate`,
        { method: 'POST' },
      ),

    getDistribution: (objectId: string) =>
      request<Record<string, number>>(`/lead-scoring/object/${objectId}/distribution`),

    getLeadsByGrade: (objectId: string, grade: string, limit?: number) =>
      request<Array<{ recordId: string; totalScore: number; calculatedAt: string }>>(
        `/lead-scoring/object/${objectId}/leads`,
        { params: { grade, ...(limit ? { limit } : {}) } },
      ),

    getGradeThresholds: () => request<Record<string, number>>('/lead-scoring/grades'),
  },

  // Webmaster Scoring
  webmasterScoring: {
    getScore: (recordId: string) =>
      request<{
        recordId: string;
        volumeScore: number;
        qualityScore: number;
        reliabilityScore: number;
        communicationScore: number;
        totalScore: number;
        grade: string;
        gradeColor: string;
        factors: {
          volume: { score: number; maxScore: number; metrics: { leadsPerDay: number; leadsTotal: number; activeDays: number; trend: string } };
          quality: { score: number; maxScore: number; metrics: { conversionRate: number; approveRate: number; rejectRate: number; holdRate: number; avgLeadValue: number } };
          reliability: { score: number; maxScore: number; metrics: { uptime: number; consistency: number; lastActivityDays: number; fraudIncidents: number } };
          communication: { score: number; maxScore: number; metrics: { responseTime: number; activityCount: number; lastContactDays: number; hasMessenger: boolean } };
        };
        calculatedAt: string;
      } | null>(`/webmaster-scoring/record/${recordId}`),

    calculateScore: (recordId: string) =>
      request<{
        recordId: string;
        totalScore: number;
        grade: string;
        gradeColor: string;
        calculatedAt: string;
      }>(`/webmaster-scoring/record/${recordId}/calculate`, { method: 'POST' }),

    recalculateAll: (objectId: string) =>
      request<{ processed: number; errors: number }>(
        `/webmaster-scoring/object/${objectId}/recalculate`,
        { method: 'POST' },
      ),

    getDistribution: (objectId: string) =>
      request<Record<string, number>>(`/webmaster-scoring/object/${objectId}/distribution`),

    getTopWebmasters: (objectId: string, limit?: number) =>
      request<Array<{ recordId: string; totalScore: number; grade: string }>>(
        `/webmaster-scoring/object/${objectId}/top`,
        { params: limit ? { limit } : {} },
      ),

    getByGrade: (objectId: string, grade: string, limit?: number) =>
      request<Array<{ recordId: string; totalScore: number }>>(
        `/webmaster-scoring/object/${objectId}/by-grade`,
        { params: { grade, ...(limit ? { limit } : {}) } },
      ),

    getGrades: () =>
      request<Record<string, { min: number; label: string; color: string }>>('/webmaster-scoring/grades'),

    getCategoryWeights: () =>
      request<Record<string, number>>('/webmaster-scoring/category-weights'),
  },
};

export { ApiError };
