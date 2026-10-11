import axios from 'axios';
import toast from '../lib/toast';

const api = axios.create({
    baseURL: '/api',
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
});

// Attach token from localStorage
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Global response handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message;

        if (status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        } else if (status === 423 && error.response?.data?.license_required) {
            toast.error(message || 'Aplikasi memerlukan lisensi aktif.');
            if (window.location.pathname !== '/settings') {
                window.location.href = '/settings?group=license';
            }
        } else if (status === 422 && error.response.data?.errors) {
            // Validation errors - handled by react-hook-form
        } else if (status >= 500) {
            toast.error(message || 'Server error. Please try again.');
        } else if (message && status !== 422) {
            toast.error(message);
        }

        return Promise.reject(error);
    }
);

export default api;
