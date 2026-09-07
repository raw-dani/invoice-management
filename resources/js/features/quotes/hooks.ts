import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { quotesApi, QuoteFilters, QuoteInput } from '../../api/quotes';

export const quoteKeys = {
    all: ['quotes'] as const,
    lists: () => [...quoteKeys.all, 'list'] as const,
    list: (filters: QuoteFilters) => [...quoteKeys.lists(), filters] as const,
    details: () => [...quoteKeys.all, 'detail'] as const,
    detail: (id: number) => [...quoteKeys.details(), id] as const,
};

export function useQuotes(filters: QuoteFilters = {}) {
    return useQuery({
        queryKey: quoteKeys.list(filters),
        queryFn: () => quotesApi.list(filters),
    });
}

export function useQuote(id: number | undefined) {
    return useQuery({
        queryKey: quoteKeys.detail(id!),
        queryFn: () => quotesApi.get(id!),
        enabled: !!id,
    });
}

export function useCreateQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: QuoteInput) => quotesApi.create(data),
        onSuccess: () => qc.invalidateQueries({ queryKey: quoteKeys.all }),
    });
}

export function useUpdateQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: QuoteInput }) =>
            quotesApi.update(id, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: quoteKeys.all });
            qc.invalidateQueries({ queryKey: quoteKeys.detail(vars.id) });
        },
    });
}

export function useDeleteQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: quotesApi.remove,
        onSuccess: () => qc.invalidateQueries({ queryKey: quoteKeys.all }),
    });
}

export function useSendQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => quotesApi.send(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: quoteKeys.all });
            qc.invalidateQueries({ queryKey: quoteKeys.detail(id) });
        },
    });
}

export function useAcceptQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => quotesApi.accept(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: quoteKeys.all });
            qc.invalidateQueries({ queryKey: quoteKeys.detail(id) });
        },
    });
}

export function useRejectQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => quotesApi.reject(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: quoteKeys.all });
            qc.invalidateQueries({ queryKey: quoteKeys.detail(id) });
        },
    });
}

export function useConvertQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => quotesApi.convertToInvoice(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: quoteKeys.all });
            qc.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });
}

import { invoiceKeys } from '../../features/invoices/hooks';

export function useDuplicateQuote() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => quotesApi.duplicate(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: quoteKeys.all }),
    });
}

export function useSendQuoteEmail() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
            quotesApi.sendEmail(id, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: quoteKeys.all }),
    });
}
