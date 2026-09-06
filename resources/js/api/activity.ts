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
};