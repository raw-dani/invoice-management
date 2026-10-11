import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profile';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import toast from '../../lib/toast';
import {
    UserCircleIcon,
    KeyIcon,
    EyeIcon,
    EyeSlashIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    ShieldCheckIcon,
    LockClosedIcon,
} from '../../components/ui/Icons';

const ROLE_CONFIG: Record<string, { label: string; badge: string; desc: string }> = {
    owner: {
        label: 'Owner (Pemilik)',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        desc: 'Memiliki hak akses tertinggi tanpa batasan ke seluruh sistem.',
    },
    admin: {
        label: 'Administrator',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        desc: 'Dapat mengelola semua data, invoice, pengguna, dan pengaturan sistem.',
    },
    staff: {
        label: 'Staff Operasional',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        desc: 'Dapat mengelola transaksi harian, invoice, penawaran, dan pelanggan.',
    },
    viewer: {
        label: 'Viewer (Read Only)',
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        desc: 'Hak akses baca saja ke seluruh laporan dan invoice transaksi.',
    },
    demo: {
        label: 'Demo Account',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        desc: 'Akun demonstrasi. Fitur perubahan data dan kata sandi dinonaktifkan.',
    },
};

export default function ProfilePage() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile'],
        queryFn: profileApi.get,
    });

    const isDemo = authUser?.role === 'demo' || profile?.role === 'demo';

    // Profile Info state
    const [form, setForm] = useState({ name: '', email: '' });

    // Password Reset state
    const [password, setPassword] = useState({ current: '', new: '', confirmation: '' });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        if (profile) {
            setForm({ name: profile.name, email: profile.email });
        }
    }, [profile]);

    const updateProfile = useMutation({
        mutationFn: () => profileApi.update({ name: form.name, email: form.email }),
        onSuccess: (updated) => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profil berhasil diperbarui.');
            // update cached local storage user name/email if present
            try {
                const stored = localStorage.getItem('auth_user');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.name = updated.name;
                    parsed.email = updated.email;
                    localStorage.setItem('auth_user', JSON.stringify(parsed));
                }
            } catch {
                // ignore
            }
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Gagal memperbarui profil.';
            toast.error(msg);
        },
    });

    const changePassword = useMutation({
        mutationFn: () =>
            profileApi.changePassword({
                current_password: password.current,
                password: password.new,
                password_confirmation: password.confirmation,
            }),
        onSuccess: (res: any) => {
            setPassword({ current: '', new: '', confirmation: '' });
            setPasswordError(null);
            toast.success(res?.message || 'Kata sandi Anda berhasil diperbarui!');
        },
        onError: (err: any) => {
            const errors = err?.response?.data?.errors;
            let msg = err?.response?.data?.message || 'Gagal mengubah kata sandi.';
            if (errors) {
                const firstKey = Object.keys(errors)[0];
                if (errors[firstKey] && errors[firstKey][0]) {
                    msg = errors[firstKey][0];
                }
            }
            setPasswordError(msg);
            toast.error(msg);
        },
    });

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (isDemo) {
            toast.error('Akun demo tidak diperkenankan mengganti kata sandi.');
            return;
        }

        if (!password.current) {
            setPasswordError('Kata sandi saat ini wajib diisi.');
            toast.error('Kata sandi saat ini wajib diisi.');
            return;
        }

        if (!password.new || password.new.length < 8) {
            setPasswordError('Kata sandi baru minimal harus 8 karakter.');
            toast.error('Kata sandi baru minimal harus 8 karakter.');
            return;
        }

        if (password.new !== password.confirmation) {
            setPasswordError('Konfirmasi kata sandi baru tidak sesuai.');
            toast.error('Konfirmasi kata sandi baru tidak sesuai.');
            return;
        }

        changePassword.mutate();
    };

    if (isLoading) {
        return (
            <div className="p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent mb-3" />
                <p className="text-sm text-gray-500">Memuat data profil...</p>
            </div>
        );
    }

    const roleInfo = profile ? ROLE_CONFIG[profile.role] || {
        label: profile.role,
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        desc: 'Peran pengguna terdaftar dalam sistem.',
    } : null;

    const formattedDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
          })
        : '-';

    // Password criteria verification
    const isMinLength = password.new.length >= 8;
    const isMatched = Boolean(password.new && password.new === password.confirmation);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Profil Saya"
                subtitle="Kelola informasi akun pribadi dan atur ulang kata sandi Anda secara mandiri."
            />

            {/* Demo Notice Banner */}
            {isDemo && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
                    <LockClosedIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">Mode Demo Aktif</h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                            Akun Anda saat ini login sebagai akun <strong>Demo</strong>. Untuk menjaga akses pengujian bagi pengguna lain, perubahan profil dan reset kata sandi dinonaktifkan pada sesi ini.
                        </p>
                    </div>
                </div>
            )}

            {/* User Overview Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-2xl shadow-inner">
                            {profile?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h2 className="text-xl font-bold">{profile?.name}</h2>
                                {roleInfo && (
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${roleInfo.badge}`}>
                                        {roleInfo.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-indigo-200 mt-0.5">{profile?.email}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 border-t sm:border-t-0 sm:border-l border-white/15 pt-3 sm:pt-0 sm:pl-6 text-xs text-indigo-100">
                        {profile?.company?.name && (
                            <div>
                                <div className="text-indigo-300 flex items-center gap-1 mb-0.5">
                                    <BuildingOfficeIcon className="w-3.5 h-3.5" />
                                    <span>Perusahaan</span>
                                </div>
                                <div className="font-semibold text-sm text-white">{profile.company.name}</div>
                            </div>
                        )}
                        <div>
                            <div className="text-indigo-300 flex items-center gap-1 mb-0.5">
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>Terdaftar Sejak</span>
                            </div>
                            <div className="font-semibold text-sm text-white">{formattedDate}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Card 1: Edit Profile Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <UserCircleIcon className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-semibold text-gray-900">Informasi Profil Pengguna</h3>
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        <Field label="Nama Lengkap">
                            <Input
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                disabled={isDemo}
                                placeholder="Masukkan nama lengkap Anda..."
                            />
                        </Field>

                        <Field label="Alamat Email">
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                disabled={isDemo}
                                placeholder="nama@perusahaan.com"
                            />
                        </Field>

                        <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 space-y-1">
                            <div className="font-medium text-gray-800 flex items-center gap-1.5">
                                <ShieldCheckIcon className="w-4 h-4 text-indigo-600" />
                                <span>Izin Akses & Peran Sistem</span>
                            </div>
                            <p>{roleInfo?.desc}</p>
                            <p className="text-[11px] text-gray-500 italic pt-1">
                                Hak akses dan peran akun dikelola oleh <strong>Owner</strong> atau <strong>Administrator</strong>.
                            </p>
                        </div>

                        <div className="flex justify-end pt-2">
                            <Button
                                loading={updateProfile.isPending}
                                disabled={isDemo || !form.name.trim() || !form.email.trim()}
                                onClick={() => updateProfile.mutate()}
                            >
                                Simpan Perubahan Profil
                            </Button>
                        </div>
                    </CardBody>
                </Card>

                {/* Card 2: Self-Service Password Reset */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <KeyIcon className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-semibold text-gray-900">Reset Kata Sandi Mandiri</h3>
                        </div>
                    </CardHeader>
                    <CardBody>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Anda dapat memperbarui kata sandi akun Anda secara mandiri sewaktu-waktu. Masukkan kata sandi saat ini untuk konfirmasi kepemilikan akun.
                            </p>

                            {passwordError && (
                                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                                    <ExclamationCircleIcon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <span>{passwordError}</span>
                                </div>
                            )}

                            {/* Current Password */}
                            <div>
                                <label className="block space-y-1">
                                    <span className="block text-sm font-medium text-gray-700">Kata Sandi Saat Ini</span>
                                    <div className="relative">
                                        <Input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={password.current}
                                            onChange={(e) => setPassword({ ...password, current: e.target.value })}
                                            placeholder="Masukkan kata sandi lama..."
                                            disabled={isDemo}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                            title={showCurrentPassword ? 'Sembunyikan' : 'Tampilkan'}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeSlashIcon className="w-4 h-4" />
                                            ) : (
                                                <EyeIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </label>
                            </div>

                            {/* New Password */}
                            <div>
                                <label className="block space-y-1">
                                    <span className="block text-sm font-medium text-gray-700">Kata Sandi Baru</span>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={password.new}
                                            onChange={(e) => setPassword({ ...password, new: e.target.value })}
                                            placeholder="Minimal 8 karakter baru..."
                                            disabled={isDemo}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                            title={showNewPassword ? 'Sembunyikan' : 'Tampilkan'}
                                        >
                                            {showNewPassword ? (
                                                <EyeSlashIcon className="w-4 h-4" />
                                            ) : (
                                                <EyeIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </label>
                            </div>

                            {/* Confirm New Password */}
                            <div>
                                <label className="block space-y-1">
                                    <span className="block text-sm font-medium text-gray-700">Konfirmasi Kata Sandi Baru</span>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={password.confirmation}
                                            onChange={(e) => setPassword({ ...password, confirmation: e.target.value })}
                                            placeholder="Ulangi kata sandi baru..."
                                            disabled={isDemo}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            tabIndex={-1}
                                            title={showConfirmPassword ? 'Sembunyikan' : 'Tampilkan'}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="w-4 h-4" />
                                            ) : (
                                                <EyeIcon className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </label>
                            </div>

                            {/* Security Checklist Pills */}
                            <div className="pt-1 flex flex-wrap gap-2 text-xs">
                                <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border transition ${
                                        isMinLength
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}
                                >
                                    <CheckCircleIcon
                                        className={`w-3.5 h-3.5 ${isMinLength ? 'text-emerald-600' : 'text-gray-400'}`}
                                    />
                                    <span>Minimal 8 Karakter</span>
                                </span>
                                <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border transition ${
                                        isMatched
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                    }`}
                                >
                                    <CheckCircleIcon
                                        className={`w-3.5 h-3.5 ${isMatched ? 'text-emerald-600' : 'text-gray-400'}`}
                                    />
                                    <span>Konfirmasi Cocok</span>
                                </span>
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    loading={changePassword.isPending}
                                    disabled={isDemo || !password.current || !isMinLength || !isMatched}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                >
                                    Reset Kata Sandi
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
}
