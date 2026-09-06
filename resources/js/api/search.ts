import api from './client';

export interface SearchResults {
    customers: Array<{ id: number; customer_number: string; company_name: string; email: string | null }>;
    products: Array<{ id: number; sku: string; name: string; type: string }>;
    invoices: Array<{ id: number; invoice_number: string; status: string }>;
    quotes: Array<{ id: number; quote_number: string; status: string }>;
    subscriptions: Array<{ id: number; subscription_number: string; status: string }>;
}

export const searchApi = (q: string) => api.get<{ data: SearchResults }>('/search', { params: { q } }).then((r) => r.data.data);