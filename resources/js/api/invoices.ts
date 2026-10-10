import api from './client';
import type { Invoice, Paginated } from '../types';

export interface InvoiceFilters {
    search?: string;
    status?: string;
    customer_id?: number;
    page?: number;
    per_page?: number;
}

export interface InvoiceInput {
    customer_id: number;
    invoice_date: string;
    due_date: string;
    currency: string;
    discount?: number;
    discount_type: 0 | 1;
    tax_rate?: number;
    notes?: string;
    terms?: string;
    quote_id?: number;
    milestone_name?: string;
    milestone_sequence?: number;
    milestone_total_termins?: number;
    milestone_percentage?: number;
    items: Array<{
        product_id?: number | null;
        description: string;
        quantity: number;
        unit_price: number;
        discount?: number;
        tax_rate?: number;
    }>;
}

export const invoicesApi = {
    list: (filters: InvoiceFilters = {}) =>
        api.get<Paginated<Invoice>>('/invoices', { params: filters }).then((r) => r.data),
    get: (id: number) =>
        api.get<{ data: Invoice }>(`/invoices/${id}`).then((r) => r.data.data),
    create: (data: InvoiceInput) =>
        api.post<{ data: Invoice }>('/invoices', data).then((r) => r.data.data),
    update: (id: number, data: InvoiceInput) =>
        api.put<{ data: Invoice }>(`/invoices/${id}`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/invoices/${id}`),
    bulkAction: (ids: number[], action: 'mark_as_sent' | 'void') =>
        api.post('/invoices/bulk-action', { ids, action }).then((r) => r.data),
    markAsSent: (id: number) =>
        api.post<{ data: Invoice }>(`/invoices/${id}/mark-as-sent`).then((r) => r.data.data),
    void: (id: number) =>
        api.post<{ data: Invoice }>(`/invoices/${id}/void`).then((r) => r.data.data),
    duplicate: (id: number) =>
        api.post<{ data: Invoice }>(`/invoices/${id}/duplicate`).then((r) => r.data.data),
    sendEmail: (id: number, data?: { to?: string; subject?: string; message?: string }) =>
        api.post<{ success: boolean; message: string }>(`/invoices/${id}/email`, data).then((r) => r.data),
    approveProof: (id: number, data?: { amount?: number; payment_method?: string; admin_notes?: string }) =>
        api.post<{ message: string; invoice: Invoice }>(`/invoices/${id}/approve-proof`, data).then((r) => r.data),
    rejectProof: (id: number, data?: { reason?: string }) =>
        api.post<{ message: string; invoice: Invoice }>(`/invoices/${id}/reject-proof`, data).then((r) => r.data),
};
