import { Link, useParams, useNavigate } from 'react-router-dom';
import {
    useInvoice,
    useMarkInvoiceSent,
    useVoidInvoice,
    useDeleteInvoice,
    useDuplicateInvoice,
    useSendInvoiceEmail,
    useApproveProof,
    useRejectProof,
} from './hooks';
import { useDeletePayment } from '../payments/hooks';
import { useEntityActivityLogs } from '../activity/hooks';
import { Card, CardBody, CardHeader, StatusBadge, EmptyState } from '../../components/ui/Display';
import Button from '../../components/ui/Button';
import { Modal, ConfirmDialog } from '../../components/ui/Modal';
import { formatMoney, formatDate } from '../../lib/utils';
import { useState, useRef, useEffect } from 'react';
import toast from '../../lib/toast';
import { RecordPaymentForm } from '../payments/RecordPaymentForm';
import { downloadPdf, openPdfInNewTab, pdfUrls } from '../../lib/pdf';
import { WhatsAppShareModal } from '../../components/WhatsAppShareModal';
import {
    WhatsAppIcon,
    LinkIcon,
    EyeIcon,
    ArrowDownTrayIcon,
    DocumentDuplicateIcon,
    CreditCardIcon,
    PencilSquareIcon,
    PaperAirplaneIcon,
    EnvelopeIcon,
    PauseCircleIcon,
    TrashIcon,
    BellIcon,
    CheckIcon,
    XMarkIcon,
    TargetIcon,
    CalendarIcon,
    ClockIcon,
    BuildingOfficeIcon,
    ReceiptPercentIcon,
    ChevronDownIcon,
    EllipsisHorizontalIcon,
} from '../../components/ui/Icons';
import type { ActivityLog } from '../../types';

