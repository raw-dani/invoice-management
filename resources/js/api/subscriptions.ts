import api from './client';
import type { Invoice, Paginated, Subscription } from '../types';

export interface SubscriptionFilters {
    search?: string;
    status?: string;
    customer_id?: number;
    page?: number;
    per_page?: number;
}

export interface SubscriptionInput {
    customer_id: number;
    status: 'draft' | 'active' | 'paused' | 'cancelled' | 'expired';
    billing_cycle: 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';
    start_date: string;
    next_billing_date: string;
    end_date?: string | null;
    invoice_due_days: number;
    currency: string;
    notes?: string;
    items: Array<{
        product_id?: number | null;
        description: string;
        quantity: number;
        unit_price: number;
        discount?: number;
        tax_rate?: number;
    }>;
}

export const subscriptionsApi = {
    list: (filters: SubscriptionFilters = {}) =>
        api.get<Paginated<Subscription>>('/subscriptions', { params: filters }).then((r) => r.data),
    get: (id: number) =>
        api.get<{ data: Subscription }>(`/subscriptions/${id}`).then((r) => r.data.data),
    create: (data: SubscriptionInput) =>
        api.post<{ data: Subscription }>('/subscriptions', data).then((r) => r.data.data),
    update: (id: number, data: SubscriptionInput) =>
        api.put<{ data: Subscription }>(`/subscriptions/${id}`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/subscriptions/${id}`),
    bulkAction: (ids: number[], action: 'pause' | 'resume' | 'cancel') =>
        api.post('/subscriptions/bulk-action', { ids, action }).then((r) => r.data),
    pause: (id: number) =>
        api.post<{ data: Subscription }>(`/subscriptions/${id}/pause`).then((r) => r.data.data),
    resume: (id: number) =>
        api.post<{ data: Subscription }>(`/subscriptions/${id}/resume`).then((r) => r.data.data),
    cancel: (id: number) =>
        api.post<{ data: Subscription }>(`/subscriptions/${id}/cancel`).then((r) => r.data.data),
    generateInvoice: (id: number) =>
        api.post<{ data: { invoice?: Invoice } }>(`/subscriptions/${id}/generate-invoice`).then((r) => r.data.data),
};