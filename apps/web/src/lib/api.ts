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
};

export { ApiError };
