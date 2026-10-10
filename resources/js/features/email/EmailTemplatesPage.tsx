import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailApi } from '../../api/email';
import { Card, CardBody, CardHeader, PageHeader, StatusBadge } from '../../components/ui/Display';
import { Field, Input, Textarea } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import toast from '../../lib/toast';

interface PlaceholderItem {
    tag: string;
    description: string;
}

const COMMON_PLACEHOLDERS: PlaceholderItem[] = [
    { tag: '{{company.name}}', description: 'Nama perusahaan Anda' },
    { tag: '{{company.email}}', description: 'Email resmi perusahaan' },
    { tag: '{{company.phone}}', description: 'Nomor telepon perusahaan' },
    { tag: '{{company.website}}', description: 'Website perusahaan' },
    { tag: '{{company.address}}', description: 'Alamat lengkap kantor' },
    { tag: '{{customer.name}}', description: 'Nama klien / kontak customer' },
    { tag: '{{customer.email}}', description: 'Alamat email klien' },
];

const INVOICE_PLACEHOLDERS: PlaceholderItem[] = [
    { tag: '{{invoice.number}}', description: 'Nomor invoice (mis. INV-2026-0001)' },
    { tag: '{{invoice.date}}', description: 'Tanggal terbit invoice' },
    { tag: '{{invoice.due_date}}', description: 'Tanggal jatuh tempo invoice' },
    { tag: '{{invoice.currency}}', description: 'Mata uang (IDR, USD, dll)' },
    { tag: '{{invoice.subtotal}}', description: 'Total sebelum pajak' },
    { tag: '{{invoice.tax}}', description: 'Nominal pajak' },
    { tag: '{{invoice.total}}', description: 'Total tagihan invoice' },
    { tag: '{{invoice.paid}}', description: 'Jumlah yang telah dibayarkan' },
    { tag: '{{invoice.balance}}', description: 'Sisa tagihan yang belum lunas' },
    { tag: '{{invoice.status}}', description: 'Status invoice (sent, paid, overdue)' },
];

const QUOTE_PLACEHOLDERS: PlaceholderItem[] = [
    { tag: '{{quote.number}}', description: 'Nomor penawaran (mis. QT-2026-0001)' },
    { tag: '{{quote.date}}', description: 'Tanggal penawaran dibuat' },
    { tag: '{{quote.valid_until}}', description: 'Batas akhir masa berlaku penawaran' },
    { tag: '{{quote.currency}}', description: 'Mata uang penawaran' },
    { tag: '{{quote.subtotal}}', description: 'Total sebelum pajak' },
    { tag: '{{quote.tax}}', description: 'Nominal pajak' },
    { tag: '{{quote.total}}', description: 'Total nilai penawaran' },
    { tag: '{{quote.status}}', description: 'Status quote' },
];

const PAYMENT_PLACEHOLDERS: PlaceholderItem[] = [
    { tag: '{{payment.number}}', description: 'Nomor tanda terima pembayaran' },
    { tag: '{{payment.date}}', description: 'Tanggal pembayaran diterima' },
    { tag: '{{payment.amount}}', description: 'Nominal pembayaran' },
    { tag: '{{payment.currency}}', description: 'Mata uang pembayaran' },
    { tag: '{{payment.method}}', description: 'Metode pembayaran (Bank Transfer, dll)' },
    { tag: '{{payment.reference}}', description: 'Nomor referensi bukti transfer' },
];

