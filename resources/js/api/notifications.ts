import api from './client';
import type { Notification, Paginated } from '../types';

export const notificationsApi = {
    list: () => api.get<{ data: Paginated<Notification>; unread_count: number }>('/notifications').then((r) => r.data),
    read: (id: number) => api.post(`/notifications/${id}/read`),
    readAll: () => api.post('/notifications/read-all'),
};