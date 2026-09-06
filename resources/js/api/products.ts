import api from './client';
import type { Product, Paginated } from '../types';

export interface ProductFilters {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    per_page?: number;
}

export const productsApi = {
    list: (filters: ProductFilters = {}) =>
        api.get<Paginated<Product>>('/products', { params: filters }).then((r) => r.data),
    get: (id: number) =>
        api.get<{ data: Product }>(`/products/${id}`).then((r) => r.data.data),
    create: (data: Partial<Product>) =>
        api.post<{ data: Product }>('/products', data).then((r) => r.data.data),
    update: (id: number, data: Partial<Product>) =>
        api.put<{ data: Product }>(`/products/${id}`, data).then((r) => r.data.data),
    remove: (id: number) => api.delete(`/products/${id}`),
    bulkStatus: (ids: number[], status: Product['status']) =>
        api.post('/products/bulk-status', { ids, status }).then((r) => r.data),
};
