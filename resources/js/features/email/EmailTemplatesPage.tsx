import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '../../api/email';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge } from '../../components/ui/Display';
import { Field, Input, Select, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';

export default function EmailTemplatesPage() {
    const queryClient = useQueryClient();
    const { data: templates, isLoading } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.templates });
    const { data: logs } = useQuery({ queryKey: ['email-logs'], queryFn: emailApi.logs });
    const [selectedSlug, setSelectedSlug] = useState('invoice');
    const selected = templates?.find((template) => template.slug === selectedSlug);
    const [form, setForm] = useState({ name: '', subject: '', body: '' });
    useEffect(() => { if (selected) setForm({ name: selected.name, subject: selected.subject, body: selected.body }); }, [selected]);
    const save = useMutation({ mutationFn: () => emailApi.updateTemplate(selected!.id, form), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }) });
    const restore = useMutation({ mutationFn: () => emailApi.restoreTemplate(selectedSlug), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['email-templates'] }) });

    if (isLoading) return <div>Loading...</div>;
    return <>
        <PageHeader title="Email Automation" subtitle="Manage message templates and delivery history." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card><CardHeader><h3 className="font-medium">Templates</h3></CardHeader><CardBody className="space-y-1">{templates?.map((template) => <button key={template.slug} onClick={() => setSelectedSlug(template.slug)} className={`w-full text-left px-3 py-2 rounded text-sm ${selectedSlug === template.slug ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}><span className="font-medium">{template.name}</span><span className="block text-xs text-gray-500">{template.is_custom ? 'Custom' : 'Default'}</span></button>)}</CardBody></Card>
            <Card className="lg:col-span-2"><CardHeader><div className="flex justify-between items-center"><h3 className="font-medium">{selected?.name ?? 'Template'}</h3><Button size="sm" variant="secondary" onClick={() => restore.mutate()} loading={restore.isPending}>Restore Default</Button></div></CardHeader><CardBody><form className="space-y-4" onSubmit={(event) => { event.preventDefault(); save.mutate(); }}><Field label="Name"><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Subject"><Input value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /></Field><Field label="HTML Body"><Textarea rows={14} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field><div className="flex justify-end"><Button type="submit" loading={save.isPending}>Save Template</Button></div></form></CardBody></Card>
        </div>
        <Card className="mt-6"><CardHeader><h3 className="font-medium">Recent Email Logs</h3></CardHeader><CardBody><div className="divide-y">{logs?.data?.length ? logs.data.map((log) => <div key={log.id} className="py-3 flex items-center justify-between text-sm"><div><div className="font-medium">{log.subject}</div><div className="text-gray-500">{log.to_email} · {log.template_slug}</div></div><StatusBadge status={log.status} /></div>) : <p className="text-sm text-gray-500">No email logs yet.</p>}</div></CardBody></Card>
    </>;
}