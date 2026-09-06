import api from './client';

export interface ReportFilters { from?: string; to?: string; group_by?: string }

export const reportsApi = {
    revenue: (filters: ReportFilters) => api.get('/reports/revenue', { params: filters }).then((r) => r.data.data),
    invoices: (filters: ReportFilters) => api.get('/reports/invoices', { params: filters }).then((r) => r.data.data),
    customers: (filters: ReportFilters) => api.get('/reports/customers', { params: filters }).then((r) => r.data.data),
    subscriptions: () => api.get('/reports/subscriptions').then((r) => r.data.data),
};