export default function EmailTemplatesPage() {
    const queryClient = useQueryClient();
    const { data: templates, isLoading } = useQuery({ queryKey: ['email-templates'], queryFn: emailApi.templates });
    const { data: logs } = useQuery({ queryKey: ['email-logs'], queryFn: emailApi.logs });

    const [selectedSlug, setSelectedSlug] = useState('invoice');
    const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
    const [form, setForm] = useState({ name: '', subject: '', body: '' });

    const selected = templates?.find((template) => template.slug === selectedSlug);

    useEffect(() => {
        if (selected) {
            setForm({
                name: selected.name,
                subject: selected.subject,
                body: selected.body,
            });
        }
    }, [selected]);

    const save = useMutation({
        mutationFn: () => emailApi.saveTemplate({
            slug: selectedSlug,
            name: form.name,
            subject: form.subject,
            body: form.body,
        }),
        onSuccess: () => {
            toast.success('Template berhasil disimpan.');
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menyimpan template email.');
        },
    });

    const restore = useMutation({
        mutationFn: () => emailApi.restoreTemplate(selectedSlug),
        onSuccess: () => {
            toast.success('Template berhasil dikembalikan ke standar bawaan sistem.');
            queryClient.invalidateQueries({ queryKey: ['email-templates'] });
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal merestore template email.');
        },
    });

    const getSpecificPlaceholders = () => {
        if (selectedSlug.startsWith('quote')) return QUOTE_PLACEHOLDERS;
        if (selectedSlug === 'payment_received') return PAYMENT_PLACEHOLDERS;
        return INVOICE_PLACEHOLDERS;
    };

    const insertVariable = (tag: string) => {
        setForm((prev) => ({
            ...prev,
            body: prev.body + tag,
        }));
        toast.info(`Variabel ${tag} ditambahkan ke akhir teks.`);
    };

    // Simple mock replacement for live preview
    const renderPreviewHtml = () => {
        let content = form.body;
        const mockValues: Record<string, string> = {
            'company.name': 'PT Nusantara Jaya Mandiri',
            'company.email': 'finance@nusantara.id',
            'company.phone': '+62 21 555-0199',
            'company.website': 'https://nusantara.id',
            'company.address': 'Jl. Jenderal Sudirman No. 45, Jakarta Selatan',
            'customer.name': 'PT Mitra Abadi Sejahtera',
            'customer.email': 'accounting@mitraabadi.co.id',
            'invoice.number': 'INV-2026-0089',
            'invoice.date': '10 Okt 2026',
            'invoice.due_date': '24 Okt 2026',
            'invoice.currency': 'IDR',
            'invoice.subtotal': '15.000.000',
            'invoice.tax': '1.650.000',
            'invoice.total': '16.650.000',
            'invoice.paid': '0',
            'invoice.balance': '16.650.000',
            'invoice.status': 'sent',
            'quote.number': 'QT-2026-0042',
            'quote.date': '10 Okt 2026',
            'quote.valid_until': '24 Okt 2026',
            'quote.currency': 'IDR',
            'quote.subtotal': '25.000.000',
            'quote.tax': '2.750.000',
            'quote.total': '27.750.000',
            'quote.status': 'sent',
            'payment.number': 'PAY-2026-0012',
            'payment.date': '10 Okt 2026',
            'payment.amount': '16.650.000',
            'payment.currency': 'IDR',
            'payment.method': 'Bank Transfer',
            'payment.reference': 'TRX-BCA-987123',
        };

        Object.entries(mockValues).forEach(([key, val]) => {
            content = content.replace(new RegExp(`\\{\\{\\s*${key.replace('.', '\\.')}\\s*\\}\\}`, 'g'), val);
        });

        return content;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="Email Automation"
                subtitle="Kustomisasi template notifikasi email otomatis dan pantau riwayat pengiriman email sistem."
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* List of Templates */}
                <div className="lg:col-span-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <h3 className="font-semibold text-gray-900">Daftar Template Email</h3>
                        </CardHeader>
                        <CardBody className="p-2 space-y-1">
                            {templates?.map((template) => {
                                const isSelected = selectedSlug === template.slug;
                                return (
                                    <button
                                        key={template.slug}
                                        type="button"
                                        onClick={() => {
                                            setSelectedSlug(template.slug);
                                            setActiveTab('edit');
                                        }}
                                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                                            isSelected
                                                ? 'bg-indigo-50 text-indigo-800 font-semibold border-l-4 border-indigo-600'
                                                : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-medium">{template.name}</div>
                                            <div className="text-xs text-gray-400 font-mono mt-0.5">{template.slug}</div>
                                        </div>
                                        <span
                                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                                                template.is_custom
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {template.is_custom ? 'Custom' : 'Default'}
                                        </span>
                                    </button>
                                );
                            })}
                        </CardBody>
                    </Card>

                    {/* Placeholder Reference Box */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Variabel Dinamis ({selectedSlug})</h3>
                                <span className="text-xs text-gray-500">Klik untuk menyisipkan</span>
                            </div>
                        </CardHeader>
                        <CardBody className="space-y-4 text-xs">
                            <div>
                                <div className="font-semibold text-gray-600 mb-1.5 uppercase tracking-wide text-[10px]">
                                    Data Model ({selectedSlug.includes('quote') ? 'Quote' : selectedSlug === 'payment_received' ? 'Payment' : 'Invoice'})
                                </div>
                                <div className="space-y-1">
                                    {getSpecificPlaceholders().map((p) => (
                                        <button
                                            key={p.tag}
                                            type="button"
                                            onClick={() => insertVariable(p.tag)}
                                            className="w-full text-left p-1.5 rounded hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 transition flex items-center justify-between group"
                                            title={p.description}
                                        >
                                            <code className="text-indigo-600 font-bold group-hover:text-indigo-700">{p.tag}</code>
                                            <span className="text-[11px] text-gray-400 truncate max-w-[140px]">{p.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t pt-3">
                                <div className="font-semibold text-gray-600 mb-1.5 uppercase tracking-wide text-[10px]">
                                    Data Perusahaan & Customer
                                </div>
                                <div className="space-y-1">
                                    {COMMON_PLACEHOLDERS.map((p) => (
                                        <button
                                            key={p.tag}
                                            type="button"
                                            onClick={() => insertVariable(p.tag)}
                                            className="w-full text-left p-1.5 rounded hover:bg-indigo-50/70 border border-transparent hover:border-indigo-100 transition flex items-center justify-between group"
                                            title={p.description}
                                        >
                                            <code className="text-indigo-600 font-bold group-hover:text-indigo-700">{p.tag}</code>
                                            <span className="text-[11px] text-gray-400 truncate max-w-[140px]">{p.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {/* Editor / Preview Area */}
                <div className="lg:col-span-8">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-gray-900">
                                        {selected?.name ?? 'Editor Template'}
                                    </h3>
                                    {selected?.is_custom && (
                                        <span className="text-xs bg-purple-100 text-purple-700 font-medium px-2 py-0.5 rounded">
                                            Customized
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('edit')}
                                            className={`px-3 py-1 rounded-md font-medium transition ${
                                                activeTab === 'edit'
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Editor
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('preview')}
                                            className={`px-3 py-1 rounded-md font-medium transition ${
                                                activeTab === 'preview'
                                                    ? 'bg-white text-indigo-600 shadow-sm'
                                                    : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                        >
                                            Live Preview
                                        </button>
                                    </div>

                                    {selected?.is_custom && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => restore.mutate()}
                                            loading={restore.isPending}
                                            title="Kembalikan format teks ke bawaan sistem"
                                        >
                                            Restore Default
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>

                        <CardBody>
                            {activeTab === 'edit' ? (
                                <form
                                    className="space-y-4"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        save.mutate();
                                    }}
                                >
                                    <Field label="Nama Template">
                                        <Input
                                            value={form.name}
                                            onChange={(event) => setForm({ ...form, name: event.target.value })}
                                            placeholder="Nama template"
                                            required
                                        />
                                    </Field>

                                    <Field label="Subjek Email (Subject)">
                                        <Input
                                            value={form.subject}
                                            onChange={(event) => setForm({ ...form, subject: event.target.value })}
                                            placeholder="Subjek email..."
                                            required
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Variabel dinamis seperti <code>{'{{invoice.number}}'}</code> dapat digunakan di subjek email.
                                        </p>
                                    </Field>

                                    <Field label="Konten HTML (Body)">
                                        <Textarea
                                            rows={14}
                                            value={form.body}
                                            onChange={(event) => setForm({ ...form, body: event.target.value })}
                                            className="font-mono text-sm leading-relaxed"
                                            placeholder="<p>Halo {{customer.name}}, ...</p>"
                                            required
                                        />
                                    </Field>

                                    <div className="flex items-center justify-between pt-3 border-t">
                                        <p className="text-xs text-gray-500">
                                            Perubahan template akan langsung diterapkan pada pengiriman email berikutnya.
                                        </p>
                                        <Button type="submit" loading={save.isPending}>
                                            Simpan Template
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-3 bg-gray-50 border rounded-lg text-sm space-y-1">
                                        <div className="flex gap-2">
                                            <span className="font-semibold text-gray-600">Subjek:</span>
                                            <span className="text-gray-900 font-medium">
                                                {form.subject.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (match, p1) => {
                                                    const demoMap: Record<string, string> = {
                                                        'invoice.number': 'INV-2026-0089',
                                                        'quote.number': 'QT-2026-0042',
                                                        'payment.number': 'PAY-2026-0012',
                                                        'company.name': 'PT Nusantara Jaya Mandiri',
                                                        'customer.name': 'PT Mitra Abadi Sejahtera',
                                                    };
                                                    return demoMap[p1] || match;
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border rounded-lg p-6 bg-white min-h-[300px] shadow-inner prose prose-indigo max-w-none text-sm">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: renderPreviewHtml(),
                                            }}
                                        />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button variant="secondary" onClick={() => setActiveTab('edit')}>
                                            Kembali ke Editor
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Email Logs Table */}
            <Card className="mt-8">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Riwayat Pengiriman Email (Delivery Logs)</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Daftar email yang telah dikirim atau dijadwalkan oleh sistem.</p>
                        </div>
                    </div>
                </CardHeader>
                <CardBody>
                    <div className="divide-y divide-gray-100">
                        {logs?.data?.length ? (
                            logs.data.map((log) => (
                                <div key={log.id} className="py-3 flex items-center justify-between text-sm">
                                    <div className="space-y-0.5">
                                        <div className="font-medium text-gray-900">{log.subject}</div>
                                        <div className="text-xs text-gray-500">
                                            Penerima: <span className="font-mono text-gray-700">{log.to_email}</span> · Template:{' '}
                                            <span className="font-mono text-indigo-600">{log.template_slug}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge status={log.status} />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 py-6 text-center">Belum ada riwayat email yang dikirim.</p>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}