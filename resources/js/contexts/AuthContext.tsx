import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../api/client';
import type { User } from '../types';

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { name: string; email: string; password: string; password_confirmation: string; company_name: string }) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const raw = localStorage.getItem('auth_user');
        return raw ? JSON.parse(raw) : null;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
            setLoading(false);
            return;
        }
        api.get('/auth/me')
            .then((res) => {
                setUser(res.data.user);
                localStorage.setItem('auth_user', JSON.stringify(res.data.user));
            })
            .catch(() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                setUser(null);
            })
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const register = async (data: { name: string; email: string; password: string; password_confirmation: string; company_name: string }) => {
        const res = await api.post('/auth/register', data);
        localStorage.setItem('auth_token', res.data.token);
        localStorage.setItem('auth_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
}
