import api from './client';
import type { Customer, CustomerOverview, Paginated } from '../types';

export interface CustomerFilters {
    search?: string;
    status?: string;
    page?: number;
    per_page?: number;
}

export const customersApi = {
    list: (filters: CustomerFilters = {}) =>
        api.get<Paginated<Customer>>('/customers', { params: filters }).then((r) => r.data),
    get: (id: number) =>
        api.get<{ data: Customer }>(`/customers/${id}`).then((r) => r.data.data),
    create: (data: Partial<Customer>) =>
        api.post<{ data: Customer }>('/customers', data).then((r) => r.data.data),
    update: (id: number, data: Partial<Customer>) =>
        api.put<{ data: Customer }>(`/customers/${id}`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/customers/${id}`),
    overview: (id: number) =>
        api.get<{ data: CustomerOverview }>(`/customers/${id}/overview`).then((r) => r.data.data),
    bulkStatus: (ids: number[], status: Customer['status']) =>
        api.post('/customers/bulk-status', { ids, status }).then((r) => r.data),
    convertToSubscription: (id: number, data: {
        billing_cycle: string;
        start_date: string;
        next_billing_date: string;
        invoice_due_days: number;
        currency: string;
        notes?: string;
        items: Array<{ description: string; quantity: number; unit_price: number; tax_rate: number; product_id?: number | null }>;
    }) => api.post(`/customers/${id}/convert-subscription`, data).then((r) => r.data.data),
};
