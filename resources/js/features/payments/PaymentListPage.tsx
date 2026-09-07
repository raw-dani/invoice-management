import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePayments, useDeletePayment, paymentKeys } from './hooks';
import { paymentsApi, PaymentFilters } from '../../api/payments';
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
            <PageHeader title="Payments" />

            <div className="bg-white shadow rounded-lg">
                <div className="px-5 py-3 border-b flex gap-3 flex-wrap">
                    <Input
                        placeholder="Search payment # / reference..."
                        className="max-w-xs"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                    <Select
                        className="max-w-[180px]"
                        defaultValue=""
                        onChange={(e) => setFilters({ ...filters, payment_method: e.target.value || undefined, page: 1 })}
                    >
                        {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </Select>
                    <Input
                        type="date"
                        className="max-w-[160px]"
                        placeholder="From"
                        onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined, page: 1 })}
                    />
                    <Input
                        type="date"
                        className="max-w-[160px]"
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
                                    ) : '-',
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
        </>
    );
}
