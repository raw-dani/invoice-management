import api from './client';

export type SettingsGroup = 'company' | 'invoice' | 'quote' | 'email' | 'payment';

export const settingsApi = {
    get: (group: SettingsGroup) => api.get<{ data: Record<string, string | null> }>(`/settings/${group}`).then((r) => r.data.data),
    update: (group: SettingsGroup, data: Record<string, string | null>) => api.put(`/settings/${group}`, data).then((r) => r.data.data),
    testEmail: (to: string) => api.post('/settings/email/test', { to }),
};