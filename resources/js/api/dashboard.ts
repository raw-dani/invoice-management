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
    summary: () =>
        api.get<{ data: DashboardSummary }>('/dashboard/summary').then((r) => r.data.data),
    recentInvoices: () =>
        api.get<{ data: Invoice[] }>('/dashboard/recent-invoices').then((r) => r.data.data),
    overdueInvoices: () =>
        api.get<{ data: Invoice[] }>('/dashboard/overdue-invoices').then((r) => r.data.data),
    upcomingBilling: () =>
        api.get<{ data: UpcomingBilling[] }>('/dashboard/upcoming-billing').then((r) => r.data.data),
};