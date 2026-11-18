import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePayments, useDeletePayment, paymentKeys } from './hooks';
import { paymentsApi, PaymentFilters } from '../../api/payments';
import { customersApi } from '../../api/customers';
import { invoicesApi } from '../../api/invoices';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceKeys } from '../invoices/hooks';
import { PageHeader, EmptyState } from '../../components/ui/Display';
import { DataTable, Pagination } from '../../components/ui/Table';
import { Input, Select } from '../../components/ui/Form';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import { formatMoney, formatDate } from '../../lib/utils';
import toast from '../../lib/toast';
import { useSelection } from '../../components/bulk/useSelection';
import { useBulkDelete } from '../../components/bulk/useBulk';
import { BulkBar } from '../../components/bulk/BulkBar';
import { reportBulkDelete } from '../../components/bulk/result';

const METHODS = [
    { value: '', label: 'All methods' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'e_wallet', label: 'E-Wallet' },
    { value: 'other', label: 'Other' },
];

export default function PaymentListPage() {
    const [filters, setFilters] = useState<PaymentFilters>({ page: 1, per_page: 15 });
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
    const [multiPayOpen, setMultiPayOpen] = useState(false);

    // Multi-Payment Form State
    const [multiCustomerId, setMultiCustomerId] = useState('');
    const [multiAmount, setMultiAmount] = useState('');
    const [multiDate, setMultiDate] = useState(new Date().toISOString().split('T')[0]);
    const [multiMethod, setMultiMethod] = useState('bank_transfer');
    const [multiRef, setMultiRef] = useState('');
    const [multiAllocations, setMultiAllocations] = useState<Record<number, number>>({});

    const queryClient = useQueryClient();
    const { data: customersData } = useQuery({
        queryKey: ['customers-list-all'],
        queryFn: () => customersApi.list({ per_page: 100 }),
        enabled: multiPayOpen,
    });

    const { data: customerOpenInvoices } = useQuery({
        queryKey: ['customer-open-invoices', multiCustomerId],
        queryFn: () => invoicesApi.list({ customer_id: Number(multiCustomerId), per_page: 50 }),
        enabled: !!multiCustomerId,
    });

    const multiPayMutation = useMutation({
        mutationFn: (payload: any) => paymentsApi.createMulti(payload),
        onSuccess: () => {
            toast.success('Penerimaan pembayaran multi-invoice berhasil disimpan.');
            queryClient.invalidateQueries({ queryKey: paymentKeys.all });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
            setMultiPayOpen(false);
            setMultiCustomerId('');
            setMultiAmount('');
            setMultiAllocations({});
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Gagal menyimpan pembayaran.');
        },
    });

    const { data, isLoading, error } = usePayments(filters);
    const deletePayment = useDeletePayment();
    const selection = useSelection();
    const bulkDelete = useBulkDelete((id) => paymentsApi.remove(id), [paymentKeys, invoiceKeys]);

    const handleDelete = async () => {
        if (!deleteId) return;
        await deletePayment.mutateAsync(deleteId);
        toast.success('Payment deleted successfully.');
        setDeleteId(null);
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selection.selected).map(Number);
        const result = await bulkDelete.mutateAsync(ids);
        setBulkDeleteOpen(false);
        selection.clear();
        reportBulkDelete(result.total, result.failed);
        if (result.failed === 0) toast.success(`${result.total} payment(s) deleted.`);
    };

    const total = data?.data.reduce((s, p) => s + Number(p.amount), 0) ?? 0;

    if (error) return <div className="p-8 text-center text-sm text-red-600">Failed to load payments. Please try again.</div>;

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <PageHeader title="Payments & Penerimaan Kas" />
                <Button
                    onClick={() => setMultiPayOpen(true)}
                    className="bg-[#0F5A5E] hover:bg-[#083336] text-white"
                >
                    + Terima Pembayaran Multi-Invoice
                </Button>
            </div>

            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-3 sm:px-5 border-b flex flex-col sm:flex-row gap-3 flex-wrap">
                    <Input
                        placeholder="Search payment # / reference..."
                        className="w-full sm:max-w-xs"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                    <Select
                        className="w-full sm:max-w-[180px]"
                        defaultValue=""
                        onChange={(e) => setFilters({ ...filters, payment_method: e.target.value || undefined, page: 1 })}
                    >
                        {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Select>
                    <Input
                        type="date"
                        className="w-full sm:max-w-[160px]"
                        placeholder="From"
                        onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined, page: 1 })}
                    />
                    <Input
                        type="date"
                        className="w-full sm:max-w-[160px]"
                        placeholder="To"
                        onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined, page: 1 })}
                    />
                </div>

                <BulkBar count={selection.count} onClear={selection.clear}>
                    <Button size="sm" variant="danger" disabled={bulkDelete.isPending} onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                </BulkBar>

                {data && data.data.length > 0 && (
                    <div className="px-5 py-3 border-b bg-gray-50 flex justify-between text-sm">
                        <span className="text-gray-500">Total on this page</span>
                        <span className="font-medium">
                            {formatMoney(total, data.data[0].currency)}
                        </span>
                    </div>
                )}

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
                ) : !data?.data.length ? (
                    <EmptyState
                        title="No payments recorded yet"
                        message="Record a payment from an invoice detail page."
                    />
                ) : (
                    <>
                        <DataTable
                            data={data.data}
                            keyField="id"
                            selectable
                            selectedKeys={selection.selected}
                            onToggleKey={(key) => selection.toggle(key, true)}
                            onToggleAll={selection.toggleAll}
                            columns={[
                                {
                                    header: 'Payment #',
                                    accessor: (p) => (
                                        <Link to={`/payments/${p.id}`} className="text-indigo-600 hover:underline font-medium">
                                            {p.payment_number}
                                        </Link>
                                    ),
                                },
                                {
                                    header: 'Invoice',
                                    accessor: (p) => p.invoice ? (
                                        <Link to={`/invoices/${p.invoice.id}`} className="text-indigo-600 hover:underline">
                                            {p.invoice.invoice_number}
                                        </Link>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            Multi-Alokasi
                                        </span>
                                    ),
                                },
                                { header: 'Customer', accessor: (p) => p.customer?.company_name ?? '-' },
                                { header: 'Date', accessor: (p) => formatDate(p.payment_date) },
                                { header: 'Method', accessor: (p) => p.method_label },
                                { header: 'Reference', accessor: (p) => p.reference ?? '-' },
                                { header: 'Amount', accessor: (p) => formatMoney(p.amount, p.currency) },
                                {
                                    header: '',
                                    accessor: (p) => (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Delete
                                        </button>
                                    ),
                                    className: 'text-right',
                                },
                            ]}
                        />
                        <div className="px-5 py-3">
                            <Pagination
                                currentPage={data.meta.current_page}
                                lastPage={data.meta.last_page}
                                onPageChange={(p) => setFilters({ ...filters, page: p })}
                            />
                        </div>
                    </>
                )}
            </div>

            <ConfirmDialog
                open={!!deleteId}
                title="Delete payment?"
                message="This will reverse the payment and update the invoice balance."
                onConfirm={handleDelete}
                onCancel={() => setDeleteId(null)}
                danger
            />

            <ConfirmDialog
                open={bulkDeleteOpen}
                title={`Delete ${selection.count} payment(s)?`}
                message="This will reverse the payments and update the invoice balances. Payments on void/cancelled invoices are skipped."
                onConfirm={handleBulkDelete}
                onCancel={() => setBulkDeleteOpen(false)}
                danger
                confirmText="Delete"
            />

            {/* Modal Multi-Invoice Payment Allocation */}
            {multiPayOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                    <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-100 space-y-4 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-[#083336]">Penerimaan Pembayaran Multi-Invoice</h2>
                        <p className="text-xs text-gray-500">
                            Catat satu pembayaran sekaligus untuk melunasi beberapa invoice pelanggan. Sisa lebih bayar otomatis disimpan sebagai deposit saldo kredit pelanggan.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Pelanggan</label>
                                <select
                                    value={multiCustomerId}
                                    onChange={(e) => {
                                        setMultiCustomerId(e.target.value);
                                        setMultiAllocations({});
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                                >
                                    <option value="">-- Pilih Pelanggan --</option>
                                    {customersData?.data?.map((c: any) => (
                                        <option key={c.id} value={c.id}>
                                            {c.company_name} ({c.customer_number})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Total Pembayaran Diterima (Rp)</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={multiAmount}
                                        onChange={(e) => setMultiAmount(e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5 font-bold text-[#0F5A5E]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal Terima</label>
                                    <input
                                        type="date"
                                        value={multiDate}
                                        onChange={(e) => setMultiDate(e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Metode</label>
                                    <select
                                        value={multiMethod}
                                        onChange={(e) => setMultiMethod(e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                                    >
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="cash">Cash / Tunai</option>
                                        <option value="credit_card">Kartu Kredit</option>
                                        <option value="e_wallet">E-Wallet / QRIS</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">No. Referensi / Bukti Transfer</label>
                                    <input
                                        type="text"
                                        placeholder="TRF-BCA-..."
                                        value={multiRef}
                                        onChange={(e) => setMultiRef(e.target.value)}
                                        className="w-full text-sm border border-gray-300 rounded-lg p-2.5"
                                    />
                                </div>
                            </div>

                            {/* Invoices to Allocate */}
                            {multiCustomerId && (
                                <div className="space-y-2 pt-2 border-t">
                                    <label className="block text-xs font-semibold text-gray-700">
                                        Pilih Invoice yang Ingin Dilunasi:
                                    </label>
                                    {customerOpenInvoices?.data?.filter((i: any) => Number(i.balance) > 0).length === 0 ? (
                                        <div className="text-xs text-gray-400 py-2">
                                            Tidak ada invoice yang berstatus tertunggak untuk pelanggan ini. Seluruh pembayaran akan menjadi saldo kredit deposit pelanggan.
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {customerOpenInvoices?.data
                                                ?.filter((i: any) => Number(i.balance) > 0)
                                                .map((inv: any) => {
                                                    const isChecked = !!multiAllocations[inv.id];
                                                    return (
                                                        <div
                                                            key={inv.id}
                                                            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        const updated = { ...multiAllocations };
                                                                        if (e.target.checked) {
                                                                            updated[inv.id] = Number(inv.balance);
                                                                        } else {
                                                                            delete updated[inv.id];
                                                                        }
                                                                        setMultiAllocations(updated);
                                                                    }}
                                                                />
                                                                <div>
                                                                    <div className="font-semibold text-gray-800">{inv.invoice_number}</div>
                                                                    <div className="text-gray-400">Sisa Tagihan: {formatMoney(inv.balance)}</div>
                                                                </div>
                                                            </div>
                                                            {isChecked && (
                                                                <input
                                                                    type="number"
                                                                    max={inv.balance}
                                                                    value={multiAllocations[inv.id] || ''}
                                                                    onChange={(e) => {
                                                                        const val = Number(e.target.value);
                                                                        setMultiAllocations({
                                                                            ...multiAllocations,
                                                                            [inv.id]: val,
                                                                        });
                                                                    }}
                                                                    className="w-28 border border-gray-300 rounded p-1 text-right text-xs"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setMultiPayOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!multiCustomerId || !multiAmount || multiPayMutation.isPending}
                                    onClick={() => {
                                        const allocationsArr = Object.entries(multiAllocations).map(([invId, amt]) => ({
                                            invoice_id: Number(invId),
                                            amount: amt,
                                        }));

                                        multiPayMutation.mutate({
                                            customer_id: Number(multiCustomerId),
                                            amount: Number(multiAmount),
                                            payment_date: multiDate,
                                            payment_method: multiMethod,
                                            reference: multiRef,
                                            allocations: allocationsArr,
                                        });
                                    }}
                                    className="bg-[#0F5A5E] text-white"
                                >
                                    {multiPayMutation.isPending ? 'Menyimpan...' : 'Simpan Pembayaran'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
