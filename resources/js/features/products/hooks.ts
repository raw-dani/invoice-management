import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi, ProductFilters } from '../../api/products';
import type { Product } from '../../types';

export const productKeys = {
    all: ['products'] as const,
    lists: () => [...productKeys.all, 'list'] as const,
    list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
    details: () => [...productKeys.all, 'detail'] as const,
    detail: (id: number) => [...productKeys.details(), id] as const,
};

export function useProducts(filters: ProductFilters = {}) {
    return useQuery({
        queryKey: productKeys.list(filters),
        queryFn: () => productsApi.list(filters),
    });
}

export function useProduct(id: number | undefined) {
    return useQuery({
        queryKey: productKeys.detail(id!),
        queryFn: () => productsApi.get(id!),
        enabled: !!id,
    });
}

export function useCreateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: productsApi.create,
        onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
    });
}

export function useUpdateProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: Partial<Product> }) =>
            productsApi.update(id, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: productKeys.all });
            qc.invalidateQueries({ queryKey: productKeys.detail(vars.id) });
        },
    });
}

export function useDeleteProduct() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: productsApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: productKeys.all }),
    });
}
