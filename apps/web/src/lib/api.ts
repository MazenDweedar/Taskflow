export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

export class ApiException extends Error {
  statusCode: number;
  messages: string[];
  error: string;

  constructor(data: ApiError) {
    const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
    super(msg);
    this.name = 'ApiException';
    this.statusCode = data.statusCode;
    this.messages = Array.isArray(data.message) ? data.message : [data.message];
    this.error = data.error;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include', // Always send cookies as fallback
  });

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiException(data as ApiError);
  }

  return data as T;
}

// ==============================
// AUTH
// ==============================

export const api = {
  auth: {
    register: async (credentials: any) => {
      return fetchApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    login: async (credentials: any) => {
      const data = await fetchApi<any>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (typeof window !== 'undefined' && data.token) {
        localStorage.setItem('access_token', data.token);
      }
      return data;
    },
    logout: async () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
      return fetchApi('/auth/logout', {
        method: 'POST',
      });
    },
    me: async () => {
      return fetchApi('/auth/me', {
        method: 'GET',
      });
    },
  },

  // ==============================
  // PROJECTS
  // ==============================
  projects: {
    list: async () => {
      return fetchApi<any[]>('/projects', {
        method: 'GET',
      });
    },
    create: async (data: { name: string; description?: string }) => {
      return fetchApi('/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    get: async (id: string) => {
      return fetchApi(`/projects/${id}`, {
        method: 'GET',
      });
    },
    update: async (id: string, data: { name?: string; description?: string }) => {
      return fetchApi(`/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchApi(`/projects/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // ==============================
  // TASKS
  // ==============================
  tasks: {
    list: async (projectId: string, query?: { status?: string; priority?: string; search?: string }) => {
      const params = new URLSearchParams();
      if (query?.status) params.append('status', query.status);
      if (query?.priority) params.append('priority', query.priority);
      if (query?.search) params.append('search', query.search);
      
      const qs = params.toString() ? `?${params.toString()}` : '';
      return fetchApi<any[]>(`/projects/${projectId}/tasks${qs}`, {
        method: 'GET',
      });
    },
    create: async (projectId: string, data: { title: string; description?: string; status?: string; priority?: string; dueDate?: string }) => {
      return fetchApi(`/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    get: async (id: string) => {
      return fetchApi(`/tasks/${id}`, {
        method: 'GET',
      });
    },
    update: async (id: string, data: Partial<{ title: string; description: string; status: string; priority: string; dueDate: string }>) => {
      return fetchApi(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchApi(`/tasks/${id}`, {
        method: 'DELETE',
      });
    },
  }
};
