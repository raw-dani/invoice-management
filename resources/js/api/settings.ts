import api from './client';

export type SettingsGroup = 'company' | 'invoice' | 'quote' | 'email' | 'payment';

export const settingsApi = {
    get: (group: SettingsGroup) => api.get<{ data: Record<string, string | null> }>(`/settings/${group}`).then((r) => r.data.data),
    update: (group: SettingsGroup, data: Record<string, string | null>) => api.put(`/settings/${group}`, data).then((r) => r.data.data),
    testEmail: (to: string) => api.post('/settings/email/test', { to }),
    uploadLogo: (file: File) => {
        const form = new FormData();
        form.append('logo', file);
        return api.post<{ data: { logo: string } }>('/company/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
    },
};