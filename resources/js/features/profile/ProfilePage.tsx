import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../../api/profile';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Field } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import toast from '../../lib/toast';

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const { data: profile, isLoading } = useQuery({ queryKey: ['profile'], queryFn: profileApi.get });
    const [form, setForm] = useState({ name: '', email: '' });
    const [password, setPassword] = useState({ current: '', new: '', confirmation: '' });

    useEffect(() => {
        if (profile) setForm({ name: profile.name, email: profile.email });
    }, [profile]);

    const updateProfile = useMutation({
        mutationFn: () => profileApi.update({ name: form.name, email: form.email }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('Profile updated successfully.');
        },
        onError: () => toast.error('Failed to update profile.'),
    });

    const changePassword = useMutation({
        mutationFn: () => profileApi.changePassword({ current_password: password.current, password: password.new, password_confirmation: password.confirmation }),
        onSuccess: () => {
            setPassword({ current: '', new: '', confirmation: '' });
            toast.success('Password changed successfully.');
        },
        onError: () => toast.error('Failed to change password.'),
    });

    if (isLoading) return <div className="p-8 text-center text-sm text-gray-500">Loading profile...</div>;

    return (
        <>
            <PageHeader title="My Profile" subtitle="Manage your account details." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><h3 className="font-medium">Profile Information</h3></CardHeader>
                    <CardBody className="space-y-4">
                        <Field label="Name">
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </Field>
                        <Field label="Email">
                            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </Field>
                        <div className="flex justify-end">
                            <Button loading={updateProfile.isPending} onClick={() => updateProfile.mutate()}>Update Profile</Button>
                        </div>
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader><h3 className="font-medium">Change Password</h3></CardHeader>
                    <CardBody className="space-y-4">
                        <Field label="Current Password">
                            <Input type="password" value={password.current} onChange={(e) => setPassword({ ...password, current: e.target.value })} />
                        </Field>
                        <Field label="New Password">
                            <Input type="password" value={password.new} onChange={(e) => setPassword({ ...password, new: e.target.value })} />
                        </Field>
                        <Field label="Confirm New Password">
                            <Input type="password" value={password.confirmation} onChange={(e) => setPassword({ ...password, confirmation: e.target.value })} />
                        </Field>
                        <div className="flex justify-end">
                            <Button loading={changePassword.isPending} onClick={() => changePassword.mutate()}>Change Password</Button>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </>
    );
}
