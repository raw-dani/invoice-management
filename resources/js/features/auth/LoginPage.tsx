import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ShieldCheckIcon } from '../../components/ui/Icons';
import { settingsApi } from '../../api/settings';
import toast from '../../lib/toast';

interface LoginForm {
    email: string;
    password: string;
}

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [serverError, setServerError] = useState<string | null>(null);

    // Process incoming SAML SSO callback token or error from IdP redirect
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const samlToken = params.get('saml_token');
        const samlError = params.get('saml_error');

        if (samlToken) {
            localStorage.setItem('auth_token', samlToken);
            toast.success('Login SAML SSO berhasil! Mengalihkan ke dashboard...');
            // Reload into dashboard to initialize AuthContext with new token
            window.location.href = '/';
        } else if (samlError) {
            const decoded = decodeURIComponent(samlError);
            setServerError(`Autentikasi SSO Gagal: ${decoded}`);
            toast.error(decoded);
        }
    }, [location.search]);

    // Check if SAML SSO is enabled for the company
    const { data: samlStatus } = useQuery({
        queryKey: ['saml_status'],
        queryFn: () => settingsApi.getSamlStatus(),
        retry: false,
    });

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError(null);
        try {
            await login(data.email, data.password);
            toast.success('Welcome back!');
            const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
            navigate(from, { replace: true });
        } catch (err: any) {
            const msg = err.response?.data?.message ?? 'Login failed. Please check your credentials.';
            setServerError(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">Invoice Management</h1>
                    <p className="mt-2 text-sm text-gray-500">Sign in to your account</p>
                </div>

                <div className="bg-white shadow rounded-lg px-6 py-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {serverError && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                {serverError}
                            </div>
                        )}

                        <Field label="Email" required error={errors.email?.message}>
                            <Input
                                type="email"
                                autoComplete="email"
                                {...register('email', { required: 'Email is required' })}
                            />
                        </Field>

                        <Field label="Password" required error={errors.password?.message}>
                            <Input
                                type="password"
                                autoComplete="current-password"
                                {...register('password', { required: 'Password is required' })}
                            />
                        </Field>

                        <Button type="submit" loading={isSubmitting} className="w-full">
                            Sign in
                        </Button>
                    </form>

                    {/* Enterprise SAML SSO Option */}
                    {samlStatus?.enabled && (
                        <div className="mt-5">
                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-500 font-semibold tracking-wider">
                                        Atau Masuk Melalui
                                    </span>
                                </div>
                            </div>

                            <a
                                href={samlStatus.login_url || '/api/saml/login'}
                                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900 text-sm font-semibold shadow-xs transition group"
                            >
                                <ShieldCheckIcon className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                                <span>Single Sign-On ({samlStatus.idp_name || 'IdP SAML'})</span>
                            </a>
                        </div>
                    )}

                    <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-500">
                            Pendaftaran pengguna baru dikelola oleh <strong>Owner</strong> atau <strong>Admin</strong>. Hubungi administrator perusahaan Anda jika membutuhkan akun baru.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