export default function InvoiceDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [confirmVoid, setConfirmVoid] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<number | null>(null);
    const [showActivity, setShowActivity] = useState(false);
    const [whatsappOpen, setWhatsappOpen] = useState(false);
    const [confirmApproveProof, setConfirmApproveProof] = useState(false);
    const [confirmRejectProof, setConfirmRejectProof] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef<HTMLDivElement>(null);

    const { data: invoice, isLoading } = useInvoice(Number(id));
    const markSent = useMarkInvoiceSent();
    const voidInvoice = useVoidInvoice();
    const deleteInvoice = useDeleteInvoice();
    const deletePayment = useDeletePayment();
    const duplicateInvoice = useDuplicateInvoice();
    const sendEmail = useSendInvoiceEmail();
    const approveProof = useApproveProof();
    const rejectProof = useRejectProof();
    const { data: activityData } = useEntityActivityLogs('Invoice', Number(id));

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
                    <p className="text-sm text-gray-500">Memuat rincian invoice...</p>
                </div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                    title="Invoice Tidak Ditemukan"
                    message="Invoice yang Anda cari mungkin telah dihapus atau tidak tersedia."
                    action={
                        <Link to="/invoices">
                            <Button variant="secondary">Kembali ke Daftar Invoice</Button>
                        </Link>
                    }
                />
            </div>
        );
    }

    const isDraft = invoice.status === 'draft';
    const canRecordPayment = !['paid', 'void', 'cancelled'].includes(invoice.status) && invoice.balance > 0;
    const isOverdue = invoice.status === 'overdue' || (invoice.balance > 0 && new Date(invoice.due_date) < new Date());

    return (
        <div className="space-y-6">
            {/* Top Back Navigation Bar */}
            <div className="flex items-center justify-between">
                <Link
                    to="/invoices"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-indigo-600 transition-colors"
                >
                    <span>&larr;</span>
                    <span>Kembali ke Daftar Invoice</span>
                </Link>
                <div className="text-xs text-gray-400 font-mono">
                    ID #{invoice.id}
                </div>
            </div>

            {/* Document Header & Organized Action Bar */}
            <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            {invoice.invoice_number}
                        </h1>
                        <StatusBadge status={invoice.status} className="text-xs font-semibold px-2.5 py-0.5" />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                        Kepada: <strong className="text-gray-800 font-medium">{invoice.customer?.company_name}</strong> · Jatuh Tempo: <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-gray-700'}>{formatDate(invoice.due_date)}</span>
                    </p>
                </div>

                {/* Tiered Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Primary Workflow CTA */}
                    {canRecordPayment && (
                        <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                            onClick={() => setPaymentOpen(true)}
                        >
                            <CreditCardIcon className="w-4 h-4" />
                            <span>Catat Pembayaran</span>
                        </Button>
                    )}
                    {isDraft && (
                        <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-xs"
                            loading={markSent.isPending}
                            onClick={async () => {
                                await markSent.mutateAsync(invoice.id);
                                toast.success('Invoice berhasil ditandai sebagai terkirim');
                            }}
                        >
                            <PaperAirplaneIcon className="w-4 h-4" />
                            <span>Tandai Terkirim</span>
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
                            const url = `${window.location.origin}/i/${invoice.public_token || invoice.id}`;
                            navigator.clipboard.writeText(url);
                            toast.success('Tautan Portal Klien berhasil disalin!');
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
                                        pdfUrls.invoice(invoice.id),
                                        `invoice-${invoice.invoice_number}.pdf`
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
                                    await openPdfInNewTab(pdfUrls.invoice(invoice.id));
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
                                    {isDraft && (
                                        <Link
                                            to={`/invoices/${invoice.id}/edit`}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                            onClick={() => setMoreOpen(false)}
                                        >
                                            <PencilSquareIcon className="w-4 h-4 text-gray-500" />
                                            <span>Edit Invoice</span>
                                        </Link>
                                    )}
                                    <button
                                        type="button"
                                        disabled={duplicateInvoice.isPending}
                                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        onClick={async () => {
                                            setMoreOpen(false);
                                            try {
                                                const copy = await duplicateInvoice.mutateAsync(invoice.id);
                                                toast.success('Invoice berhasil digandakan');
                                                navigate(`/invoices/${copy.id}`);
                                            } catch {
                                                toast.error('Gagal menduplikasi invoice');
                                            }
                                        }}
                                    >
                                        <DocumentDuplicateIcon className="w-4 h-4 text-gray-500" />
                                        <span>Duplikat Invoice</span>
                                    </button>
                                    {!isDraft && !['paid', 'void', 'cancelled'].includes(invoice.status) && (
                                        <button
                                            type="button"
                                            disabled={sendEmail.isPending}
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                                            onClick={async () => {
                                                setMoreOpen(false);
                                                await sendEmail.mutateAsync({ id: invoice.id });
                                                toast.success('Email invoice berhasil dikirim ke klien');
                                            }}
                                        >
                                            <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                                            <span>Kirim Email Klien</span>
                                        </button>
                                    )}
                                </div>

                                {!['paid', 'void'].includes(invoice.status) && (
                                    <div className="py-1">
                                        <button
                                            type="button"
                                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-amber-700 hover:bg-amber-50 transition-colors"
                                            onClick={() => {
                                                setMoreOpen(false);
                                                setConfirmVoid(true);
                                            }}
                                        >
                                            <PauseCircleIcon className="w-4 h-4 text-amber-600" />
                                            <span>Batalkan (Void)</span>
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
                                        <span>Hapus Invoice</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Proof Pending Review Banner */}
            {invoice.payment_proof_status === 'pending' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                            <BellIcon className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-amber-900">
                                Bukti Pembayaran Diterima dari Klien
                            </h4>
                            <p className="text-xs text-amber-800 mt-0.5">
                                Klien mengunggah bukti transfer {invoice.payment_proof_uploaded_at ? `pada ${formatDate(invoice.payment_proof_uploaded_at)}` : ''}.
                                {invoice.payment_proof_notes && <span className="block italic mt-0.5">Catatan klien: "{invoice.payment_proof_notes}"</span>}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {invoice.payment_proof_path && (
                            <a
                                href={invoice.payment_proof_path}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-md hover:bg-indigo-50 shadow-2xs"
                            >
                                <EyeIcon className="w-3.5 h-3.5" />
                                <span>Lihat Bukti Transfer</span>
                            </a>
                        )}
                        <Button
                            size="sm"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            loading={approveProof.isPending}
                            onClick={() => setConfirmApproveProof(true)}
                        >
                            <CheckIcon className="w-3.5 h-3.5" />
                            <span>Setujui & Tandai Lunas</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="danger"
                            className="inline-flex items-center gap-1.5"
                            loading={rejectProof.isPending}
                            onClick={() => setConfirmRejectProof(true)}
                        >
                            <XMarkIcon className="w-3.5 h-3.5" />
                            <span>Tolak Bukti</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Payment Proof Rejected Banner */}
            {invoice.payment_proof_status === 'rejected' && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <XMarkIcon className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                        <strong>Bukti Pembayaran Ditolak:</strong> {invoice.payment_proof_notes || 'Bukti transfer sebelumnya ditolak oleh admin.'}
                    </div>
                </div>
            )}

            {/* Project Milestone Tagihan Banner */}
            {invoice.milestone_name && (
                <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                            {invoice.milestone_sequence || <TargetIcon className="w-5 h-5 text-white" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                                    Tagihan Proyek Bertermin {invoice.milestone_sequence && invoice.milestone_total_termins ? `(Tahap ${invoice.milestone_sequence} dari ${invoice.milestone_total_termins})` : ''}
                                </span>
                                {invoice.milestone_percentage && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                                        Bobot {invoice.milestone_percentage}%
                                    </span>
                                )}
                            </div>
                            <h4 className="font-semibold text-sm text-gray-900 mt-0.5">
                                {invoice.milestone_name}
                            </h4>
                        </div>
                    </div>
                    {invoice.quote_id && (
                        <Link
                            to={`/quotes/${invoice.quote_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 px-3 py-1.5 rounded-lg hover:bg-indigo-50 shadow-2xs transition-colors self-start sm:self-center"
                        >
                            <span>Lihat Penawaran Proyek</span>
                            <span>&rarr;</span>
                        </Link>
                    )}
                </div>
            )}

            {/* Executive KPI Summary Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tagihan</span>
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <ReceiptPercentIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-gray-950">
                        {formatMoney(invoice.total, invoice.currency)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Subtotal {formatMoney(invoice.subtotal, invoice.currency)}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sudah Dibayar</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <CreditCardIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="mt-2 text-xl font-bold font-mono text-emerald-600">
                        {formatMoney(invoice.paid_amount, invoice.currency)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        {invoice.payments?.length || 0} pembayaran tercatat
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sisa Tagihan</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${invoice.balance <= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <ClockIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`mt-2 text-xl font-bold font-mono ${invoice.balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatMoney(invoice.balance, invoice.currency)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        {invoice.balance <= 0 ? 'Lunas Sepenuhnya' : 'Menunggu Pembayaran'}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Jatuh Tempo</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div className={`mt-2 text-base font-semibold ${isOverdue ? 'text-rose-600' : 'text-gray-900'}`}>
                        {formatDate(invoice.due_date)}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Diterbitkan: {formatDate(invoice.invoice_date)}
                    </div>
                </div>
            </div>

            {/* Main Content Layout (Structured 8-cols & 4-cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (8 cols): Items Table, Notes & Terms, Payments, Activity */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Items Table Card */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">Rincian Item Tagihan</h3>
                                <p className="text-xs text-gray-500">Daftar produk atau jasa yang ditagihkan kepada pelanggan</p>
                            </div>
                            <span className="text-xs font-medium px-2.5 py-1 bg-slate-100 text-gray-700 rounded-full">
                                {invoice.items?.length || 0} Item
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
                                    {invoice.items?.map((it, idx) => (
                                        <tr key={it.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="py-3.5 px-4 text-xs font-mono text-gray-400">{idx + 1}</td>
                                            <td className="py-3.5 px-4 font-medium text-gray-900">
                                                {it.description}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-gray-700">
                                                {it.quantity}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono text-gray-600">
                                                {formatMoney(it.unit_price, invoice.currency)}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-mono font-semibold text-gray-950">
                                                {formatMoney(it.total, invoice.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Notes & Terms Section */}
                    {(invoice.notes || invoice.terms) && (
                        <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 space-y-4">
                            <h3 className="font-semibold text-gray-900 text-sm">Informasi & Ketentuan</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {invoice.notes && (
                                    <div className="p-3.5 bg-slate-50 rounded-lg border border-gray-200/60 space-y-1">
                                        <span className="font-semibold text-gray-700 block">Catatan Tambahan:</span>
                                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
                                    </div>
                                )}
                                {invoice.terms && (
                                    <div className="p-3.5 bg-slate-50 rounded-lg border border-gray-200/60 space-y-1">
                                        <span className="font-semibold text-gray-700 block">Syarat & Ketentuan:</span>
                                        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{invoice.terms}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Payment History Section */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">Riwayat Pembayaran</h3>
                                <p className="text-xs text-gray-500">Daftar transaksi pembayaran yang tercatat untuk faktur ini</p>
                            </div>
                            {canRecordPayment && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="inline-flex items-center gap-1"
                                    onClick={() => setPaymentOpen(true)}
                                >
                                    <CreditCardIcon className="w-3.5 h-3.5 text-gray-600" />
                                    <span>Catat Pembayaran</span>
                                </Button>
                            )}
                        </div>

                        {(!invoice.payments || invoice.payments.length === 0) ? (
                            <div className="p-8 text-center text-xs text-gray-400">
                                Belum ada riwayat pembayaran yang tercatat untuk faktur ini.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/80 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                        <tr>
                                            <th className="py-3 px-4 text-left">Tanggal</th>
                                            <th className="py-3 px-4 text-left">Metode</th>
                                            <th className="py-3 px-4 text-left">Referensi / Catatan</th>
                                            <th className="py-3 px-4 text-right">Jumlah</th>
                                            <th className="py-3 px-4 text-center w-20">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.payments.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-4 text-xs font-medium text-gray-700">
                                                    {formatDate(p.payment_date)}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-gray-600 capitalize">
                                                    {p.payment_method?.replace(/_/g, ' ') || 'Transfer Bank'}
                                                </td>
                                                <td className="py-3.5 px-4 text-xs text-gray-500">
                                                    {p.reference || p.notes || '-'}
                                                </td>
                                                <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600">
                                                    {formatMoney(p.amount, invoice.currency)}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        className="text-xs text-rose-600 hover:text-rose-800 font-medium inline-flex items-center gap-1"
                                                        onClick={() => setPaymentToDelete(p.id)}
                                                    >
                                                        <TrashIcon className="w-3.5 h-3.5" />
                                                        <span>Hapus</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Activity Log */}
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-gray-900">Riwayat Aktivitas</h3>
                                    <p className="text-xs text-gray-500">Log perubahan dan interaksi pada invoice ini</p>
                                </div>
                                <Button size="sm" variant="secondary" onClick={() => setShowActivity(!showActivity)}>
                                    {showActivity ? 'Sembunyikan' : 'Tampilkan'}
                                </Button>
                            </div>
                        </CardHeader>
                        {showActivity && (
                            <CardBody>
                                {!activityData?.data?.length ? (
                                    <EmptyState title="Belum ada riwayat aktivitas" message="Aksi pada invoice ini akan dicatat di sini." />
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
                        <h3 className="font-semibold text-gray-900 text-sm border-b pb-3">Ringkasan Pembayaran</h3>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatMoney(invoice.subtotal, invoice.currency)}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-rose-600">
                                    <span>{invoice.discount_type === 1 ? `Diskon (${invoice.discount}%)` : 'Diskon'}</span>
                                    <span className="font-mono">
                                        -{formatMoney(invoice.discount_type === 1 ? invoice.subtotal * (invoice.discount / 100) : invoice.discount, invoice.currency)}
                                    </span>
                                </div>
                            )}
                            {invoice.tax_amount > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Pajak ({invoice.tax_rate}%)</span>
                                    <span className="font-mono">+{formatMoney(invoice.tax_amount, invoice.currency)}</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-gray-100 flex justify-between font-semibold text-gray-900">
                                <span>Total Tagihan</span>
                                <span className="font-mono">{formatMoney(invoice.total, invoice.currency)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-600">
                                <span>Sudah Dibayar</span>
                                <span className="font-mono">-{formatMoney(invoice.paid_amount, invoice.currency)}</span>
                            </div>
                            <div className={`pt-3 border-t border-gray-200 flex justify-between items-baseline font-bold ${invoice.balance <= 0 ? 'text-emerald-700' : 'text-gray-950'}`}>
                                <span className="text-base">Sisa Tagihan</span>
                                <span className={`text-xl font-mono ${invoice.balance <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatMoney(invoice.balance, invoice.currency)}
                                </span>
                            </div>
                        </div>

                        <div className="pt-3 border-t text-xs text-gray-500 space-y-1 bg-slate-50 p-3 rounded-lg">
                            <div className="flex justify-between">
                                <span>Tanggal Terbit:</span>
                                <span className="font-medium text-gray-700">{formatDate(invoice.invoice_date)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Jatuh Tempo:</span>
                                <span className={`font-medium ${isOverdue ? 'text-rose-600' : 'text-gray-700'}`}>{formatDate(invoice.due_date)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Customer Details Card */}
                    <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-semibold text-gray-900 text-sm">Rincian Klien</h3>
                            <Link
                                to={`/customers/${invoice.customer_id}`}
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                                Lihat Profil &rarr;
                            </Link>
                        </div>
                        <div className="space-y-3 text-xs">
                            <div>
                                <span className="text-gray-400 block">Nama Perusahaan</span>
                                <span className="font-semibold text-gray-900 text-sm">{invoice.customer?.company_name || '-'}</span>
                            </div>
                            {invoice.customer?.contact_name && (
                                <div>
                                    <span className="text-gray-400 block">Kontak Personal</span>
                                    <span className="text-gray-700 font-medium">{invoice.customer.contact_name}</span>
                                </div>
                            )}
                            {invoice.customer?.email && (
                                <div>
                                    <span className="text-gray-400 block">Email</span>
                                    <span className="text-gray-700">{invoice.customer.email}</span>
                                </div>
                            )}
                            {invoice.customer?.phone && (
                                <div>
                                    <span className="text-gray-400 block">Telepon</span>
                                    <span className="text-gray-700">{invoice.customer.phone}</span>
                                </div>
                            )}
                            {invoice.customer?.address && (
                                <div>
                                    <span className="text-gray-400 block">Alamat</span>
                                    <span className="text-gray-700 whitespace-pre-line leading-relaxed">{invoice.customer.address}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Record Payment */}
            {paymentOpen && (
                <RecordPaymentForm
                    invoice={invoice}
                    open={paymentOpen}
                    onClose={() => setPaymentOpen(false)}
                />
            )}

            {/* Confirm Dialog Void Invoice */}
            <ConfirmDialog
                open={confirmVoid}
                title="Batalkan (Void) Invoice?"
                message="Invoice ini akan dibatalkan secara permanen dan tidak dapat diproses pembayaran lebih lanjut."
                confirmText="Batalkan Invoice"
                cancelText="Kembali"
                onConfirm={async () => {
                    await voidInvoice.mutateAsync(invoice.id);
                    setConfirmVoid(false);
                    toast.success('Invoice berhasil dibatalkan (void)');
                }}
                onCancel={() => setConfirmVoid(false)}
                danger
            />

            {/* Confirm Dialog Delete Invoice */}
            <ConfirmDialog
                open={confirmDelete}
                title="Hapus Invoice?"
                message="Tindakan ini tidak dapat dibatalkan. Data invoice dan seluruh item terkait akan dihapus secara permanen."
                confirmText="Hapus"
                cancelText="Batal"
                onConfirm={async () => {
                    await deleteInvoice.mutateAsync(invoice.id);
                    setConfirmDelete(false);
                    navigate('/invoices');
                    toast.success('Invoice berhasil dihapus');
                }}
                onCancel={() => setConfirmDelete(false)}
                danger
            />

            {/* Confirm Dialog Delete Payment Entry */}
            <ConfirmDialog
                open={paymentToDelete !== null}
                title="Hapus Catatan Pembayaran?"
                message="Pembayaran ini akan dihapus dan sisa tagihan invoice akan diperbarui kembali."
                confirmText="Hapus Pembayaran"
                cancelText="Batal"
                onConfirm={async () => {
                    if (paymentToDelete) {
                        await deletePayment.mutateAsync(paymentToDelete);
                        setPaymentToDelete(null);
                        toast.success('Pembayaran berhasil dihapus');
                    }
                }}
                onCancel={() => setPaymentToDelete(null)}
                danger
            />

            {/* Confirm Dialog Approve Payment Proof */}
            <ConfirmDialog
                open={confirmApproveProof}
                title="Setujui Bukti Pembayaran?"
                message="Invoice akan otomatis ditandai lunas (Paid) dan pembayaran akan dicatat ke dalam riwayat invoice."
                confirmText="Setujui & Tandai Lunas"
                cancelText="Batal"
                onConfirm={async () => {
                    await approveProof.mutateAsync({ id: invoice.id });
                    setConfirmApproveProof(false);
                    toast.success('Bukti pembayaran disetujui & invoice ditandai lunas.');
                }}
                onCancel={() => setConfirmApproveProof(false)}
            />

            {/* Modal Reject Payment Proof */}
            <Modal
                open={confirmRejectProof}
                onClose={() => {
                    setConfirmRejectProof(false);
                    setRejectReason('');
                }}
                title="Tolak Bukti Pembayaran"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Harap berikan alasan penolakan agar klien dapat memperbaiki atau mengunggah ulang bukti transfer yang valid.
                    </p>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Alasan Penolakan:
                        </label>
                        <textarea
                            className="w-full text-sm border rounded-lg p-2.5 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                            rows={3}
                            placeholder="Contoh: Nominal transfer tidak sesuai dengan tagihan, atau foto struk tidak terbaca jelas."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                setConfirmRejectProof(false);
                                setRejectReason('');
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            variant="danger"
                            loading={rejectProof.isPending}
                            onClick={async () => {
                                await rejectProof.mutateAsync({ id: invoice.id, reason: rejectReason });
                                setConfirmRejectProof(false);
                                setRejectReason('');
                                toast.success('Bukti pembayaran ditolak.');
                            }}
                        >
                            Tolak Bukti
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* WhatsApp Share Modal */}
            <WhatsAppShareModal
                open={whatsappOpen}
                onClose={() => setWhatsappOpen(false)}
                data={{
                    entityType: 'invoice',
                    id: invoice.id,
                    number: invoice.invoice_number,
                    total: invoice.total,
                    currency: invoice.currency,
                    date: invoice.invoice_date,
                    dueDate: invoice.due_date,
                    customerName: invoice.customer?.company_name || 'Pelanggan',
                    customerPhone: invoice.customer?.phone,
                    publicToken: invoice.public_token,
                }}
            />
        </div>
    );
}
