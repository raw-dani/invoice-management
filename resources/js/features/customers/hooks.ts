import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customersApi, CustomerFilters } from '../../api/customers';
import type { Customer } from '../../types';

export const customerKeys = {
    all: ['customers'] as const,
    lists: () => [...customerKeys.all, 'list'] as const,
    list: (filters: CustomerFilters) => [...customerKeys.lists(), filters] as const,
    details: () => [...customerKeys.all, 'detail'] as const,
    detail: (id: number) => [...customerKeys.details(), id] as const,
};

export function useCustomers(filters: CustomerFilters = {}) {
    return useQuery({
        queryKey: customerKeys.list(filters),
        queryFn: () => customersApi.list(filters),
    });
}

export function useCustomer(id: number | undefined) {
    return useQuery({
        queryKey: customerKeys.detail(id!),
        queryFn: () => customersApi.get(id!),
        enabled: !!id,
    });
}

export function useCreateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: customersApi.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
    });
}

export function useUpdateCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
            customersApi.update(id, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: customerKeys.all });
            qc.invalidateQueries({ queryKey: customerKeys.detail(vars.id) });
        },
    });
}

export function useDeleteCustomer() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: customersApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: customerKeys.all }),
    });
}
