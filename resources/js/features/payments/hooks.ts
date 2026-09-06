import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, PaymentFilters, PaymentInput } from '../../api/payments';
import { invoiceKeys } from '../invoices/hooks';

export const paymentKeys = {
    all: ['payments'] as const,
    lists: () => [...paymentKeys.all, 'list'] as const,
    list: (filters: PaymentFilters) => [...paymentKeys.lists(), filters] as const,
    byInvoice: (invoiceId: number) => [...paymentKeys.all, 'invoice', invoiceId] as const,
    details: () => [...paymentKeys.all, 'detail'] as const,
    detail: (id: number) => [...paymentKeys.details(), id] as const,
};

export function usePayments(filters: PaymentFilters = {}) {
    return useQuery({
        queryKey: paymentKeys.list(filters),
        queryFn: () => paymentsApi.list(filters),
    });
}

export function usePayment(id: number | undefined) {
    return useQuery({
        queryKey: paymentKeys.detail(id!),
        queryFn: () => paymentsApi.get(id!),
        enabled: !!id,
    });
}

export function useInvoicePayments(invoiceId: number | undefined) {
    return useQuery({
        queryKey: paymentKeys.byInvoice(invoiceId!),
        queryFn: () => paymentsApi.listByInvoice(invoiceId!),
        enabled: !!invoiceId,
    });
}

export function useCreatePayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: paymentsApi.create,
        onSuccess: (payment) => {
            qc.invalidateQueries({ queryKey: paymentKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.detail(payment.invoice_id) });
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });
}

export function useDeletePayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: paymentsApi.remove,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: paymentKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });
}
