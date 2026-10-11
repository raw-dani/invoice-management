import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, UserInput } from '../../api/users';
import { Card, CardBody, CardHeader, PageHeader, EmptyState } from '../../components/ui/Display';
import { Input, Select, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { useAuth } from '../../contexts/AuthContext';
import toast from '../../lib/toast';
import { LockClosedIcon } from '../../components/ui/Icons';

const ROLE_LABELS: Record<string, { label: string; badge: string; desc: string }> = {
    owner: {
        label: 'Owner',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        desc: 'Akses penuh tanpa batasan ke seluruh sistem.',
    },
    admin: {
        label: 'Admin',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        desc: 'Akses penuh ke semua fitur, pengaturan, dan user.',
    },
    staff: {
        label: 'Staff',
        badge: 'bg-blue-100 text-blue-800 border-blue-200',
        desc: 'Dapat membuat & mengelola invoice, customer, dan payment.',
    },
    viewer: {
        label: 'Viewer',
        badge: 'bg-gray-100 text-gray-700 border-gray-200',
        desc: 'Akses baca saja (Read Only) ke seluruh data transaksi.',
    },
    demo: {
        label: 'Demo',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        desc: 'Akses seluruh fitur, kecuali halaman User & Settings (View Only).',
    },
};

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const isDemo = currentUser?.role === 'demo';

    const queryClient = useQueryClient();
    const { data: users, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
    const [editing, setEditing] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<UserInput>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'staff',
    });

    const save = useMutation({
        mutationFn: () => (editing ? usersApi.update(editing, form) : usersApi.create(form)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(editing ? 'Pengguna berhasil diperbarui.' : 'Pengguna baru berhasil dibuat.');
            setEditing(null);
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan pengguna.');
        },
    });

    const assignRole = useMutation({
        mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.assignRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Peran pengguna berhasil diperbarui.');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal memperbarui peran.');
        },
    });

    const handleRoleChange = (userId: number, newRole: string) => {
        if (isDemo) {
            toast.error('Peran Demo hanya memiliki akses View Only.');
            return;
        }
        assignRole.mutate({ id: userId, role: newRole });
    };

    const remove = useMutation({
        mutationFn: usersApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Pengguna berhasil dihapus.');
            setDeleteId(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menghapus pengguna.');
        },
    });

    const resetForm = () =>
        setForm({ name: '', email: '', password: '', password_confirmation: '', role: 'staff' });

    const startEdit = (user: { id: number; name: string; email: string; role: string }) => {
        if (isDemo) {
            toast.error('Peran Demo hanya memiliki akses View Only.');
            return;
        }
        setEditing(user.id);
        setForm({
            name: user.name,
            email: user.email,
            password: '',
            password_confirmation: '',
            role: user.role as UserInput['role'],
        });
    };

    const handleSubmit = () => {
        if (isDemo) {
            toast.error('Peran Demo hanya memiliki akses View Only.');
            return;
        }
        if (!form.name.trim() || !form.email.trim()) {
            toast.error('Nama dan email wajib diisi.');
            return;
        }
        if (!editing && (!form.password || form.password.length < 8)) {
            toast.error('Password minimal 8 karakter.');
            return;
        }
        if (!editing && form.password !== form.password_confirmation) {
            toast.error('Konfirmasi password tidak cocok.');
            return;
        }
        if (editing && form.password) {
            if (form.password.length < 8) {
                toast.error('Password baru minimal 8 karakter.');
                return;
            }
            if (form.password !== form.password_confirmation) {
                toast.error('Konfirmasi password baru tidak cocok.');
                return;
            }
        }
        save.mutate();
    };

    if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Memuat data pengguna...</div>;
    if (error)
        return (
            <div className="p-8 text-center text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                Gagal memuat daftar pengguna. Silakan coba lagi.
            </div>
        );

    return (
        <div className="space-y-6">
            <PageHeader
                title="Users & Roles"
                subtitle="Kelola akun pengguna, izin akses, dan hak istimewa operasional sistem."
            />

            {/* Demo Mode Notice Banner */}
            {isDemo && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-xs">
                    <LockClosedIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                        <h4 className="font-semibold text-sm">Mode Demo Aktif — Akses View Only</h4>
                        <p className="text-xs text-amber-800 mt-0.5">
                            Akun Anda memiliki peran <strong>Demo</strong>. Anda dapat melihat seluruh daftar pengguna dan strukturnya, namun formulir penambahan, pengubahan, serta penghapusan dinonaktifkan untuk menjaga stabilitas akun demo.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Card: Add/Edit User */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">
                                {isDemo ? 'Informasi Form Pengguna' : editing ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                            </h3>
                            {isDemo && (
                                <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                    Disabled
                                </span>
                            )}
                        </div>
                    </CardHeader>
                    <CardBody className="space-y-4">
                        {isDemo ? (
                            <div className="space-y-3 py-2 text-xs text-gray-600">
                                <p className="leading-relaxed">
                                    Penambahan dan pengelolaan data pengguna hanya dapat dilakukan oleh pengguna dengan peran <strong>Owner</strong> atau <strong>Admin</strong>.
                                </p>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                                    <div className="font-semibold text-gray-800">Daftar Peran yang Tersedia:</div>
                                    <ul className="space-y-1.5 text-[11px] text-gray-600">
                                        <li>• <strong>Admin</strong>: Akses penuh ke seluruh sistem.</li>
                                        <li>• <strong>Staff</strong>: Mengelola transaksi operasional harian.</li>
                                        <li>• <strong>Viewer</strong>: Hanya dapat melihat data transaksi.</li>
                                        <li>• <strong>Demo</strong>: Akses semua fitur operasional, kecuali User & Settings (View Only).</li>
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <>
                                <Field label="Nama Lengkap" required>
                                    <Input
                                        placeholder="Nama pengguna"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    />
                                </Field>

                                <Field label="Alamat Email" required>
                                    <Input
                                        placeholder="user@example.com"
                                        type="email"
                                        value={form.email}
                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    />
                                </Field>

                                <Field label="Peran (Role)" required>
                                    <Select
                                        value={form.role}
                                        onChange={(e) => setForm({ ...form, role: e.target.value as UserInput['role'] })}
                                    >
                                        <option value="admin">Admin (Akses Penuh)</option>
                                        <option value="staff">Staff (Operasional Harian)</option>
                                        <option value="viewer">Viewer (Hanya Melihat)</option>
                                        <option value="demo">Demo (Akses Semua Fitur, User & Settings View Only)</option>
                                    </Select>
                                </Field>

                                {editing ? (
                                    <div className="pt-2 border-t border-gray-100 space-y-3">
                                        <div className="text-xs text-gray-500 font-medium">
                                            Reset Password Pengguna (Opsional — kosongkan jika tidak ingin mengubah):
                                        </div>
                                        <Field label="Password Baru">
                                            <Input
                                                placeholder="Minimal 8 karakter baru..."
                                                type="password"
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            />
                                        </Field>
                                        {Boolean(form.password) && (
                                            <Field label="Konfirmasi Password Baru" required>
                                                <Input
                                                    placeholder="Ulangi password baru..."
                                                    type="password"
                                                    value={form.password_confirmation}
                                                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                                />
                                            </Field>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <Field label="Password" required>
                                            <Input
                                                placeholder="Minimal 8 karakter"
                                                type="password"
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            />
                                        </Field>
                                        <Field label="Konfirmasi Password" required>
                                            <Input
                                                placeholder="Ulangi password"
                                                type="password"
                                                value={form.password_confirmation}
                                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                            />
                                        </Field>
                                    </>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button
                                        loading={save.isPending}
                                        onClick={handleSubmit}
                                    >
                                        {editing ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                                    </Button>
                                    {editing && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => {
                                                setEditing(null);
                                                resetForm();
                                            }}
                                        >
                                            Batal
                                        </Button>
                                    )}
                                </div>
                            </>
                        )}
                    </CardBody>
                </Card>

                {/* Users List Table Card */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Daftar Pengguna Perusahaan</h3>
                            <span className="text-xs text-gray-500 font-mono">
                                {users?.length ?? 0} Pengguna Terdaftar
                            </span>
                        </div>
                    </CardHeader>
                    <CardBody className="p-0">
                        {!users?.length ? (
                            <div className="p-8">
                                <EmptyState title="Belum ada pengguna" message="Belum ada akun pengguna yang terdaftar." />
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {users.map((userItem) => {
                                    const meta = ROLE_LABELS[userItem.role] || {
                                        label: userItem.role,
                                        badge: 'bg-gray-100 text-gray-700 border-gray-200',
                                        desc: '',
                                    };
                                    const isSelf = userItem.id === currentUser?.id;
                                    const isOwner = userItem.role === 'owner';

                                    return (
                                        <div
                                            key={userItem.id}
                                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-semibold text-sm text-gray-900">
                                                        {userItem.name}
                                                    </span>
                                                    {isSelf && (
                                                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                            Anda
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${meta.badge}`}
                                                    >
                                                        {meta.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 font-mono">
                                                    {userItem.email}
                                                </div>
                                                {meta.desc && (
                                                    <div className="text-[11px] text-gray-400">
                                                        {meta.desc}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!isOwner && (
                                                    <Select
                                                        className="w-32 text-xs py-1"
                                                        value={userItem.role}
                                                        onChange={(e) => handleRoleChange(userItem.id, e.target.value)}
                                                        disabled={isDemo || assignRole.isPending}
                                                        title={isDemo ? 'View Only untuk peran Demo' : 'Ubah peran pengguna'}
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="staff">Staff</option>
                                                        <option value="viewer">Viewer</option>
                                                        <option value="demo">Demo</option>
                                                    </Select>
                                                )}

                                                {!isDemo && !isOwner && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => startEdit(userItem)}
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="danger"
                                                            onClick={() => setDeleteId(userItem.id)}
                                                            disabled={isSelf}
                                                            title={isSelf ? 'Tidak dapat menghapus akun sendiri' : 'Hapus pengguna'}
                                                        >
                                                            Hapus
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <ConfirmDialog
                open={!!deleteId}
                title="Hapus pengguna?"
                message="Tindakan ini tidak dapat dibatalkan. Pengguna ini tidak akan dapat login lagi ke sistem."
                confirmText="Hapus Pengguna"
                cancelText="Batal"
                danger
                onCancel={() => setDeleteId(null)}
                onConfirm={() => deleteId && remove.mutateAsync(deleteId)}
            />
        </div>
    );
}
