import api from './client';
import type { Quote, Paginated, Invoice } from '../types';

export interface QuoteFilters {
    search?: string;
    status?: string;
    customer_id?: number;
    page?: number;
    per_page?: number;
}

export interface QuoteInput {
    customer_id: number;
    quote_date: string;
    valid_until?: string;
    currency: string;
    discount?: number;
    discount_type: 0 | 1;
    tax_rate?: number;
    notes?: string;
    terms?: string;
    items: Array<{
        product_id?: number | null;
        description: string;
        quantity: number;
        unit_price: number;
        discount?: number;
        tax_rate?: number;
    }>;
}

export const quotesApi = {
    list: (filters: QuoteFilters = {}) =>
        api.get<Paginated<Quote>>('/quotes', { params: filters }).then((r) => r.data),
    get: (id: number) =>
        api.get<{ data: Quote }>(`/quotes/${id}`).then((r) => r.data.data),
    create: (data: QuoteInput) =>
        api.post<{ data: Quote }>('/quotes', data).then((r) => r.data.data),
    update: (id: number, data: QuoteInput) =>
        api.put<{ data: Quote }>(`/quotes/${id}`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/quotes/${id}`),
    bulkAction: (ids: number[], action: 'mark_as_expired') =>
        api.post('/quotes/bulk-action', { ids, action }).then((r) => r.data),
    send: (id: number) =>
        api.post<{ data: Quote }>(`/quotes/${id}/send`).then((r) => r.data.data),
    accept: (id: number) =>
        api.post<{ data: Quote }>(`/quotes/${id}/accept`).then((r) => r.data.data),
    reject: (id: number) =>
        api.post<{ data: Quote }>(`/quotes/${id}/reject`).then((r) => r.data.data),
    markAsExpired: (id: number) =>
        api.post<{ data: Quote }>(`/quotes/${id}/mark-as-expired`).then((r) => r.data.data),
    convertToInvoice: (id: number) =>
        api.post<{ data: Invoice }>(`/quotes/${id}/convert-to-invoice`).then((r) => r.data.data),
    duplicate: (id: number) =>
        api.post<{ data: Quote }>(`/quotes/${id}/duplicate`).then((r) => r.data.data),
    sendEmail: (id: number, data?: { to?: string; subject?: string; message?: string }) =>
        api.post<{ success: boolean; message: string }>(`/quotes/${id}/email`, data).then((r) => r.data),
};
