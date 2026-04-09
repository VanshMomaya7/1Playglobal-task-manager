import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const api = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse {
  data: Task[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: string;
}

export const tasksApi = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get<PaginatedResponse>('/tasks', { params }).then((r) => r.data),

  getOne: (id: number) =>
    api.get<Task>(`/tasks/${id}`).then((r) => r.data),

  create: (payload: CreateTaskPayload) =>
    api.post<Task>('/tasks', payload).then((r) => r.data),

  update: (id: number, payload: UpdateTaskPayload) =>
    api.patch<Task>(`/tasks/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    api.delete<{ message: string }>(`/tasks/${id}`).then((r) => r.data),
};
