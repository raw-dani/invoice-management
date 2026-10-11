import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    useQuote,
    useSendQuote,
    useAcceptQuote,
    useRejectQuote,
    useDeleteQuote,
    useConvertQuote,
    useDuplicateQuote,
    useSendQuoteEmail,
} from './hooks';
import { useEntityActivityLogs } from '../activity/hooks';
import { Card, CardBody, CardHeader, StatusBadge, EmptyState } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { quotesApi } from '../../api/quotes';
import { formatMoney, formatDate } from '../../lib/utils';
import { useState, useRef, useEffect } from 'react';
import toast from '../../lib/toast';
import { downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';
import { WhatsAppShareModal } from '../../components/WhatsAppShareModal';
import { QuoteMilestoneSection } from './QuoteMilestoneSection';
import {
    WhatsAppIcon,
    LinkIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    PencilSquareIcon,
    DocumentDuplicateIcon,
    PaperAirplaneIcon,
    CheckIcon,
    XMarkIcon,
    DocumentTextIcon,
    EnvelopeIcon,
    TrashIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    ChevronDownIcon,
    EllipsisHorizontalIcon,
} from '../../components/ui/Icons';
import type { ActivityLog } from '../../types';

export default function QuoteDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [confirmConvert, setConfirmConvert] = useState(false);
    const [showActivity, setShowActivity] = useState(false);
    const [whatsappOpen, setWhatsappOpen] = useState(false);
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    const { data: quote, isLoading } = useQuote(Number(id));
    const sendQuote = useSendQuote();
    const acceptQuote = useAcceptQuote();
    const rejectQuote = useRejectQuote();
    const convertQuote = useConvertQuote();
    const duplicateQuote = useDuplicateQuote();
    const deleteQuote = useDeleteQuote();
    const sendEmail = useSendQuoteEmail();
    const { data: activityData } = useEntityActivityLogs('Quote', Number(id));

    // Handle outside clicks for More dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
                setMoreOpen(false);
            }
        }
        if (moreOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [moreOpen]);

    if (isLoading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-sm text-gray-500">Memuat rincian penawaran...</p>
                </div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                    title="Penawaran Tidak Ditemukan"
                    message="Penawaran yang Anda cari mungkin telah dihapus atau tidak tersedia."
                    action={
                        <Link to="/quotes">
                            <Button variant="secondary">Kembali ke Daftar Penawaran</Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    const canEdit = ['draft', 'sent', 'viewed', 'rejected', 'expired'].includes(quote.status);
    const canSend = quote.status === 'draft';
    const canAccept = ['sent', 'viewed'].includes(quote.status);
    const canReject = ['sent', 'viewed', 'accepted'].includes(quote.status);
    const canConvert = quote.status === 'accepted';

    return (
        <div className="space-y-6">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
                <Link
                    to="/quotes"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                >
                    <span>&larr;</span>
                    <span>Kembali ke Daftar Penawaran</span>
                </Link>
                <div className="text-xs text-gray-400 font-mono">
                    ID #{quote.id}
                </div>
            </div>

            {/* Document Header & Organized Action Bar */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {quote.quote_number}
                        </h1>
                        <StatusBadge status={quote.status} className="text-xs font-semibold px-2.5 py-0.5" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                        Kepada: <strong className="text-gray-800 font-medium">{quote.customer?.company_name || quote.customer?.contact_name}</strong> · Dibuat pada {formatDate(quote.quote_date)}
                    </p>
                </div>

                {/* Tiered Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Workflow CTA */}
                    {canConvert && (
                        <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                            onClick={() => setConfirmConvert(true)}
                        >
                            <DocumentTextIcon className="w-4 h-4" />
                            <span>Konversi ke Invoice</span>
                        </Button>
                    )}
                    {canSend && (
                        <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                            loading={sendQuote.isPending}
                            onClick={async () => {
                                await sendQuote.mutateAsync(quote.id);
                                toast.success('Penawaran berhasil dikirim ke klien');
                            }}
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            <span>Kirim Penawaran</span>
                        </Button>
                    )}
                    {canAccept && (
                        <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                            loading={acceptQuote.isPending}
                            onClick={async () => {
                                await acceptQuote.mutateAsync(quote.id);
                                toast.success('Penawaran berhasil disetujui');
                            }}
                        >
                            <CheckIcon className="w-4 h-4" />
                            <span>Setujui</span>
                        </Button>
                    )}

                    {/* WhatsApp Action */}
                    <Button
                        size="sm"
                        className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs"
                        onClick={() => setWhatsappOpen(true)}
                    >
                        <WhatsAppIcon className="w-4 h-4" />
                        <span>WhatsApp</span>
                    </Button>

                    {/* Client Portal Link */}
                    <Button
                        size="sm"
                        variant="secondary"
                        className="inline-flex items-center gap-1.5"
                        onClick={() => {
                            const url = `${window.location.origin}/q/${quote.public_token || quote.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Tautan Portal Penawaran berhasil disalin!');
                        }}
                        title="Salin tautan portal klien publik"
                    >
                        <LinkIcon className="w-4 h-4 text-gray-500" />
                        <span className="hidden sm:inline">Portal Klien</span>
                    </Button>

                    {/* PDF Download & Preview Group */}
                    <div className="inline-flex rounded-md shadow-2xs">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-r-none border-r-0 inline-flex items-center gap-1.5"
                            onClick={async () => {
                                try {
                                    await downloadPdf(
                                        pdfUrls.quote(quote.id),
                                        `quote-${quote.quote_number}.pdf`
                                    );
                                    toast.success('PDF berhasil diunduh');
                                } catch {
                                    toast.error('Gagal mengunduh PDF');
                                }
                            }}
                        >
                            <ArrowDownTrayIcon className="w-4 h-4 text-gray-500" />
                            <span>PDF</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-l-none px-2"
                            title="Pratinjau PDF di Tab Baru"
                            onClick={async () => {
                                try {
                                    await openPdfInNewTab(pdfUrls.quote(quote.id));
                                } catch {
                                    toast.error('Gagal membuka preview PDF');
                                }
                            }}
                        >
                            <EyeIcon className="w-4 h-4 text-gray-500" />
                        </Button>
                    </div>

                    {/* More Actions Dropdown */}
                    <div className="relative" ref={moreRef}>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="inline-flex items-center gap-1"
                            onClick={() => setMoreOpen(!moreOpen)}
                            title="Aksi Tambahan"
                        >
                            <EllipsisHorizontalIcon className="w-4 h-4 text-gray-600" />
                            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
                        </Button>

                        {moreOpen && (
                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1.5 z-30 divide-y divide-gray-100 animate-in fade-in">
                                <div className="py-1">
                                    {canEdit && (
                                        <Link
                                            to={`/quotes/${quote.id}/edit`}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setMoreOpen(false)}
                                        >
                                            <PencilSquareIcon className="w-4 h-4 text-gray-500" />
                                            <span>Edit Penawaran</span>
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={async () => {
                                            setMoreOpen(false);
                                            try {
                                                const copy = await quotesApi.duplicate(quote.id);
                                                toast.success(`Penawaran digandakan sebagai ${copy.quote_number}`);
                                                navigate(`/quotes/${copy.id}`);
                                            } catch {
                                                toast.error('Gagal menduplikasi penawaran');
                                            }
                                        }}
                                    >
                                        <DocumentDuplicateIcon className="w-4 h-4 text-gray-500" />
                                        <span>Duplikat Penawaran</span>
                                    </button>
                                    {!['draft'].includes(quote.status) && (
                                        <button
                                            type="button"
                                            disabled={sendEmail.isPending}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                            onClick={async () => {
                                                setMoreOpen(false);
                                                await sendEmail.mutateAsync({ id: quote.id });
                                                toast.success('Email penawaran berhasil dikirim ke klien');
                                            }}
                                        >
                                            <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                                            <span>Kirim Email Klien</span>
                                        </button>
                                    )}
                                </div>

                                {canReject && (
                                    <div className="py-1">
                                        <button
                                            type="button"
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                                            onClick={async () => {
                                                setMoreOpen(false);
                                                await rejectQuote.mutateAsync(quote.id);
                                                toast.success('Penawaran ditolak');
                                            }}
                                        >
                                            <XMarkIcon className="w-4 h-4 text-amber-600" />
                                            <span>Tolak Penawaran</span>
                                        </button>
                                    </div>
                                )}

                                <div className="py-1">
                                    <button
                                        type="button"
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                        onClick={() => {
                                            setMoreOpen(false);
                                            setConfirmDelete(true);
                                        }}
                                    >
                                        <TrashIcon className="w-4 h-4 text-red-500" />
                                        <span>Hapus Penawaran</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Executive KPI Summary Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Penawaran</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <DocumentTextIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-gray-950">
                        {formatMoney(quote.total, quote.currency)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Subtotal {formatMoney(quote.subtotal, quote.currency)}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Klien Tujuan</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <BuildingOfficeIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-base font-semibold text-gray-900 truncate">
                        {quote.customer?.company_name || quote.customer?.contact_name || '-'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 truncate">
                        {quote.customer?.email || quote.customer?.phone || 'Informasi kontak'}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Masa Berlaku</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-base font-semibold text-gray-900">
                        {quote.valid_until ? formatDate(quote.valid_until) : 'Tanpa batas waktu'}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Diterbitkan: {formatDate(quote.quote_date)}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Item & Status</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CheckIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                        <StatusBadge status={quote.status} />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        {quote.items?.length || 0} baris produk / layanan
                    </div>
                </div>
            </div>

            {/* Main Content Layout (Structured 8-cols & 4-cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols): Items Table, Notes & Terms, Milestones, Activity */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Items Table Card */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">Rincian Item Penawaran</h3>
                                <p className="text-xs text-gray-500">Daftar produk atau jasa yang ditawarkan kepada pelanggan</p>
                            </div>
                            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-gray-700 rounded-full">
                                {quote.items?.length || 0} Item
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50/80 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                    <tr>
                                        <th className="py-3 px-4 text-left w-12">#</th>
                                        <th className="py-3 px-4 text-left">Deskripsi Item</th>
                                        <th className="py-3 px-4 text-right w-24">Qty</th>
                                        <th className="py-3 px-4 text-right w-36">Harga Satuan</th>
                                        <th className="py-3 px-4 text-right w-36">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {quote.items?.map((it, idx) => (
                                        <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4 text-xs font-mono text-gray-400">{idx + 1}</td>
                                            <td className="py-3.5 px-4 font-medium text-gray-900">
                                                {it.description}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-gray-700">
                                                {it.quantity}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-gray-600">
                                                {formatMoney(it.unit_price, quote.currency)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-950">
                                                {formatMoney(it.total, quote.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes & Terms Section */}
                    {(quote.notes || quote.terms) && (
                        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 space-y-4">
                            <h3 className="font-semibold text-gray-900 text-sm">Informasi & Ketentuan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {quote.notes && (
                                    <div className="p-3.5 bg-slate-50 rounded-lg border border-gray-200/60 space-y-1">
                                        <span className="font-semibold text-gray-700 block">Catatan Tambahan:</span>
                                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
                                    </div>
                                )}
                                {quote.terms && (
                                    <div className="p-3.5 bg-slate-50 rounded-lg border border-gray-200/60 space-y-1">
                                        <span className="font-semibold text-gray-700 block">Syarat & Ketentuan:</span>
                                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{quote.terms}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Project Milestones / Termin Billing */}
                    <QuoteMilestoneSection quote={quote} />

                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-gray-900">Riwayat Aktivitas</h3>
                                    <p className="text-xs text-gray-500">Log perubahan dan interaksi pada penawaran ini</p>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => setShowActivity(!showActivity)}>
                                    {showActivity ? 'Sembunyikan' : 'Tampilkan'}
                                </Button>
                            </div>
                        </CardHeader>
                        {showActivity && (
                            <CardBody>
                                {!activityData?.data?.length ? (
                                    <EmptyState title="Belum ada riwayat aktivitas" message="Aksi pada penawaran ini akan dicatat di sini." />
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {activityData.data.map((activity: ActivityLog) => (
                                            <div key={activity.id} className="py-3 flex gap-4 items-start">
                                                <div className="mt-1 h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <div className="text-sm text-gray-900">{activity.description}</div>
                                                    <div className="mt-0.5 text-xs text-gray-500">
                                                        {activity.user?.name ?? 'System'} · {formatDate(activity.created_at)}
                                                    </div>
                                                </div>
                                                <div className="text-xs font-mono text-gray-400 uppercase">{activity.action}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        )}
                    </Card>
                </div>

                {/* Right Column (4 cols): Sticky Financial Summary & Customer Info */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Financial Summary Card */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 space-y-4">
                        <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Ringkasan Biaya</h3>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatMoney(quote.subtotal, quote.currency)}</span>
                            </div>
                            {quote.discount > 0 && (
                                <div className="flex justify-between text-rose-600">
                                    <span>{quote.discount_type === 1 ? `Diskon (${quote.discount}%)` : 'Diskon'}</span>
                                    <span className="font-mono">
                                        -{formatMoney(quote.discount_type === 1 ? quote.subtotal * (quote.discount / 100) : quote.discount, quote.currency)}
                                    </span>
                                </div>
                            )}
                            {quote.tax_amount > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Pajak ({quote.tax_rate}%)</span>
                                    <span className="font-mono">+{formatMoney(quote.tax_amount, quote.currency)}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline font-bold text-gray-950">
                                <span className="text-base">Total Penawaran</span>
                                <span className="text-xl font-mono text-indigo-600">{formatMoney(quote.total, quote.currency)}</span>
                            </div>
                        </div>

                        <div className="pt-3 border-t text-xs text-gray-500 space-y-1 bg-slate-50 p-3 rounded-lg">
                            <div className="flex justify-between">
                                <span>Tanggal Terbit:</span>
                                <span className="font-medium text-gray-700">{formatDate(quote.quote_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Berlaku Hingga:</span>
                                <span className="font-medium text-gray-700">{quote.valid_until ? formatDate(quote.valid_until) : '-'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details Card */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-semibold text-gray-900 text-sm">Rincian Klien</h3>
                            <Link
                                to={`/customers/${quote.customer_id}`}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Lihat Profil &rarr;
                            </Link>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-gray-400 block">Nama Perusahaan</span>
                                <span className="font-semibold text-gray-900 text-sm">{quote.customer?.company_name || '-'}</span>
                            </div>
                            {quote.customer?.contact_name && (
                                <div>
                                    <span className="text-gray-400 block">Kontak Personal</span>
                                    <span className="text-gray-700 font-medium">{quote.customer.contact_name}</span>
                                </div>
                            )}
                            {quote.customer?.email && (
                                <div>
                                    <span className="text-gray-400 block">Email</span>
                                    <span className="text-gray-700">{quote.customer.email}</span>
                                </div>
                            )}
                            {quote.customer?.phone && (
                                <div>
                                    <span className="text-gray-400 block">Telepon</span>
                                    <span className="text-gray-700">{quote.customer.phone}</span>
                                </div>
                            )}
                            {quote.customer?.address && (
                                <div>
                                    <span className="text-gray-400 block">Alamat</span>
                                    <span className="text-gray-700 whitespace-pre-line leading-relaxed">{quote.customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Convert Quote to Invoice */}
            <Modal
                open={confirmConvert}
                onClose={() => setConfirmConvert(false)}
                title="Konversi Penawaran ke Invoice"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Apakah Anda yakin ingin mengonversi penawaran <strong className="text-gray-900">{quote.quote_number}</strong> menjadi invoice baru?
                        Faktur draft akan dibuat secara otomatis berdasarkan item dan nominal penawaran di bawah ini.
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2 border border-gray-200">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pelanggan</span>
                            <span className="font-medium text-gray-900">{quote.customer?.company_name || quote.customer?.contact_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Jumlah Item</span>
                            <span className="font-medium text-gray-900">{quote.items?.length || 0} item</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-mono">{formatMoney(quote.subtotal, quote.currency)}</span>
                        </div>
                        {quote.discount > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Diskon</span>
                                <span className="font-mono">-{formatMoney(quote.discount_type === 1 ? quote.subtotal * (quote.discount / 100) : quote.discount, quote.currency)}</span>
                            </div>
                        )}
                        {quote.tax_amount > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Pajak ({quote.tax_rate}%)</span>
                                <span className="font-mono">{formatMoney(quote.tax_amount, quote.currency)}</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900 text-base">
                            <span>Total Nilai Faktur</span>
                            <span className="text-indigo-600 font-mono">{formatMoney(quote.total, quote.currency)}</span>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setConfirmConvert(false)}
                            disabled={convertQuote.isPending}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="primary"
                            loading={convertQuote.isPending}
                            onClick={async () => {
                                try {
                                    const invoice = await convertQuote.mutateAsync(quote.id);
                                    toast.success('Penawaran berhasil dikonversi menjadi invoice');
                                    setConfirmConvert(false);
                                    navigate(`/invoices/${invoice.id}`);
                                } catch (err: any) {
                                    toast.error(err?.response?.data?.message || 'Gagal mengonversi penawaran');
                                }
                            }}
                        >
                            Konfirmasi & Konversi
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Modal Confirm Delete */}
            <ConfirmDialog
                open={confirmDelete}
                title="Hapus Penawaran?"
                message="Tindakan ini tidak dapat dibatalkan. Data penawaran akan dihapus secara permanen."
                confirmText="Hapus"
                cancelText="Batal"
                onConfirm={async () => {
                    await deleteQuote.mutateAsync(quote.id);
                    setConfirmDelete(false);
                    navigate('/quotes');
                    toast.success('Penawaran berhasil dihapus');
                }}
                onCancel={() => setConfirmDelete(false)}
                danger
            />

            {/* WhatsApp Share Modal */}
            <WhatsAppShareModal
                open={whatsappOpen}
                onClose={() => setWhatsappOpen(false)}
                data={{
                    entityType: 'quote',
                    id: quote.id,
                    number: quote.quote_number,
                    total: quote.total,
                    currency: quote.currency,
                    date: quote.quote_date,
                    dueDate: quote.valid_until || undefined,
                    customerName: quote.customer?.company_name || 'Pelanggan',
                    customerPhone: quote.customer?.phone,
                    publicToken: quote.public_token,
                }}
            />
        </div>
    );
}
