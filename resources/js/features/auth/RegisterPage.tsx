import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Input, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import toast from '../../lib/toast';

interface RegisterForm {
    name: string;
    company_name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>();

    const onSubmit = async (data: RegisterForm) => {
        setServerError(null);
        try {
            await registerUser(data);
            toast.success('Account created!');
            navigate('/', { replace: true });
        } catch (err: any) {
            const msg = err.response?.data?.message ?? 'Registration failed.';
            setServerError(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">Create account</h1>
                    <p className="mt-2 text-sm text-gray-500">Start managing your invoices</p>
                </div>

                <div className="bg-white shadow rounded-lg px-6 py-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {serverError && (
                            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                                {serverError}
                            </div>
                        )}

                        <Field label="Your name" required error={errors.name?.message}>
                            <Input {...register('name', { required: 'Name is required' })} />
                        </Field>

                        <Field label="Company name" required error={errors.company_name?.message}>
                            <Input {...register('company_name', { required: 'Company name is required' })} />
                        </Field>

                        <Field label="Email" required error={errors.email?.message}>
                            <Input
                                type="email"
                                autoComplete="email"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
                                })}
                            />
                        </Field>

                        <Field label="Password" required error={errors.password?.message}>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Minimum 8 characters' },
                                })}
                            />
                        </Field>

                        <Field label="Confirm password" required error={errors.password_confirmation?.message}>
                            <Input
                                type="password"
                                autoComplete="new-password"
                                {...register('password_confirmation', {
                                    required: 'Please confirm password',
                                    validate: (v, form) => v === form.password || 'Passwords do not match',
                                })}
                            />
                        </Field>

                        <Button type="submit" loading={isSubmitting} className="w-full">
                            Create account
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
