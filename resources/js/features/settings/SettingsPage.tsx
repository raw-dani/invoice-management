import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi, SettingsGroup } from '../../api/settings';
import { Card, CardBody, CardHeader, PageHeader } from '../../components/ui/Display';
import { Input, Select, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import toast from '../../lib/toast';

const GROUPS: Array<{ key: SettingsGroup; label: string }> = [
    { key: 'company', label: 'Company' }, { key: 'invoice', label: 'Invoice' },
    { key: 'quote', label: 'Quote' }, { key: 'email', label: 'Email' }, { key: 'payment', label: 'Payment' },
];

export default function SettingsPage() {
    const [group, setGroup] = useState<SettingsGroup>('company');
    const queryClient = useQueryClient();
    const query = useQuery({ queryKey: ['settings', group], queryFn: () => settingsApi.get(group) });
    const [values, setValues] = useState<Record<string, string | null>>({});
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => { if (query.data) setValues(query.data); }, [query.data]);

    const save = useMutation({ mutationFn: () => settingsApi.update(group, values), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', group] }) });
    const uploadLogo = useMutation({
        mutationFn: (file: File) => settingsApi.uploadLogo(file),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['settings', 'company'] });
            setValues((prev) => ({ ...prev, logo: data.logo }));
            setLogoFile(null);
            setLogoPreview(null);
            toast.success('Logo uploaded successfully.');
        },
        onError: () => toast.error('Failed to upload logo.'),
    });

    const update = (key: string, value: string) => setValues({ ...values, [key]: value });

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setLogoFile(file);
        if (file) setLogoPreview(URL.createObjectURL(file));
    };

    const handleUploadLogo = () => {
        if (!logoFile) return;
        uploadLogo.mutate(logoFile);
    };
    return <>
        <PageHeader title="Settings" subtitle="Configure company, billing, email, and payment preferences." />
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6">
            <Card><CardBody className="space-y-1">{GROUPS.map((item) => <button key={item.key} onClick={() => setGroup(item.key)} className={`w-full text-left px-3 py-2 rounded text-sm ${group === item.key ? 'bg-indigo-50 text-indigo-700 font-medium' : 'hover:bg-gray-50'}`}>{item.label}</button>)}</CardBody></Card>
                <Card><CardHeader><h3 className="font-medium">{GROUPS.find((item) => item.key === group)?.label} Settings</h3></CardHeader><CardBody>{query.isLoading ? <div>Loading...</div> : <div className="space-y-4 max-w-2xl">{group === 'company' ? <CompanyFields values={values} update={update} logoPreview={logoPreview} logoFile={logoFile} onLogoChange={handleLogoChange} onUploadLogo={handleUploadLogo} uploadLogoMutation={uploadLogo} /> : <GroupFields group={group} values={values} update={update} />}{group === 'email' && <TestEmail />}<div className="flex justify-end gap-2 pt-2"><Button loading={save.isPending} onClick={() => save.mutate()}>Save Changes</Button></div></div>}</CardBody></Card>
        </div>
    </>;
}

