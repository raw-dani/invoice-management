import api from './client';

export type SettingsGroup = 'company' | 'invoice' | 'quote' | 'email' | 'payment' | 'demo_data';

export interface DemoDataStats {
    has_demo_data: boolean;
    counts: {
        customers: number;
        products: number;
        quotes: number;
        invoices: number;
        payments: number;
        subscriptions: number;
        users: number;
    };
}

export const settingsApi = {
    get: (group: Exclude<SettingsGroup, 'demo_data'>) => api.get<{ data: Record<string, string | null> }>(`/settings/${group}`).then((r) => r.data.data),
    update: (group: Exclude<SettingsGroup, 'demo_data'>, data: Record<string, string | null>) => api.put(`/settings/${group}`, data).then((r) => r.data.data),
    testEmail: (to: string) => api.post('/settings/email/test', { to }),
    uploadLogo: (file: File) => {
        const form = new FormData();
        form.append('logo', file);
        return api.post<{ data: { logo: string } }>('/company/logo', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
    },
    uploadSignature: (file: File) => {
        const form = new FormData();
        form.append('signature', file);
        return api.post<{ data: { signature: string } }>('/company/signature', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
    },
    uploadStamp: (file: File) => {
        const form = new FormData();
        form.append('stamp', file);
        return api.post<{ data: { stamp: string } }>('/company/stamp', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
    },
    uploadQris: (file: File) => {
        const form = new FormData();
        form.append('qris', file);
        return api.post<{ data: { qris: string } }>('/company/qris', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data.data);
    },
    getDemoStats: () => api.get<{ data: DemoDataStats }>('/settings/demo-data/stats').then((r) => r.data.data),
    generateDemoData: () => api.post<{ message: string; data: DemoDataStats }>('/settings/demo-data/generate').then((r) => r.data),
    clearDemoData: () => api.post<{ message: string; deleted: Record<string, number> }>('/settings/demo-data/clear').then((r) => r.data),
};