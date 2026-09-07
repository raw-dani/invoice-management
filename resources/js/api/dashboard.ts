import api from './client';
import type { Invoice } from '../types';

export interface DashboardSummary {
    total_revenue: number;
    outstanding: number;
    overdue_count: number;
    customers_count: number;
    mrr: number;
}

export interface UpcomingBilling {
    id: number;
    subscription_number: string;
    customer: string | null;
    next_billing_date: string;
    billing_cycle: string;
    amount: number;
    currency: string;
}

export const dashboardApi = {
    summary: (filters: { from?: string; to?: string } = {}) =>
        api.get<{ data: DashboardSummary }>('/dashboard/summary', { params: filters }).then((r) => r.data.data),
    recentInvoices: (filters: { from?: string; to?: string } = {}) =>
        api.get<{ data: Invoice[] }>('/dashboard/recent-invoices', { params: filters }).then((r) => r.data.data),
    overdueInvoices: (filters: { from?: string; to?: string } = {}) =>
        api.get<{ data: Invoice[] }>('/dashboard/overdue-invoices', { params: filters }).then((r) => r.data.data),
    upcomingBilling: (filters: { from?: string; to?: string } = {}) =>
        api.get<{ data: UpcomingBilling[] }>('/dashboard/upcoming-billing', { params: filters }).then((r) => r.data.data),
};