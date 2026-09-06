import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
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

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
