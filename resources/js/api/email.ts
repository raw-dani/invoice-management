import api from './client';
import type { EmailLog, EmailTemplate, Paginated } from '../types';

export const emailApi = {
    templates: () => api.get<{ data: EmailTemplate[] }>('/email-templates').then((r) => r.data.data),
    updateTemplate: (id: number, data: Pick<EmailTemplate, 'name' | 'subject' | 'body'>) =>
        api.put<{ data: EmailTemplate }>(`/email-templates/${id}`, data).then((r) => r.data.data),
    restoreTemplate: (slug: string) =>
        api.post<{ data: EmailTemplate }>(`/email-templates/${slug}/restore`).then((r) => r.data.data),
    logs: () => api.get<Paginated<EmailLog>>('/email-logs').then((r) => r.data),
};