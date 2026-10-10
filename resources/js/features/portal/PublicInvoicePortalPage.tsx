import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalApi } from '../../api/portal';
import { formatMoney, formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { Input, Textarea, Field } from '../../components/ui/Form';
import toast from '../../lib/toast';

export default function PublicInvoicePortalPage() {
    const { token } = useParams<{ token: string }>();
    const queryClient = useQueryClient();
    const [file, setFile] = useState<File | null>(null);
    const [notes, setNotes] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { data, isLoading, error } = useQuery({
        queryKey: ['public-invoice', token],
        queryFn: () => portalApi.getInvoice(token!),
        enabled: !!token,
    });

    const uploadMutation = useMutation({
        mutationFn: () => portalApi.uploadProof(token!, file!, notes),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['public-invoice', token] });
            toast.success(res.message || 'Bukti pembayaran berhasil diunggah.');
            setFile(null);
            setNotes('');
            setPreviewUrl(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal mengunggah bukti pembayaran.');
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
        if (selected && selected.type.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(selected));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleCopyAccount = (accountNumber: string) => {
        navigator.clipboard.writeText(accountNumber);
        toast.success(`Nomor rekening ${accountNumber} berhasil disalin!`);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Tautan invoice berhasil disalin!');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center space-y-2">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-500">Memuat rincian invoice...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-6 rounded-xl border shadow-sm text-center space-y-3">
                    <span className="text-4xl">🔍</span>
                    <h2 className="text-lg font-semibold text-gray-900">Invoice Tidak Ditemukan</h2>
                    <p className="text-xs text-gray-500">
                        Tautan yang Anda tuju mungkin salah atau telah kadaluarsa. Harap hubungi pihak penyedia layanan untuk informasi lebih lanjut.
                    </p>
                </div>
            </div>
        );
    }

    const { invoice, company, bank } = data;
    const isPaid = invoice.status === 'paid';
    const isPendingProof = invoice.payment_proof_status === 'pending';
    const isRejectedProof = invoice.payment_proof_status === 'rejected';

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Top Action Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border">
                    <div className="flex items-center gap-3">
                        {company?.logo ? (
                            <img src={company.logo} alt={company.name} className="h-10 w-auto object-contain max-w-[120px]" />
                        ) : (
                            <div className="font-bold text-gray-900 text-lg">{company?.name || 'Invoice'}</div>
                        )}
                        <span className="text-xs font-mono text-gray-400">| Portal Klien</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                            🔗 Salin Tautan
                        </Button>
                        <a
                            href={`/api/public/invoices/${token}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center font-medium rounded-md text-sm transition-colors shadow-xs h-9 px-3 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            📥 Download PDF
                        </a>
                    </div>
                </div>

                {/* Main Invoice Card */}
                <div className="bg-white rounded-xl shadow-xs border p-6 sm:p-10 space-y-8">
                    {/* Header: Company & Invoice Info */}
                    <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b">
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
                            <div className="font-mono text-indigo-600 font-semibold">{invoice.invoice_number}</div>
                            <div className="pt-2">
                                <StatusBadge status={invoice.status} />
                            </div>
                        </div>

                        <div className="text-right space-y-1 text-xs text-gray-600">
                            <div className="font-semibold text-gray-900 text-sm">{company?.name}</div>
                            {company?.address && <div className="whitespace-pre-line">{company.address}</div>}
                            {company?.email && <div>Email: {company.email}</div>}
                            {company?.phone && <div>Telp: {company.phone}</div>}
                            {company?.tax_number && <div>NPWP: {company.tax_number}</div>}
                        </div>
                    </div>

                    {/* Meta: Billed To & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b text-xs">
                        <div className="space-y-1">
                            <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">Ditagihkan Kepada:</span>
                            <div className="text-sm font-semibold text-gray-900">{invoice.customer?.company_name}</div>
                            {invoice.customer?.contact_name && <div className="text-gray-600">Up: {invoice.customer.contact_name}</div>}
                            {invoice.customer?.address && <div className="text-gray-500 whitespace-pre-line">{invoice.customer.address}</div>}
                            {invoice.customer?.email && <div className="text-gray-500">{invoice.customer.email}</div>}
                            {invoice.customer?.phone && <div className="text-gray-500">{invoice.customer.phone}</div>}
                        </div>

                        <div className="space-y-2 sm:text-right">
                            <div>
                                <span className="text-gray-500">Tanggal Terbit: </span>
                                <span className="font-semibold text-gray-900">{formatDate(invoice.invoice_date)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Jatuh Tempo: </span>
                                <span className="font-semibold text-rose-600">{formatDate(invoice.due_date)}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs text-gray-500 block">Sisa Tagihan:</span>
                                <span className="text-xl font-bold text-indigo-600 font-mono">
                                    {formatMoney(invoice.balance, invoice.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b text-gray-500 font-medium">
                                    <th className="py-2.5">Deskripsi Item</th>
                                    <th className="py-2.5 text-center">Jumlah</th>
                                    <th className="py-2.5 text-right">Harga Satuan</th>
                                    <th className="py-2.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 pr-2">
                                            <div className="font-medium text-gray-900">{item.description}</div>
                                        </td>
                                        <td className="py-3 text-center">{item.quantity}</td>
                                        <td className="py-3 text-right font-mono">{formatMoney(item.unit_price, invoice.currency)}</td>
                                        <td className="py-3 text-right font-semibold text-gray-900 font-mono">
                                            {formatMoney(item.total, invoice.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Totals */}
                    <div className="flex flex-col sm:flex-row justify-end pt-4 border-t">
                        <div className="w-full sm:w-72 space-y-2 text-xs">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatMoney(invoice.subtotal, invoice.currency)}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Diskon</span>
                                    <span className="font-mono">-{formatMoney(invoice.discount, invoice.currency)}</span>
                                </div>
                            )}
                            {invoice.tax_amount > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Pajak ({invoice.tax_rate}%)</span>
                                    <span className="font-mono">{formatMoney(invoice.tax_amount, invoice.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                                <span>Total Tagihan</span>
                                <span className="font-mono">{formatMoney(invoice.total, invoice.currency)}</span>
                            </div>
                            {invoice.paid_amount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-medium">
                                    <span>Telah Dibayar</span>
                                    <span className="font-mono">{formatMoney(invoice.paid_amount, invoice.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-indigo-700 bg-indigo-50 p-2 rounded">
                                <span>Sisa Pembayaran</span>
                                <span className="font-mono">{formatMoney(invoice.balance, invoice.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    {(invoice.notes || invoice.terms) && (
                        <div className="pt-4 border-t text-xs text-gray-500 space-y-3">
                            {invoice.notes && (
                                <div>
                                    <span className="font-semibold text-gray-700 block">Catatan:</span>
                                    <p className="whitespace-pre-line">{invoice.notes}</p>
                                </div>
                            )}
                            {invoice.terms && (
                                <div>
                                    <span className="font-semibold text-gray-700 block">Syarat & Ketentuan:</span>
                                    <p className="whitespace-pre-line">{invoice.terms}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Bank Account Transfer & Payment Box */}
                {bank?.account_number && (
                    <div className="bg-white rounded-xl shadow-xs border p-6 space-y-3">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">🏦</span>
                            <h3 className="font-semibold text-sm text-gray-900">Rekening Tujuan Pembayaran</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 border rounded-lg">
                            <div className="space-y-0.5">
                                <div className="text-xs text-gray-500">{bank.bank_name || 'Bank Transfer'}</div>
                                <div className="text-lg font-bold font-mono text-gray-900 tracking-wider">
                                    {bank.account_number}
                                </div>
                                <div className="text-xs text-gray-600">a/n {bank.account_name || company?.name}</div>
                            </div>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleCopyAccount(bank.account_number!)}
                            >
                                📋 Salin Nomor Rekening
                            </Button>
                        </div>
                        {bank.instructions && (
                            <p className="text-xs text-gray-500 whitespace-pre-line pt-1">{bank.instructions}</p>
                        )}
                    </div>
                )}

                {/* Upload Payment Proof Section */}
                <div className="bg-white rounded-xl shadow-xs border p-6 space-y-4">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">🧾</span>
                        <h3 className="font-semibold text-sm text-gray-900">Konfirmasi Bukti Transfer (Payment Proof)</h3>
                    </div>

                    {isPaid ? (
                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                                <strong className="font-semibold block text-sm">Invoice Telah Lunas</strong>
                                Pembayaran untuk invoice ini telah diverifikasi dan lunas. Tidak diperlukan unggahan bukti lagi.
                            </div>
                        </div>
                    ) : (
                        <>
                            {isPendingProof && (
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">⏳</span>
                                        <div>
                                            <strong className="font-semibold block">Bukti Pembayaran Sedang Diverifikasi</strong>
                                            Unggahan bukti transfer Anda sedang ditinjau oleh pihak admin. Kami akan memperbarui status invoice setelah konfirmasi selesai.
                                        </div>
                                    </div>
                                    {invoice.payment_proof_path && (
                                        <a
                                            href={invoice.payment_proof_path}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-indigo-600 underline font-medium whitespace-nowrap"
                                        >
                                            Lihat Bukti
                                        </a>
                                    )}
                                </div>
                            )}

                            {isRejectedProof && (
                                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs flex items-center gap-3">
                                    <span className="text-2xl">⚠️</span>
                                    <div>
                                        <strong className="font-semibold block">Bukti Pembayaran Ditolak</strong>
                                        {invoice.payment_proof_notes || 'Bukti transfer tidak sesuai atau tidak terbaca.'} Silakan unggah bukti transfer yang valid di bawah ini.
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                <p className="text-xs text-gray-500">
                                    Setelah melakukan transfer bank, silakan unggah foto / tangkapan layar (screenshot) bukti transfer Anda agar dapat diverifikasi oleh admin.
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                    <Field label="Pilih File Bukti Transfer (JPG, PNG, PDF maks 5MB)" required>
                                        <Input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={handleFileChange}
                                        />
                                    </Field>

                                    <Field label="Catatan Tambahan (Opsional)">
                                        <Textarea
                                            placeholder="Contoh: Transfer dari rekening a/n Budi Santoso"
                                            rows={2}
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                        />
                                    </Field>
                                </div>

                                {previewUrl && (
                                    <div className="space-y-1">
                                        <span className="text-xs text-gray-500 font-medium">Pratinjau Gambar:</span>
                                        <div className="w-48 h-48 border rounded-lg overflow-hidden bg-gray-50 p-1">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <Button
                                        loading={uploadMutation.isPending}
                                        disabled={!file || uploadMutation.isPending}
                                        onClick={() => uploadMutation.mutate()}
                                    >
                                        {uploadMutation.isPending ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="text-center text-xs text-gray-400 py-4">
                    Invoice Management System · Secure Client Portal
                </div>
            </div>
        </div>
    );
}
