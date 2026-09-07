import api from './client';

export interface Profile {
    id: number;
    name: string;
    email: string;
    role: string;
    company_id: number;
    created_at: string;
}

export const profileApi = {
    get: () => api.get<{ data: Profile }>('/profile').then((r) => r.data.data),
    update: (data: { name: string; email: string }) =>
        api.put<{ data: Profile }>('/profile', data).then((r) => r.data.data),
    changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
        api.put('/profile/password', data).then((r) => r.data),
};
