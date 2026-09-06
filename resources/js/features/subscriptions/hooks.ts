import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi, SubscriptionFilters, SubscriptionInput } from '../../api/subscriptions';

export const subscriptionKeys = {
    all: ['subscriptions'] as const,
    lists: () => [...subscriptionKeys.all, 'list'] as const,
    list: (filters: SubscriptionFilters) => [...subscriptionKeys.lists(), filters] as const,
    details: () => [...subscriptionKeys.all, 'detail'] as const,
    detail: (id: number) => [...subscriptionKeys.details(), id] as const,
};

export function useSubscriptions(filters: SubscriptionFilters = {}) {
    return useQuery({ queryKey: subscriptionKeys.list(filters), queryFn: () => subscriptionsApi.list(filters) });
}

export function useSubscription(id: number | undefined) {
    return useQuery({
        queryKey: subscriptionKeys.detail(id!),
        queryFn: () => subscriptionsApi.get(id!),
        enabled: !!id,
    });
}

function useSubscriptionMutation(action: (id: number) => Promise<unknown>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: action,
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(id) });
        },
    });
}

export function useCreateSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: SubscriptionInput) => subscriptionsApi.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }),
    });
}

export function useUpdateSubscription() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: SubscriptionInput }) => subscriptionsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.all });
            queryClient.invalidateQueries({ queryKey: subscriptionKeys.detail(variables.id) });
        },
    });
}

export function useDeleteSubscription() {
    const queryClient = useQueryClient();
    return useMutation({ mutationFn: subscriptionsApi.remove, onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionKeys.all }) });
}

export const usePauseSubscription = () => useSubscriptionMutation(subscriptionsApi.pause);
export const useResumeSubscription = () => useSubscriptionMutation(subscriptionsApi.resume);
export const useCancelSubscription = () => useSubscriptionMutation(subscriptionsApi.cancel);
export const useGenerateSubscriptionInvoice = () => useSubscriptionMutation(subscriptionsApi.generateInvoice);