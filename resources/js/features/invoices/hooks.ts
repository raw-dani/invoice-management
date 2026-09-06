import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesApi, InvoiceFilters, InvoiceInput } from '../../api/invoices';

export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (filters: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: number) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(filters: InvoiceFilters = {}) {
    return useQuery({
        queryKey: invoiceKeys.list(filters),
        queryFn: () => invoicesApi.list(filters),
    });
}

export function useInvoice(id: number | undefined) {
    return useQuery({
        queryKey: invoiceKeys.detail(id!),
        queryFn: () => invoicesApi.get(id!),
        enabled: !!id,
    });
}

export function useCreateInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: InvoiceInput) => invoicesApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
    });
}

export function useUpdateInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: InvoiceInput }) =>
            invoicesApi.update(id, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.detail(vars.id) });
        },
    });
}

export function useDeleteInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: invoicesApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
    });
}

export function useMarkInvoiceSent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => invoicesApi.markAsSent(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
        },
    });
}

export function useVoidInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => invoicesApi.void(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.detail(id) });
        },
    });
}

export function useDuplicateInvoice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => invoicesApi.duplicate(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: invoiceKeys.all }),
    });
}
