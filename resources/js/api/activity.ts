import api from './client';
import type { ActivityLog, Paginated } from '../types';

export interface ActivityFilters {
    action?: string;
    subject_type?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

export const activityApi = {
    list: (filters: ActivityFilters = {}) =>
        api.get<Paginated<ActivityLog>>('/activity-logs', { params: filters }).then((r) => r.data),
    byEntity: (subjectType: string, subjectId: number, filters: Omit<ActivityFilters, 'subject_type' | 'subject_id'> = {}) =>
        api.get<Paginated<ActivityLog>>('/activity-logs', { params: { ...filters, subject_type: subjectType, subject_id: subjectId } }).then((r) => r.data),
};