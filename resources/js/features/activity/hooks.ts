import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../../api/activity';
import type { ActivityLog, Paginated } from '../../types';

export const activityKeys = {
    all: ['activity-logs'] as const,
    lists: () => [...activityKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...activityKeys.lists(), filters] as const,
    byEntity: (subjectType: string, subjectId: number) => [...activityKeys.all, 'entity', subjectType, subjectId] as const,
};

export function useActivityLogs(filters: Record<string, unknown> = {}) {
    return useQuery({
        queryKey: activityKeys.list(filters),
        queryFn: () => activityApi.list(filters as any),
    });
}

export function useEntityActivityLogs(subjectType: string, subjectId: number | undefined) {
    return useQuery({
        queryKey: activityKeys.byEntity(subjectType, subjectId!),
        queryFn: () => activityApi.byEntity(subjectType, subjectId!),
        enabled: !!subjectId && !!subjectType,
    });
}
