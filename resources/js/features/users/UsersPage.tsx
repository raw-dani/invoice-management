import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi, UserInput } from '../../api/users';
import { Card, CardBody, CardHeader, PageHeader, EmptyState } from '../../components/ui/Display';
import { Input, Select, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import toast from '../../lib/toast';

export default function UsersPage() {
    const queryClient = useQueryClient();
    const { data: users, isLoading, error } = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
    const [editing, setEditing] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<UserInput>({ name: '', email: '', password: '', password_confirmation: '', role: 'staff' });

    const save = useMutation({
        mutationFn: () => editing ? usersApi.update(editing, form) : usersApi.create(form),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success(editing ? 'User updated successfully.' : 'User created successfully.');
            setEditing(null);
            resetForm();
        },
        onError: () => {
            toast.error('Failed to save user.');
        },
    });

    const assignRole = useMutation({
        mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.assignRole(id, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Role updated successfully.');
        },
        onError: () => {
            toast.error('Failed to update role.');
        },
    });

    const handleRoleChange = (userId: number, newRole: string) => {
        assignRole.mutate({ id: userId, role: newRole });
    };

    const remove = useMutation({
        mutationFn: usersApi.remove,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully.');
            setDeleteId(null);
        },
        onError: () => {
            toast.error('Failed to delete user.');
        },
    });

    const resetForm = () => setForm({ name: '', email: '', password: '', password_confirmation: '', role: 'staff' });

    const startEdit = (user: { id: number; name: string; email: string; role: string }) => {
        setEditing(user.id);
        setForm({ name: user.name, email: user.email, password: '', password_confirmation: '', role: user.role as UserInput['role'] });
    };

    const handleSubmit = () => {
        if (!form.name.trim() || !form.email.trim()) {
            toast.error('Name and email are required.');
            return;
        }
        if (!editing && (!form.password || form.password.length < 8)) {
            toast.error('Password must be at least 8 characters.');
            return;
        }
        if (!editing && form.password !== form.password_confirmation) {
            toast.error('Passwords do not match.');
            return;
        }
        save.mutate();
    };

    if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Loading users...</div>;
    if (error) return <div className="p-8 text-center text-sm text-red-600">Failed to load users. Please try again.</div>;

    return (
        <>
            <PageHeader title="Users" subtitle="Manage company users and roles." />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><h3 className="font-medium">{editing ? 'Edit User' : 'Add User'}</h3></CardHeader>
                    <CardBody className="space-y-3">
                        <Field label="Name" required>
                            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </Field>
                        <Field label="Email" required>
                            <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </Field>
                        <Field label="Role">
                            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserInput['role'] })}>
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                                <option value="viewer">Viewer</option>
                            </Select>
                        </Field>
                        {!editing && (
                            <>
                                <Field label="Password" required>
                                    <Input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                </Field>
                                <Field label="Confirm Password" required>
                                    <Input placeholder="Confirm password" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                                </Field>
                            </>
                        )}
                        <div className="flex gap-2">
                            <Button loading={save.isPending} onClick={handleSubmit}>{editing ? 'Update' : 'Add User'}</Button>
                            {editing && <Button variant="secondary" onClick={() => { setEditing(null); resetForm(); }}>Cancel</Button>}
                        </div>
                    </CardBody>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader><h3 className="font-medium">Company Users</h3></CardHeader>
                    <CardBody>
                        {!users?.length ? (
                            <EmptyState title="No users yet" message="Get started by adding your first user." />
                        ) : (
                            <div className="divide-y">
                                {users.map((user) => (
                                    <div key={user.id} className="py-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-sm">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email} · {user.role}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Select
                                                className="max-w-[120px] text-xs"
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                disabled={assignRole.isPending}
                                            >
                                                <option value="admin">Admin</option>
                                                <option value="staff">Staff</option>
                                                <option value="viewer">Viewer</option>
                                            </Select>
                                            <Button size="sm" variant="secondary" onClick={() => startEdit(user)}>Edit</Button>
                                            <Button size="sm" variant="danger" onClick={() => setDeleteId(user.id)}>Delete</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
            <ConfirmDialog open={!!deleteId} title="Delete user?" message="This action cannot be undone." danger onCancel={() => setDeleteId(null)} onConfirm={() => deleteId && remove.mutateAsync(deleteId)} />
        </>
    );
}
