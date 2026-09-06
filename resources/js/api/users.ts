import api from './client';

export interface ManagedUser { id: number; name: string; email: string; role: string; created_at: string }
export interface UserInput { name: string; email: string; password?: string; password_confirmation?: string; role: 'admin' | 'staff' | 'viewer' }
export const usersApi = {
    list: () => api.get<{ data: ManagedUser[] }>('/users').then((r) => r.data.data),
    create: (data: UserInput) => api.post<{ data: ManagedUser }>('/users', data).then((r) => r.data.data),
    update: (id: number, data: UserInput) => api.put<{ data: ManagedUser }>(`/users/${id}`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/users/${id}`),
};