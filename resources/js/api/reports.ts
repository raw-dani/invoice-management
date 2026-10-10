import api from './client';

export interface ReportFilters { from?: string; to?: string; group_by?: string }

export interface ArAgingInvoice {
    id: number;
    invoice_number: string;
    due_date: string;
    balance: number;
    days_overdue: number;
    bucket: 'current' | 'days_1_30' | 'days_31_60' | 'days_61_90' | 'days_over_90';
    public_token?: string;
}

export interface ArAgingCustomer {
    customer_id: number;
    customer_name: string;
    contact_name: string | null;
    phone: string | null;
    email: string | null;
    total_balance: number;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    invoices_count: number;
    oldest_due_date: string | null;
    invoices: ArAgingInvoice[];
}

export interface ArAgingSummary {
    total_receivables: number;
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    days_over_90: number;
    invoice_count: number;
    customer_count: number;
    total_overdue: number;
    overdue_percentage: number;
}

export interface ArAgingData {
    as_of_date: string;
    summary: ArAgingSummary;
    customers: ArAgingCustomer[];
}

export const reportsApi = {
    revenue: (filters: ReportFilters) => api.get('/reports/revenue', { params: filters }).then((r) => r.data.data),
    invoices: (filters: ReportFilters) => api.get('/reports/invoices', { params: filters }).then((r) => r.data.data),
    customers: (filters: ReportFilters) => api.get('/reports/customers', { params: filters }).then((r) => r.data.data),
    subscriptions: () => api.get('/reports/subscriptions').then((r) => r.data.data),
    arAging: () => api.get<{ data: ArAgingData }>('/reports/ar-aging').then((r) => r.data.data),
};