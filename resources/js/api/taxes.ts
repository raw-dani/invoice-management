import api from './client';

export interface TaxRateOption {
    id: number;
    name: string;
    rate: number;
    is_default: boolean;
}

export const taxesApi = {
    list: () => api.get<{ data: TaxRateOption[] }>('/tax-rates').then((r) => r.data.data),
};