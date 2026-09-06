import api from './client';
import type { Payment, Paginated } from '../types';

export interface PaymentFilters {
    search?: string;
    invoice_id?: number;
    customer_id?: number;
    payment_method?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

export interface PaymentInput {
    invoice_id: number;
    payment_date: string;
    amount: number;
    currency: string;
    payment_method: 'bank_transfer' | 'cash' | 'credit_card' | 'e_wallet' | 'other';
    reference?: string;
    notes?: string;
}

export const paymentsApi = {
    list: (filters: PaymentFilters = {}) =>
        api.get<Paginated<Payment>>('/payments', { params: filters }).then((r) => r.data),
    listByInvoice: (invoiceId: number) =>
        api.get<Paginated<Payment>>(`/invoices/${invoiceId}/payments`).then((r) => r.data),
    get: (id: number) =>
        api.get<{ data: Payment }>(`/payments/${id}`).then((r) => r.data.data),
    create: (data: PaymentInput) =>
        api.post<{ data: Payment }>(`/invoices/${data.invoice_id}/payments`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/payments/${id}`),
};
