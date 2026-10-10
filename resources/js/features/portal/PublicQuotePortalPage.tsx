import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portalApi } from '../../api/portal';
import { formatMoney, formatDate } from '../../lib/utils';
import { StatusBadge } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import toast from '../../lib/toast';

export default function PublicQuotePortalPage() {
    const { token } = useParams<{ token: string }>();
    const queryClient = useQueryClient();
    const [confirmAccept, setConfirmAccept] = useState(false);
    const [confirmReject, setConfirmReject] = useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['public-quote', token],
        queryFn: () => portalApi.getQuote(token!),
        enabled: !!token,
    });

    const acceptMutation = useMutation({
        mutationFn: () => portalApi.acceptQuote(token!),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['public-quote', token] });
            toast.success(res.message || 'Penawaran berhasil disetujui.');
            setConfirmAccept(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menyetujui penawaran.');
        },
    });

    const rejectMutation = useMutation({
        mutationFn: () => portalApi.rejectQuote(token!),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['public-quote', token] });
            toast.success(res.message || 'Penawaran telah ditolak.');
            setConfirmReject(false);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Gagal menolak penawaran.');
        },
    });

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Tautan penawaran berhasil disalin!');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center space-y-2">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-sm text-gray-500">Memuat rincian penawaran...</p>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-6 rounded-xl border shadow-sm text-center space-y-3">
                    <span className="text-4xl">🔍</span>
                    <h2 className="text-lg font-semibold text-gray-900">Penawaran Tidak Ditemukan</h2>
                    <p className="text-xs text-gray-500">
                        Tautan penawaran yang Anda tuju mungkin salah atau telah kadaluarsa.
                    </p>
                </div>
            </div>
        );
    }

    const { quote, company } = data;
    const canRespond = ['draft', 'sent', 'viewed'].includes(quote.status);

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Top Action Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl shadow-xs border">
                    <div className="flex items-center gap-3">
                        {company?.logo ? (
                            <img src={company.logo} alt={company.name} className="h-10 w-auto object-contain max-w-[120px]" />
                        ) : (
                            <div className="font-bold text-gray-900 text-lg">{company?.name || 'Quotation'}</div>
                        )}
                        <span className="text-xs font-mono text-gray-400">| Portal Penawaran</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={handleCopyLink}>
                            🔗 Salin Tautan
                        </Button>
                        <a
                            href={`/api/public/quotes/${token}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center font-medium rounded-md text-sm transition-colors shadow-xs h-9 px-3 bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                            📥 Download PDF
                        </a>
                    </div>
                </div>

                {/* Status Notice Banner if Responded */}
                {quote.status === 'accepted' && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-3">
                        <span className="text-2xl">🎉</span>
                        <div>
                            <strong className="font-semibold block text-sm">Penawaran Telah Anda Setujui</strong>
                            Terima kasih atas persetujuan Anda! Pihak kami akan segera menghubungi Anda untuk langkah selanjutnya dan penerbitan invoice resmi.
                        </div>
                    </div>
                )}

                {quote.status === 'rejected' && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs flex items-center gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div>
                            <strong className="font-semibold block text-sm">Penawaran Telah Ditolak</strong>
                            Status penawaran ini telah ditandai ditolak. Silakan hubungi kami apabila Anda membutuhkan revisi atau negosiasi ulang.
                        </div>
                    </div>
                )}

                {/* Main Quote Card */}
                <div className="bg-white rounded-xl shadow-xs border p-6 sm:p-10 space-y-8">
                    {/* Header: Company & Quote Info */}
                    <div className="flex flex-col sm:flex-row justify-between gap-6 pb-6 border-b">
                        <div className="space-y-1.5">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PENAWARAN HARGA</h1>
                            <div className="font-mono text-indigo-600 font-semibold">{quote.quote_number}</div>
                            <div className="pt-2">
                                <StatusBadge status={quote.status} />
                            </div>
                        </div>

                        <div className="text-right space-y-1 text-xs text-gray-600">
                            <div className="font-semibold text-gray-900 text-sm">{company?.name}</div>
                            {company?.address && <div className="whitespace-pre-line">{company.address}</div>}
                            {company?.email && <div>Email: {company.email}</div>}
                            {company?.phone && <div>Telp: {company.phone}</div>}
                        </div>
                    </div>

                    {/* Meta: Recipient & Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b text-xs">
                        <div className="space-y-1">
                            <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">Diajukan Kepada:</span>
                            <div className="text-sm font-semibold text-gray-900">{quote.customer?.company_name}</div>
                            {quote.customer?.contact_name && <div className="text-gray-600">Up: {quote.customer.contact_name}</div>}
                            {quote.customer?.address && <div className="text-gray-500 whitespace-pre-line">{quote.customer.address}</div>}
                            {quote.customer?.email && <div className="text-gray-500">{quote.customer.email}</div>}
                        </div>

                        <div className="space-y-2 sm:text-right">
                            <div>
                                <span className="text-gray-500">Tanggal Penawaran: </span>
                                <span className="font-semibold text-gray-900">{formatDate(quote.quote_date)}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Berlaku Hingga: </span>
                                <span className="font-semibold text-amber-600">{quote.valid_until ? formatDate(quote.valid_until) : '-'}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs text-gray-500 block">Total Estimasi Biaya:</span>
                                <span className="text-xl font-bold text-indigo-600 font-mono">
                                    {formatMoney(quote.total, quote.currency)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b text-gray-500 font-medium">
                                    <th className="py-2.5">Deskripsi Layanan / Produk</th>
                                    <th className="py-2.5 text-center">Jumlah</th>
                                    <th className="py-2.5 text-right">Harga Satuan</th>
                                    <th className="py-2.5 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {quote.items?.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 pr-2">
                                            <div className="font-medium text-gray-900">{item.description}</div>
                                        </td>
                                        <td className="py-3 text-center">{item.quantity}</td>
                                        <td className="py-3 text-right font-mono">{formatMoney(item.unit_price, quote.currency)}</td>
                                        <td className="py-3 text-right font-semibold text-gray-900 font-mono">
                                            {formatMoney(item.total, quote.currency)}
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
                                <span className="font-mono">{formatMoney(quote.subtotal, quote.currency)}</span>
                            </div>
                            {quote.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Diskon</span>
                                    <span className="font-mono">-{formatMoney(quote.discount, quote.currency)}</span>
                                </div>
                            )}
                            {quote.tax_amount > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Pajak ({quote.tax_rate}%)</span>
                                    <span className="font-mono">{formatMoney(quote.tax_amount, quote.currency)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t">
                                <span>Total Penawaran</span>
                                <span className="font-mono">{formatMoney(quote.total, quote.currency)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes & Terms */}
                    {(quote.notes || quote.terms) && (
                        <div className="pt-4 border-t text-xs text-gray-500 space-y-3">
                            {quote.notes && (
                                <div>
                                    <span className="font-semibold text-gray-700 block">Catatan:</span>
                                    <p className="whitespace-pre-line">{quote.notes}</p>
                                </div>
                            )}
                            {quote.terms && (
                                <div>
                                    <span className="font-semibold text-gray-700 block">Syarat & Ketentuan:</span>
                                    <p className="whitespace-pre-line">{quote.terms}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Interactive Response Actions */}
                {canRespond && (
                    <div className="bg-white rounded-xl shadow-xs border p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-0.5">
                            <h4 className="font-semibold text-sm text-gray-900">Apakah Anda menyetujui penawaran ini?</h4>
                            <p className="text-xs text-gray-500">
                                Klik tombol di samping untuk mengonfirmasi persetujuan proyek Anda.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setConfirmReject(true)}
                                className="flex-1 sm:flex-initial"
                            >
                                Tolak
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setConfirmAccept(true)}
                                className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                                ✓ Setujui Penawaran
                            </Button>
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    open={confirmAccept}
                    title="Setujui Penawaran Harga?"
                    message={`Anda akan menyetujui penawaran ${quote.quote_number} sejumlah ${formatMoney(quote.total, quote.currency)}. Pihak penyedia layanan akan segera menindaklanjuti untuk pembuatan invoice dan eksekusi.`}
                    confirmText="Ya, Setujui"
                    cancelText="Batal"
                    onConfirm={() => acceptMutation.mutate()}
                    onCancel={() => setConfirmAccept(false)}
                />

                <ConfirmDialog
                    open={confirmReject}
                    title="Tolak Penawaran Harga?"
                    message={`Apakah Anda yakin ingin menolak penawaran ${quote.quote_number}?`}
                    confirmText="Tolak Penawaran"
                    cancelText="Batal"
                    danger
                    onConfirm={() => rejectMutation.mutate()}
                    onCancel={() => setConfirmReject(false)}
                />

                <div className="text-center text-xs text-gray-400 py-4">
                    Invoice Management System · Secure Client Portal
                </div>
            </div>
        </div>
    );
}
