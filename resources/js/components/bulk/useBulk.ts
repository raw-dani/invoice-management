import { useMutation, useQueryClient } from '@tanstack/react-query';

type QueryKey = { all: readonly unknown[] };

/**
 * Bulk delete over existing per-row delete endpoints. Resilient to per-row
 * guard failures (failed items are counted, not thrown).
 */
export function useBulkDelete(deleteFn: (id: number) => Promise<unknown>, keys: QueryKey[]) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (ids: number[]) => {
            const results = await Promise.allSettled(ids.map((id) => deleteFn(id)));
            const failed = results.filter((r) => r.status === 'rejected').length;
            return { total: ids.length, failed };
        },
        onSuccess: () => {
            keys.forEach((k) => qc.invalidateQueries({ queryKey: [...k.all] }));
        },
    });
}

/**
 * Bulk action executed with a single request. Invalidates the listed query
 * keys on success.
 */
export function useBulkAction(
    actionFn: (payload: { ids: number[]; action: string }) => Promise<{ data: { processed: number; failed: number } }>,
    keys: QueryKey[]
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: actionFn,
        onSuccess: () => {
            keys.forEach((k) => qc.invalidateQueries({ queryKey: [...k.all] }));
        },
    });
}

/**
 * Bulk status update executed with a single request.
 */
export function useBulkStatus(
    statusFn: (payload: { ids: number[]; status: string }) => Promise<{ data: { updated: number } }>,
    keys: QueryKey[]
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: statusFn,
        onSuccess: () => {
            keys.forEach((k) => qc.invalidateQueries({ queryKey: [...k.all] }));
        },
    });
}