function CompanyFields({ values, update, logoPreview, logoFile, onLogoChange, onUploadLogo, uploadLogoMutation }: { values: Record<string, string | null>; update: (key: string, value: string) => void; logoPreview: string | null; logoFile: File | null; onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void; onUploadLogo: () => void; uploadLogoMutation: any }) {
    const logoUrl = (() => {
        const raw = logoPreview || values.logo;
        if (!raw) return null;
        if (raw.startsWith('http')) return raw;
        if (raw.startsWith('/storage/')) return raw;
        return '/storage/' + raw;
    })();

    return <div className="space-y-4">
        <div className="space-y-1">
            <span className="block text-sm font-medium text-gray-700">Logo</span>
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                        <span className="text-xs text-gray-400">No logo</span>
                    )}
                </div>
                <div className="space-y-2">
                    <Input type="file" accept="image/*" onChange={onLogoChange} />
                    <Button type="button" size="sm" variant="secondary" disabled={!logoFile || uploadLogoMutation.isPending} loading={uploadLogoMutation.isPending} onClick={onUploadLogo}>Upload Logo</Button>
                </div>
            </div>
        </div>
        <Field label="Company name"><Input value={values.name ?? ''} onChange={(e) => update('name', e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={values.email ?? ''} onChange={(e) => update('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={values.phone ?? ''} onChange={(e) => update('phone', e.target.value)} /></Field>
        <Field label="Website"><Input value={values.website ?? ''} onChange={(e) => update('website', e.target.value)} /></Field>
        <Field label="Address"><Textarea value={values.address ?? ''} onChange={(e) => update('address', e.target.value)} /></Field>
        <Field label="Tax number"><Input value={values.tax_number ?? ''} onChange={(e) => update('tax_number', e.target.value)} /></Field>
    </div>;
}

function GroupFields({ group, values, update }: { group: Exclude<SettingsGroup, 'company'>; values: Record<string, string | null>; update: (key: string, value: string) => void }) {
    if (group === 'invoice') return <><Field label="Invoice prefix"><Input value={values.prefix ?? ''} onChange={(e) => update('prefix', e.target.value)} placeholder="INV-" /></Field><Field label="Due days"><Input type="number" value={values.due_days ?? ''} onChange={(e) => update('due_days', e.target.value)} /></Field><Field label="Currency"><Select value={values.currency ?? 'IDR'} onChange={(e) => update('currency', e.target.value)}><option>IDR</option><option>USD</option><option>SGD</option><option>EUR</option><option>AUD</option></Select></Field><Field label="Default tax rate"><Input type="number" step="0.01" value={values.tax_rate ?? ''} onChange={(e) => update('tax_rate', e.target.value)} /></Field></>;
    if (group === 'quote') return <><Field label="Quote prefix"><Input value={values.prefix ?? ''} onChange={(e) => update('prefix', e.target.value)} placeholder="QT-" /></Field><Field label="Valid days"><Input type="number" value={values.valid_days ?? ''} onChange={(e) => update('valid_days', e.target.value)} /></Field></>;
    if (group === 'email') return <><Field label="From name"><Input value={values.from_name ?? ''} onChange={(e) => update('from_name', e.target.value)} /></Field><Field label="From address"><Input type="email" value={values.from_address ?? ''} onChange={(e) => update('from_address', e.target.value)} /></Field><Field label="Mailer"><Input value={values.mailer ?? ''} placeholder="smtp" onChange={(e) => update('mailer', e.target.value)} /></Field><Field label="Payment reminders"><Select value={values.payment_reminders_enabled ?? '1'} onChange={(e) => update('payment_reminders_enabled', e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></Select></Field><Field label="Reminder: 3 days before due"><Select value={values.reminder_due_soon_enabled ?? '1'} onChange={(e) => update('reminder_due_soon_enabled', e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></Select></Field><Field label="Reminder: on due date"><Select value={values.reminder_due_date_enabled ?? '1'} onChange={(e) => update('reminder_due_date_enabled', e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></Select></Field><Field label="Reminder: 3 days overdue"><Select value={values.reminder_overdue_enabled ?? '1'} onChange={(e) => update('reminder_overdue_enabled', e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></Select></Field><Field label="Reminder: 7 days overdue (final)"><Select value={values.reminder_final_enabled ?? '1'} onChange={(e) => update('reminder_final_enabled', e.target.value)}><option value="1">Enabled</option><option value="0">Disabled</option></Select></Field></>;
    return <><Field label="Bank name"><Input value={values.bank_name ?? ''} onChange={(e) => update('bank_name', e.target.value)} /></Field><Field label="Account name"><Input value={values.account_name ?? ''} onChange={(e) => update('account_name', e.target.value)} /></Field><Field label="Account number"><Input value={values.account_number ?? ''} onChange={(e) => update('account_number', e.target.value)} /></Field><Field label="Payment instructions"><Textarea value={values.instructions ?? ''} onChange={(e) => update('instructions', e.target.value)} /></Field></>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1"><span className="block text-sm font-medium text-gray-700">{label}</span>{children}</label>; }

function TestEmail() {
    const [to, setTo] = useState('');
    const mutation = useMutation({ mutationFn: () => settingsApi.testEmail(to) });
    return <div className="border-t pt-4"><Field label="Test recipient"><Input type="email" value={to} onChange={(event) => setTo(event.target.value)} placeholder="you@example.com" /></Field><Button className="mt-2" type="button" size="sm" variant="secondary" loading={mutation.isPending} disabled={!to} onClick={() => mutation.mutate()}>Send Test Email</Button></div>;
}