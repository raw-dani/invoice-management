import api from './client';

export type SettingsGroup = 'company' | 'invoice' | 'quote' | 'email' | 'payment' | 'saml' | 'license' | 'demo_data';

export interface LicenseStatus {
    is_licensed: boolean;
    status: 'active' | 'unlicensed' | 'expired' | 'invalid_machine' | 'offline_grace';
    status_message: string;
    license_key: string | null;
    masked_license_key: string | null;
    expires_at: string | null;
    last_checked: string | null;
    server_url: string;
    api_key: string | null;
    registered_domain: string | null;
    current_domain: string;
    install_id: string;
    registered_install_id: string | null;
    fingerprint: string;
    grace_period_hours: number;
    device_info: {
        hostname: string;
        os: string;
        php_version: string;
        server_ip: string;
        app_root: string;
    };
}

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
    testSaml: (data: { idp_entity_id: string; idp_sso_url: string; idp_x509_cert: string }) =>
        api.post<{ success: boolean; data: any }>('/saml/test', data).then((r) => r.data),
    getSamlStatus: () =>
        api.get<{ enabled: boolean; idp_name: string; login_url: string }>('/saml/status').then((r) => r.data),
    getLicenseStatus: () =>
        api.get<{ data: LicenseStatus }>('/settings/license/status').then((r) => r.data.data),
    activateLicense: (data: { license_key: string; server_url?: string; api_key?: string }) =>
        api.post<{ message: string; data: LicenseStatus }>('/settings/license/activate', data).then((r) => r.data),
    verifyLicense: () =>
        api.post<{ message: string; data: LicenseStatus }>('/settings/license/verify').then((r) => r.data),
    revokeLicense: () =>
        api.post<{ message: string; data: LicenseStatus }>('/settings/license/revoke').then((r) => r.data),
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